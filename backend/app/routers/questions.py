from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.models import models, schemas
from app.services.pdf_processor import pdf_processor
from app.services.file_service import file_service

router = APIRouter(prefix="/questions", tags=["questions"])

@router.post("/departments", response_model=schemas.DepartmentResponse)
def create_department(dept: schemas.DepartmentCreate, db: Session = Depends(get_db)):
    """Create a new department"""
    db_dept = models.Department(**dept.model_dump())
    db.add(db_dept)
    db.commit()
    db.refresh(db_dept)
    return db_dept

@router.get("/departments", response_model=List[schemas.DepartmentResponse])
def get_departments(db: Session = Depends(get_db)):
    """Get all departments"""
    return db.query(models.Department).all()

@router.post("/subjects", response_model=schemas.SubjectResponse)
def create_subject(subject: schemas.SubjectCreate, db: Session = Depends(get_db)):
    """Create a new subject"""
    db_subject = models.Subject(**subject.model_dump())
    db.add(db_subject)
    db.commit()
    db.refresh(db_subject)
    return db_subject

@router.get("/subjects", response_model=List[schemas.SubjectResponse])
def get_subjects(
    department_id: Optional[int] = None,
    semester: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """Get subjects with optional filters"""
    query = db.query(models.Subject)
    if department_id:
        query = query.filter(models.Subject.department_id == department_id)
    if semester:
        query = query.filter(models.Subject.semester == semester)
    return query.all()

@router.post("/upload-pdf")
async def upload_pyq_pdf(
    subject_id: int,
    year: int,
    month: str = Query(..., pattern="^(May|November|Nov)$"),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Upload and process PYQ PDF"""
    # Save file
    file_info = await file_service.save_pdf(file, subject_id)
    
    # Extract text
    text = pdf_processor.extract_text_from_pdf(file_info["path"])
    
    # Parse questions
    questions = pdf_processor.extract_questions(text)
    
    # Save to database
    created_questions = []
    for q in questions:
        db_question = models.Question(
            content=q["content"],
            marks=q["marks"],
            year=year,
            month=month,
            subject_id=subject_id,
            topics=q["topics"]
        )
        db.add(db_question)
        created_questions.append(db_question)
    
    db.commit()
    
    # Update frequency scores
    update_frequency_scores(db, subject_id)
    
    return {
        "message": f"Uploaded and processed {len(created_questions)} questions",
        "file_info": file_info,
        "questions_count": len(created_questions)
    }

@router.get("/", response_model=List[schemas.QuestionResponse])
def get_questions(
    department_id: Optional[int] = None,
    semester: Optional[int] = None,
    subject_id: Optional[int] = None,
    year: Optional[int] = None,
    frequent_only: bool = False,
    limit: int = Query(50, le=100),
    db: Session = Depends(get_db)
):
    """Get questions with filters"""
    query = db.query(models.Question)
    
    if subject_id:
        query = query.filter(models.Question.subject_id == subject_id)
    elif department_id and semester:
        # Join with subjects to filter
        query = query.join(models.Subject).filter(
            models.Subject.department_id == department_id,
            models.Subject.semester == semester
        )
    
    if year:
        query = query.filter(models.Question.year == year)
    
    if frequent_only:
        query = query.filter(models.Question.frequency_score > 1.0)
    
    # Order by frequency (highest first), then by year (most recent)
    query = query.order_by(models.Question.frequency_score.desc(), models.Question.year.desc())
    
    return query.limit(limit).all()

@router.get("/frequent", response_model=List[schemas.QuestionResponse])
def get_frequent_questions(
    subject_id: int,
    min_frequency: float = 2.0,
    limit: int = 20,
    db: Session = Depends(get_db)
):
    """Get frequently asked questions"""
    questions = db.query(models.Question).filter(
        models.Question.subject_id == subject_id,
        models.Question.frequency_score >= min_frequency
    ).order_by(models.Question.frequency_score.desc()).limit(limit).all()
    
    return questions

@router.get("/{question_id}", response_model=schemas.QuestionResponse)
def get_question(question_id: int, db: Session = Depends(get_db)):
    """Get a specific question"""
    question = db.query(models.Question).filter(models.Question.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    return question

@router.post("/{question_id}/hint", response_model=schemas.HintResponse)
async def get_question_hint(
    question_id: int, 
    request: schemas.HintRequest,
    db: Session = Depends(get_db)
):
    """Get a Socratic hint based on current answer"""
    question = db.query(models.Question).filter(models.Question.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
        
    from app.services.ai_service import ai_service
    hint_data = await ai_service.generate_hint(question.content, request.student_answer)
    return {"hint": hint_data.get("hint", "Keep trying! You can do this.")}

def update_frequency_scores(db: Session, subject_id: int):
    """Update frequency scores based on how often questions appear"""
    # Get all questions for subject
    questions = db.query(models.Question).filter(
        models.Question.subject_id == subject_id
    ).all()
    
    # Group similar questions (simple exact match for now)
    content_map = {}
    for q in questions:
        # Normalize content
        normalized = q.content.lower().strip()[:100]
        if normalized in content_map:
            content_map[normalized].append(q)
        else:
            content_map[normalized] = [q]
    
    # Update frequency scores
    for normalized, question_list in content_map.items():
        frequency = len(question_list)
        for q in question_list:
            q.frequency_score = float(frequency)
    
    db.commit()
