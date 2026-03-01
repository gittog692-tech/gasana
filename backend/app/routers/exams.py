import os
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional, Dict
from datetime import datetime
from app.core.database import get_db
from app.core.config import UPLOAD_DIR
from app.models import models, schemas
from app.services.ai_service import ai_service
from app.services.pdf_processor import ocr_service
from app.services.file_service import file_service

router = APIRouter(prefix="/exams", tags=["exams"])


def _resolve_answer_image_path(image_path: str) -> str:
    if not image_path:
        return ""

    normalized = image_path.strip()
    if not normalized:
        return ""

    if os.path.isabs(normalized) and os.path.exists(normalized):
        return normalized

    if os.path.exists(normalized):
        return os.path.abspath(normalized)

    upload_root = os.path.abspath(UPLOAD_DIR)
    relative = normalized
    if relative.startswith("/uploads/"):
        relative = relative[len("/uploads/"):]
    elif relative.startswith("uploads/"):
        relative = relative[len("uploads/"):]

    candidate = os.path.abspath(os.path.join(upload_root, relative))
    if candidate.startswith(upload_root) and os.path.exists(candidate):
        return candidate

    return ""


@router.post("/upload-answer-image")
async def upload_answer_image(
    exam_id: int = Form(...),
    question_id: int = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    exam = db.query(models.Exam).filter(models.Exam.id == exam_id).first()
    question = db.query(models.Question).filter(models.Question.id == question_id).first()

    if not exam or not question:
        raise HTTPException(status_code=404, detail="Exam or question not found")

    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files are allowed")

    try:
        saved = await file_service.save_answer_image(file, exam_id, question_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    absolute_upload_dir = os.path.abspath(UPLOAD_DIR)
    absolute_file_path = os.path.abspath(saved["path"])
    relative_path = os.path.relpath(absolute_file_path, absolute_upload_dir).replace("\\", "/")

    return {
        "url": f"/uploads/{relative_path}",
        "path": absolute_file_path,
        "filename": saved["filename"],
        "original_name": saved["original_name"]
    }

@router.post("/start", response_model=schemas.ExamResponse)
def start_exam(exam_data: schemas.ExamCreate, db: Session = Depends(get_db)):
    """Start a new mock exam"""
    # Get subject to calculate total marks
    subject = db.query(models.Subject).filter(models.Subject.id == exam_data.subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    if not subject.questions:
        raise HTTPException(status_code=400, detail="No questions available for this subject")
    
    # Create exam
    db_exam = models.Exam(
        user_id=1,  # TODO: Get from auth
        subject_id=exam_data.subject_id,
        total_marks=sum([q.marks for q in subject.questions[:10]]),  # Default first 10
        status="in_progress"
    )
    db.add(db_exam)
    db.commit()
    db.refresh(db_exam)
    
    return db_exam

@router.post("/simulate")
async def create_simulated_exam(config: schemas.ExamSimulationConfig, db: Session = Depends(get_db)):
    """Create an exam with simulated questions based on config"""
    subject = db.query(models.Subject).filter(models.Subject.id == config.subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    # Build question pool
    question_pool = []

    if config.is_adaptive:
        user_id = 1  # TODO: Auth
        masteries = db.query(models.StudentMastery).join(models.Concept).filter(
            models.StudentMastery.user_id == user_id,
            models.Concept.subject_id == config.subject_id
        ).all()

        if not masteries:
            config.include_frequent = True
        else:
            weak_concepts = sorted(masteries, key=lambda m: m.mastery_score)
            all_subj_q = db.query(models.Question).filter(models.Question.subject_id == config.subject_id).all()
            for mc in weak_concepts[:5]:
                for q in all_subj_q:
                    if q.topics and mc.concept.name in q.topics:
                        question_pool.append(q)
            if len(question_pool) < config.num_questions:
                config.include_frequent = True

    if config.include_frequent:
        frequent = db.query(models.Question).filter(
            models.Question.subject_id == config.subject_id,
            models.Question.frequency_score >= 2.0
        ).all()
        question_pool.extend(frequent)

    if config.include_predicted:
        # Get predicted questions (implementation depends on prediction model)
        recent = db.query(models.Question).filter(
            models.Question.subject_id == config.subject_id
        ).order_by(models.Question.year.desc()).limit(20).all()
        question_pool.extend(recent)

    # Remove duplicates and limit
    seen_ids = set()
    unique_questions = []
    for q in question_pool:
        if q.id not in seen_ids:
            seen_ids.add(q.id)
            unique_questions.append(q)

    selected_questions = unique_questions[:config.num_questions]

    if not selected_questions:
        raise HTTPException(status_code=400, detail="No questions available for this exam configuration")

    # Generate MCQ options if requested and not already present
    subject_context = f"{subject.name} ({subject.code})"
    for q in selected_questions:
        if config.generate_mcqs and not q.mcq_options:
            try:
                mcq_opts = await ai_service.generate_mcq_options(q.content, subject_context)
                if mcq_opts:
                    q.mcq_options = mcq_opts
                    db.commit()  # Save to DB for future use
            except Exception as e:
                print(f"[Exam] Failed to generate MCQs for Q{q.id}: {e}")

    # Create exam
    db_exam = models.Exam(
        user_id=1,  # TODO: Get from auth
        subject_id=config.subject_id,
        total_marks=sum([q.marks for q in selected_questions]),
        status="in_progress"
    )
    db.add(db_exam)
    db.commit()
    db.refresh(db_exam)

    # Prepare exam data
    exam_data = {
        "exam_id": db_exam.id,
        "subject": subject.name,
        "duration_minutes": config.duration_minutes,
        "total_marks": db_exam.total_marks,
        "allow_written": config.allow_written,
        "questions": [
            {
                "id": q.id,
                "content": q.content,
                "marks": q.marks,
                "frequency_score": q.frequency_score,
                "mcq_options": q.mcq_options  # Include AI-generated MCQs
            }
            for q in selected_questions
        ]
    }

    return exam_data

async def _evaluate_attempt_background(
    attempt_id: int,
    question_content: str,
    answer_text: str,
    answer_image_path: Optional[str],
    mcq_answer: Optional[str],
    mcq_options: Optional[Dict],
    max_marks: int
):
    """Background task to evaluate an attempt asynchronously."""
    from app.core.database import SessionLocal
    db = SessionLocal()
    try:
        # Get the attempt
        attempt = db.query(models.Attempt).filter(models.Attempt.id == attempt_id).first()
        if not attempt:
            return

        # Update status to evaluating
        attempt.evaluation_status = "evaluating"
        db.commit()

        # Handle MCQ answers
        if mcq_answer and mcq_options:
            # MCQ evaluation is instant
            correct_answer = mcq_options.get("correct", "").upper()
            is_correct = mcq_answer.upper() == correct_answer
            grade = max_marks if is_correct else 0
            feedback = f"Correct! The answer is {correct_answer}." if is_correct else f"Incorrect. The correct answer is {correct_answer}."

            attempt.ai_grade = grade
            attempt.ai_feedback = feedback
            attempt.evaluation_status = "completed"
            db.commit()
            return

        # Handle written answers (with optional image)
        resolved_path = ""
        ocr_failed = False
        final_answer_text = answer_text or ""

        if answer_image_path:
            resolved_path = _resolve_answer_image_path(answer_image_path)
            if resolved_path:
                try:
                    ocr_text = ocr_service.extract_text_from_image(resolved_path)
                    final_answer_text = ocr_text if ocr_text else final_answer_text
                except RuntimeError:
                    ocr_failed = True

        # Call AI evaluation
        try:
            if resolved_path and (ocr_failed or not final_answer_text.strip()):
                evaluation = await ai_service.evaluate_answer_with_image(
                    question=question_content,
                    image_path=resolved_path,
                    max_marks=max_marks,
                    student_answer=final_answer_text,
                )
            else:
                evaluation = await ai_service.evaluate_answer(
                    question=question_content,
                    student_answer=final_answer_text,
                    max_marks=max_marks
                )

            attempt.ai_grade = evaluation.get("grade", 0)
            attempt.ai_feedback = evaluation.get("feedback", "")
            attempt.error_category = evaluation.get("error_category")
            attempt.evaluation_status = "completed"
        except Exception as e:
            attempt.ai_grade = 0
            attempt.ai_feedback = f"Evaluation failed: {str(e)}"
            attempt.error_category = None
            attempt.evaluation_status = "failed"

        db.commit()
    except Exception as e:
        print(f"[Background Eval] Error evaluating attempt {attempt_id}: {e}")
    finally:
        db.close()


@router.post("/attempts", response_model=schemas.AttemptResponse)
async def submit_attempt(
    attempt_data: schemas.AttemptCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Submit an answer attempt - saves immediately, evaluates asynchronously."""
    # Get exam and question
    exam = db.query(models.Exam).filter(models.Exam.id == attempt_data.exam_id).first()
    question = db.query(models.Question).filter(models.Question.id == attempt_data.question_id).first()

    if not exam or not question:
        raise HTTPException(status_code=404, detail="Exam or question not found")

    # Process answer text (for OCR if image provided)
    answer_text = attempt_data.answer_text or ""
    if attempt_data.answer_image_path:
        resolved_path = _resolve_answer_image_path(attempt_data.answer_image_path)
        if resolved_path:
            try:
                ocr_text = ocr_service.extract_text_from_image(resolved_path)
                answer_text = ocr_text if ocr_text else answer_text
            except RuntimeError:
                pass  # Will handle in background

    # Create attempt immediately with pending status
    db_attempt = models.Attempt(
        exam_id=attempt_data.exam_id,
        question_id=attempt_data.question_id,
        answer_text=answer_text,
        answer_image_path=attempt_data.answer_image_path,
        mcq_answer=attempt_data.mcq_answer,
        ai_grade=None,  # Will be set by background evaluation
        ai_feedback="Evaluation in progress...",
        error_category=None,
        evaluation_status="pending",
        max_marks=question.marks
    )
    db.add(db_attempt)
    db.commit()
    db.refresh(db_attempt)

    # Start background evaluation
    background_tasks.add_task(
        _evaluate_attempt_background,
        attempt_id=db_attempt.id,
        question_content=question.content,
        answer_text=answer_text,
        answer_image_path=attempt_data.answer_image_path,
        mcq_answer=attempt_data.mcq_answer,
        mcq_options=question.mcq_options,
        max_marks=question.marks
    )

    return db_attempt

@router.post("/{exam_id}/submit")
def submit_exam(exam_id: int, db: Session = Depends(get_db)):
    """Submit and finalize exam"""
    exam = db.query(models.Exam).filter(models.Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    # Calculate total
    total_obtained = sum([a.ai_grade or 0 for a in exam.attempts])
    
    exam.obtained_marks = total_obtained
    exam.submitted_at = datetime.utcnow()
    exam.status = "completed"
    
    db.commit()
    db.refresh(exam)
    
    return {
        "exam_id": exam_id,
        "total_marks": exam.total_marks,
        "obtained_marks": total_obtained,
        "percentage": (total_obtained / exam.total_marks * 100) if exam.total_marks > 0 else 0,
        "attempts": len(exam.attempts)
    }

@router.get("/{exam_id}/results")
def get_exam_results(exam_id: int, db: Session = Depends(get_db)):
    """Get detailed exam results"""
    exam = db.query(models.Exam).filter(models.Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    results = {
        "exam_id": exam_id,
        "subject": exam.subject.name,
        "started_at": exam.started_at,
        "submitted_at": exam.submitted_at,
        "total_marks": exam.total_marks,
        "obtained_marks": exam.obtained_marks,
        "percentage": (exam.obtained_marks / exam.total_marks * 100) if exam.total_marks > 0 else 0,
        "attempts": []
    }
    
    for attempt in exam.attempts:
        # Show MCQ answer if present, otherwise text answer
        if attempt.mcq_answer:
            display_answer = f"Selected option: {attempt.mcq_answer}"
        elif attempt.answer_text:
            display_answer = attempt.answer_text[:200] + "..." if len(attempt.answer_text) > 200 else attempt.answer_text
        elif attempt.answer_image_path:
            display_answer = "[Handwritten answer uploaded]"
        else:
            display_answer = "[No answer provided]"

        results["attempts"].append({
            "question_id": attempt.question_id,
            "question": attempt.question.content,
            "marks": attempt.max_marks,
            "obtained": attempt.ai_grade,
            "feedback": attempt.ai_feedback,
            "evaluation_status": attempt.evaluation_status,
            "mcq_answer": attempt.mcq_answer,
            "your_answer": display_answer
        })

    return results

@router.get("/", response_model=List[schemas.ExamResponse])
def get_user_exams(db: Session = Depends(get_db)):
    """Get all exams for current user"""
    # TODO: Get user_id from auth
    user_id = 1
    exams = db.query(models.Exam).filter(models.Exam.user_id == user_id).order_by(models.Exam.started_at.desc()).all()

    # Return a lightweight payload for dashboard/results pages.
    # This avoids lazy-loading attempts for every exam, which can make
    # the endpoint slow or fail if legacy rows/schema are inconsistent.
    return [
        {
            "id": exam.id,
            "subject_id": exam.subject_id,
            "user_id": exam.user_id,
            "started_at": exam.started_at,
            "submitted_at": exam.submitted_at,
            "total_marks": exam.total_marks or 0,
            "obtained_marks": exam.obtained_marks,
            "status": exam.status,
            "attempts": []
        }
        for exam in exams
    ]
