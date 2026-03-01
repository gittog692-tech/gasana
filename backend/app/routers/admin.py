from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from app.core.database import get_db
from app.core.security import get_current_admin
from app.models import models

router = APIRouter(prefix="/admin", tags=["Admin"])


# ── Schemas ──────────────────────────────────────────────────────────────────

class UserAdminResponse(BaseModel):
    id: int
    name: str
    email: str
    is_admin: bool
    is_active: bool
    department_id: Optional[int] = None
    semester: Optional[int] = None
    created_at: datetime
    exams_count: int = 0

    class Config:
        from_attributes = True


class UserStatusUpdate(BaseModel):
    is_active: bool


class SubjectCreate(BaseModel):
    name: str
    code: str
    semester: int
    department_id: int


class QuestionCreate(BaseModel):
    content: str
    marks: int
    year: int
    month: str
    subject_id: int
    topics: Optional[List[str]] = []


class PlatformStats(BaseModel):
    total_users: int
    active_users: int
    total_questions: int
    total_exams: int
    total_subjects: int
    total_departments: int


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/stats", response_model=PlatformStats)
def get_platform_stats(
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_admin)
):
    """Get platform-wide statistics."""
    return PlatformStats(
        total_users=db.query(models.User).count(),
        active_users=db.query(models.User).filter(models.User.is_active == True).count(),
        total_questions=db.query(models.Question).count(),
        total_exams=db.query(models.Exam).count(),
        total_subjects=db.query(models.Subject).count(),
        total_departments=db.query(models.Department).count(),
    )


@router.get("/users", response_model=List[UserAdminResponse])
def list_users(
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_admin)
):
    """List all users."""
    users = db.query(models.User).order_by(models.User.created_at.desc()).all()
    result = []
    for user in users:
        exams_count = db.query(models.Exam).filter(models.Exam.user_id == user.id).count()
        result.append(UserAdminResponse(
            id=user.id,
            name=user.name,
            email=user.email,
            is_admin=user.is_admin,
            is_active=user.is_active,
            department_id=user.department_id,
            semester=user.semester,
            created_at=user.created_at,
            exams_count=exams_count,
        ))
    return result


@router.patch("/users/{user_id}", response_model=UserAdminResponse)
def update_user_status(
    user_id: int,
    update: UserStatusUpdate,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin)
):
    """Activate or deactivate a user."""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == current_admin.id:
        raise HTTPException(status_code=400, detail="Cannot deactivate yourself")
    user.is_active = update.is_active
    db.commit()
    db.refresh(user)
    exams_count = db.query(models.Exam).filter(models.Exam.user_id == user.id).count()
    return UserAdminResponse(
        id=user.id, name=user.name, email=user.email,
        is_admin=user.is_admin, is_active=user.is_active,
        department_id=user.department_id, semester=user.semester,
        created_at=user.created_at, exams_count=exams_count,
    )


@router.post("/subjects", status_code=status.HTTP_201_CREATED)
def create_subject(
    data: SubjectCreate,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_admin)
):
    """Create a new subject."""
    dept = db.query(models.Department).filter(models.Department.id == data.department_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    subject = models.Subject(**data.model_dump())
    db.add(subject)
    db.commit()
    db.refresh(subject)
    return {"id": subject.id, "name": subject.name, "code": subject.code}


@router.post("/questions", status_code=status.HTTP_201_CREATED)
def create_question(
    data: QuestionCreate,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_admin)
):
    """Create a new question."""
    subject = db.query(models.Subject).filter(models.Subject.id == data.subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    question = models.Question(**data.model_dump())
    db.add(question)
    db.commit()
    db.refresh(question)
    return {"id": question.id, "content": question.content[:80]}


@router.get("/departments")
def list_departments(
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_admin)
):
    """List all departments."""
    depts = db.query(models.Department).all()
    return [{"id": d.id, "name": d.name, "code": d.code} for d in depts]


@router.get("/subjects")
def list_subjects(
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_admin)
):
    """List all subjects."""
    subjects = db.query(models.Subject).all()
    return [{"id": s.id, "name": s.name, "code": s.code, "semester": s.semester, "department_id": s.department_id} for s in subjects]
