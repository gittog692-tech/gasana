from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Float, Boolean, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class Department(Base):
    __tablename__ = "departments"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    code = Column(String, unique=True, index=True)
    
    subjects = relationship("Subject", back_populates="department")
    users = relationship("User", back_populates="department")

class Subject(Base):
    __tablename__ = "subjects"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    code = Column(String, index=True)
    semester = Column(Integer)
    department_id = Column(Integer, ForeignKey("departments.id"))
    
    department = relationship("Department", back_populates="subjects")
    questions = relationship("Question", back_populates="subject")
    exams = relationship("Exam", back_populates="subject")
    concepts = relationship("Concept", back_populates="subject")

class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text)
    marks = Column(Integer)
    year = Column(Integer)
    month = Column(String)  # May/Nov
    subject_id = Column(Integer, ForeignKey("subjects.id"))
    frequency_score = Column(Float, default=0.0)
    topics = Column(JSON)
    is_synthetic = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    # AI-generated MCQ options stored as JSON: {"A": "option text", "B": "...", "C": "...", "D": "...", "correct": "A"}
    mcq_options = Column(JSON, nullable=True)

    subject = relationship("Subject", back_populates="questions")
    attempts = relationship("Attempt", back_populates="question")

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    name = Column(String)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    semester = Column(Integer, nullable=True)
    is_admin = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    department = relationship("Department", back_populates="users")
    exams = relationship("Exam", back_populates="user")
    stress_sessions = relationship("StressSession", back_populates="user")
    posts = relationship("Post", back_populates="author", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="author", cascade="all, delete-orphan")
    masteries = relationship("StudentMastery", back_populates="user", cascade="all, delete-orphan")

class Exam(Base):
    __tablename__ = "exams"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    subject_id = Column(Integer, ForeignKey("subjects.id"))
    started_at = Column(DateTime, default=datetime.utcnow)
    submitted_at = Column(DateTime)
    total_marks = Column(Integer)
    obtained_marks = Column(Float)
    status = Column(String, default="in_progress")
    
    user = relationship("User", back_populates="exams")
    subject = relationship("Subject", back_populates="exams")
    attempts = relationship("Attempt", back_populates="exam")

class Attempt(Base):
    __tablename__ = "attempts"

    id = Column(Integer, primary_key=True, index=True)
    exam_id = Column(Integer, ForeignKey("exams.id"))
    question_id = Column(Integer, ForeignKey("questions.id"))
    answer_text = Column(Text)
    answer_image_path = Column(String)
    # MCQ answer (A, B, C, or D) - mutually exclusive with answer_text
    mcq_answer = Column(String(1), nullable=True)
    ai_grade = Column(Float)
    ai_feedback = Column(Text)
    error_category = Column(String, nullable=True) # e.g. CALCULATION_ERROR, CONCEPTUAL_ERROR
    max_marks = Column(Integer)
    submitted_at = Column(DateTime, default=datetime.utcnow)
    # Async evaluation status: pending, evaluating, completed, failed
    evaluation_status = Column(String, default="pending")

    exam = relationship("Exam", back_populates="attempts")
    question = relationship("Question", back_populates="attempts")

class StressSession(Base):
    __tablename__ = "stress_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    mood = Column(String)
    messages = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="stress_sessions")

class Prediction(Base):
    __tablename__ = "predictions"
    
    id = Column(Integer, primary_key=True, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id"))
    question_id = Column(Integer, ForeignKey("questions.id"))
    probability = Column(Float)
    reasoning = Column(Text)
    generated_at = Column(DateTime, default=datetime.utcnow)

class Concept(Base):
    __tablename__ = "concepts"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id"))
    
    subject = relationship("Subject", back_populates="concepts")
    student_masteries = relationship("StudentMastery", back_populates="concept")

class StudentMastery(Base):
    __tablename__ = "student_masteries"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    concept_id = Column(Integer, ForeignKey("concepts.id"))
    mastery_score = Column(Float, default=0.5) # 0.0 to 1.0, tracking confidence
    attempts_count = Column(Integer, default=0)
    last_tested_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="masteries")
    concept = relationship("Concept", back_populates="student_masteries")


# ── Community Models ─────────────────────────────────────────────────────────

class Post(Base):
    __tablename__ = "posts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=True)
    title = Column(String, nullable=False)
    body = Column(Text, nullable=False)
    image_url = Column(String, nullable=True)
    upvotes = Column(Integer, default=0)
    downvotes = Column(Integer, default=0)
    is_pinned = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    author = relationship("User", back_populates="posts")
    subject = relationship("Subject")
    comments = relationship("Comment", back_populates="post", cascade="all, delete-orphan")
    votes = relationship("Vote", back_populates="post", cascade="all, delete-orphan")


class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("posts.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    parent_id = Column(Integer, ForeignKey("comments.id"), nullable=True)
    body = Column(Text, nullable=False)
    is_ai = Column(Boolean, default=False)
    upvotes = Column(Integer, default=0)
    downvotes = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    author = relationship("User", back_populates="comments")
    post = relationship("Post", back_populates="comments")
    parent = relationship("Comment", remote_side=[id], backref="replies")
    comment_votes = relationship("CommentVote", back_populates="comment", cascade="all, delete-orphan")


from sqlalchemy import UniqueConstraint

class Vote(Base):
    __tablename__ = "votes"
    __table_args__ = (UniqueConstraint("post_id", "user_id", name="uq_vote_post_user"),)

    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("posts.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    value = Column(Integer, nullable=False)  # +1 or -1

    post = relationship("Post", back_populates="votes")


class CommentVote(Base):
    __tablename__ = "comment_votes"
    __table_args__ = (UniqueConstraint("comment_id", "user_id", name="uq_commentvote_comment_user"),)

    id = Column(Integer, primary_key=True, index=True)
    comment_id = Column(Integer, ForeignKey("comments.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    value = Column(Integer, nullable=False)  # +1 or -1

    comment = relationship("Comment", back_populates="comment_votes")
