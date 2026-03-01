from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

# Department Schemas
class DepartmentBase(BaseModel):
    name: str
    code: str

class DepartmentCreate(DepartmentBase):
    pass

class DepartmentResponse(DepartmentBase):
    id: int
    
    class Config:
        from_attributes = True

# Subject Schemas
class SubjectBase(BaseModel):
    name: str
    code: str
    semester: int
    department_id: int

class SubjectCreate(SubjectBase):
    pass

class SubjectResponse(SubjectBase):
    id: int
    department: Optional[DepartmentResponse] = None
    
    class Config:
        from_attributes = True

# Question Schemas
class QuestionBase(BaseModel):
    content: str
    marks: int
    year: int
    month: str
    subject_id: int

class QuestionCreate(QuestionBase):
    pass

class QuestionResponse(QuestionBase):
    id: int
    frequency_score: float
    topics: Optional[List[str]] = None
    is_synthetic: bool = False
    created_at: datetime
    subject: Optional[SubjectResponse] = None
    # AI-generated MCQ options for this question
    mcq_options: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True

# Exam & Attempt Schemas
class AttemptBase(BaseModel):
    exam_id: int
    question_id: int
    answer_text: Optional[str] = None
    answer_image_path: Optional[str] = None
    # MCQ answer option (A, B, C, or D)
    mcq_answer: Optional[str] = None

class AttemptCreate(AttemptBase):
    pass

class AttemptResponse(AttemptBase):
    id: int
    exam_id: int
    ai_grade: Optional[float] = None
    ai_feedback: Optional[str] = None
    error_category: Optional[str] = None
    max_marks: int
    submitted_at: datetime
    # Async evaluation status: pending, evaluating, completed, failed
    evaluation_status: str = "pending"
    question: Optional[QuestionResponse] = None

    class Config:
        from_attributes = True

class ExamBase(BaseModel):
    subject_id: int

class ExamCreate(ExamBase):
    pass

class ExamResponse(ExamBase):
    id: int
    user_id: int
    started_at: datetime
    submitted_at: Optional[datetime] = None
    total_marks: int
    obtained_marks: Optional[float] = None
    status: str
    attempts: List[AttemptResponse] = []
    
    class Config:
        from_attributes = True

# AI Evaluation Schema
class AIEvaluationRequest(BaseModel):
    question: str
    student_answer: str
    max_marks: int
    marking_scheme: Optional[str] = None

class AIEvaluationResponse(BaseModel):
    grade: float
    max_marks: int
    percentage: float
    content_score: float
    structure_score: float
    key_points_score: float
    feedback: str
    error_category: Optional[str] = None
    improvements: List[str]
    suggested_answer: str

# Question Prediction Schema
class QuestionPrediction(BaseModel):
    question_id: int
    content: str
    probability: float
    reasoning: str
    frequency_count: int

class PredictionResponse(BaseModel):
    subject_id: int
    subject_name: str
    high_probability: List[QuestionPrediction]
    medium_probability: List[QuestionPrediction]
    generated_at: datetime

# Doubt Clearing Schema
class DoubtRequest(BaseModel):
    question: str
    subject_id: Optional[int] = None
    context: Optional[str] = None

class DoubtResponse(BaseModel):
    answer: str
    related_topics: List[str]
    suggested_videos: List[Dict[str, Any]]

# Socratic Hint Schema
class HintRequest(BaseModel):
    student_answer: str = ""

class HintResponse(BaseModel):
    hint: str

# Stress Support Schema
class StressSessionRequest(BaseModel):
    mood: str
    message: Optional[str] = None

class StressSessionResponse(BaseModel):
    session_id: int
    mood: str
    ai_response: str
    coping_strategy: str
    motivational_quote: str

# Filter Schemas
class QuestionFilter(BaseModel):
    department_id: Optional[int] = None
    semester: Optional[int] = None
    subject_id: Optional[int] = None
    year: Optional[int] = None
    frequent_only: Optional[bool] = False
    limit: int = Field(default=50, le=100)

class ExamSimulationConfig(BaseModel):
    subject_id: int
    num_questions: int = Field(default=5, ge=1, le=20)
    duration_minutes: int = Field(default=60, ge=10, le=180)
    include_frequent: bool = True
    include_predicted: bool = True
    is_adaptive: bool = False
    # Generate AI MCQ options for each question
    generate_mcqs: bool = True
    # Allow written answers alongside MCQs
    allow_written: bool = True


# ── Community Schemas ────────────────────────────────────────────────────────

class PostCreate(BaseModel):
    title: str
    body: str
    subject_id: Optional[int] = None
    image_url: Optional[str] = None

class CommentCreate(BaseModel):
    body: str
    parent_id: Optional[int] = None

class VoteCreate(BaseModel):
    value: int  # +1 or -1

class AuthorResponse(BaseModel):
    id: int
    name: str
    class Config:
        from_attributes = True

class CommentResponse(BaseModel):
    id: int
    body: str
    created_at: datetime
    author: AuthorResponse
    is_ai: bool = False
    parent_id: Optional[int] = None
    upvotes: int = 0
    downvotes: int = 0
    user_vote: Optional[int] = None
    replies: List['CommentResponse'] = []
    class Config:
        from_attributes = True

CommentResponse.model_rebuild()

class CommentVoteCreate(BaseModel):
    value: int  # +1 or -1

class PostResponse(BaseModel):
    id: int
    title: str
    body: str
    image_url: Optional[str] = None
    upvotes: int
    downvotes: int
    is_pinned: bool = False
    created_at: datetime
    author: AuthorResponse
    subject: Optional[SubjectResponse] = None
    comment_count: int = 0
    user_vote: Optional[int] = None
    class Config:
        from_attributes = True

class PostDetailResponse(PostResponse):
    comments: List[CommentResponse] = []

