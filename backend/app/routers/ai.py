from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.config import MAX_FILE_SIZE
from app.models import models, schemas
from app.services.ai_service import ai_service
from app.services.pdf_processor import ocr_service

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/ocr-image")
async def ocr_image(file: UploadFile = File(...)):
    """Extract text from an uploaded image using OCR."""
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files are allowed")

    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="Image is too large")

    try:
        text = ocr_service.extract_text_from_bytes(content)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))

    if not text:
        raise HTTPException(status_code=422, detail="Could not extract readable text from image")

    return {"text": text}

@router.post("/evaluate", response_model=schemas.AIEvaluationResponse)
async def evaluate_answer(request: schemas.AIEvaluationRequest):
    """Evaluate a student answer using AI"""
    try:
        result = await ai_service.evaluate_answer(
            question=request.question,
            student_answer=request.student_answer,
            max_marks=request.max_marks,
            marking_scheme=request.marking_scheme
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI evaluation failed: {str(e)}")

@router.get("/predict/{subject_id}", response_model=schemas.PredictionResponse)
async def predict_questions(subject_id: int, db: Session = Depends(get_db)):
    """Predict likely questions for upcoming exam"""
    # Get subject
    subject = db.query(models.Subject).filter(models.Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    
    # Get all questions for subject with frequency counts
    questions = db.query(models.Question).filter(
        models.Question.subject_id == subject_id
    ).all()
    
    # Prepare data for AI
    questions_data = []
    for q in questions:
        # Count how many times this question appeared
        similar_count = db.query(models.Question).filter(
            models.Question.subject_id == subject_id,
            models.Question.content.ilike(f"%{q.content[:50]}%")
        ).count()
        
        questions_data.append({
            "id": q.id,
            "content": q.content,
            "marks": q.marks,
            "year": q.year,
            "frequency_count": similar_count,
            "topics": q.topics
        })
    
    # Get predictions from AI
    try:
        predictions = await ai_service.predict_questions(
            subject_name=subject.name,
            questions_data=questions_data
        )
        
        # Organize by probability
        high_prob = []
        medium_prob = []
        
        for pred in predictions:
            prob = pred.get("probability", 0)
            question = db.query(models.Question).filter(
                models.Question.id == pred.get("question_id")
            ).first()
            
            if question:
                pred_data = schemas.QuestionPrediction(
                    question_id=question.id,
                    content=question.content,
                    probability=prob,
                    reasoning=pred.get("reasoning", ""),
                    frequency_count=sum(1 for q in questions if q.content[:50] in question.content)
                )
                
                if prob >= 70:
                    high_prob.append(pred_data)
                elif prob >= 50:
                    medium_prob.append(pred_data)
        
        return schemas.PredictionResponse(
            subject_id=subject_id,
            subject_name=subject.name,
            high_probability=sorted(high_prob, key=lambda x: x.probability, reverse=True),
            medium_probability=sorted(medium_prob, key=lambda x: x.probability, reverse=True),
            generated_at=__import__('datetime').datetime.utcnow()
        )
        
    except Exception as e:
        # Return fallback predictions based on frequency
        frequent = db.query(models.Question).filter(
            models.Question.subject_id == subject_id,
            models.Question.frequency_score >= 2.0
        ).order_by(models.Question.frequency_score.desc()).limit(10).all()
        
        high_prob = [
            schemas.QuestionPrediction(
                question_id=q.id,
                content=q.content,
                probability=min(85.0, q.frequency_score * 15),
                reasoning="Frequently asked in past exams",
                frequency_count=int(q.frequency_score)
            )
            for q in frequent[:5]
        ]
        
        return schemas.PredictionResponse(
            subject_id=subject_id,
            subject_name=subject.name,
            high_probability=high_prob,
            medium_probability=[],
            generated_at=__import__('datetime').datetime.utcnow()
        )

@router.post("/doubt", response_model=schemas.DoubtResponse)
async def clear_doubt(request: schemas.DoubtRequest, db: Session = Depends(get_db)):
    """Clear student doubts using AI"""
    subject_context = None
    if request.subject_id:
        subject = db.query(models.Subject).filter(models.Subject.id == request.subject_id).first()
        if subject:
            subject_context = f"Subject: {subject.name}"
    
    try:
        result = await ai_service.answer_doubt(
            question=request.question,
            subject_context=subject_context
        )
        
        # Search for YouTube videos
        search_keywords = result.get("search_keywords", [])
        if not search_keywords:
            # Extract keywords from question
            search_keywords = request.question.split()[:5]
        
        # For now, return search URLs
        # In production, you'd integrate with YouTube Data API
        suggested_videos = []
        for keyword in search_keywords[:3]:
            suggested_videos.append({
                "title": f"Search: {keyword}",
                "url": f"https://www.youtube.com/results?search_query={keyword.replace(' ', '+')}",
                "thumbnail": "",
                "duration": ""
            })
        
        return schemas.DoubtResponse(
            answer=result.get("answer", ""),
            related_topics=result.get("related_topics", []),
            suggested_videos=suggested_videos
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get answer: {str(e)}")


@router.post("/doubt-with-image", response_model=schemas.DoubtResponse)
async def clear_doubt_with_image(
    question: str = Form(...),
    subject_id: int | None = Form(default=None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Clear student doubts using AI with an attached image."""
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files are allowed")

    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="Image is too large")

    subject_context = None
    if subject_id:
        subject = db.query(models.Subject).filter(models.Subject.id == subject_id).first()
        if subject:
            subject_context = f"Subject: {subject.name}"

    try:
        result = await ai_service.answer_doubt_with_image(
            question=question,
            subject_context=subject_context,
            image_bytes=content,
            mime_type=file.content_type,
        )

        search_keywords = result.get("search_keywords", [])
        if not search_keywords:
            search_keywords = question.split()[:5]

        suggested_videos = []
        for keyword in search_keywords[:3]:
            suggested_videos.append({
                "title": f"Search: {keyword}",
                "url": f"https://www.youtube.com/results?search_query={keyword.replace(' ', '+')}",
                "thumbnail": "",
                "duration": ""
            })

        return schemas.DoubtResponse(
            answer=result.get("answer", ""),
            related_topics=result.get("related_topics", []),
            suggested_videos=suggested_videos
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get image-based answer: {str(e)}")

@router.post("/stress-support", response_model=schemas.StressSessionResponse)
async def stress_support(request: schemas.StressSessionRequest):
    """Get AI-based stress support"""
    try:
        result = await ai_service.stress_support(
            mood=request.mood,
            message=request.message
        )
        
        # In production, save to database
        return schemas.StressSessionResponse(
            session_id=1,  # Generated ID
            mood=request.mood,
            ai_response=result.get("response", ""),
            coping_strategy=result.get("coping_strategy", ""),
            motivational_quote=result.get("motivational_quote", "")
        )
        
    except Exception as e:
        # Return fallback response
        return schemas.StressSessionResponse(
            session_id=1,
            mood=request.mood,
            ai_response="Take a deep breath. You're doing your best, and that's what matters most.",
            coping_strategy="Try the 4-7-8 breathing technique: Inhale for 4 seconds, hold for 7, exhale for 8.",
            motivational_quote="Success is the sum of small efforts repeated day in and day out."
        )
