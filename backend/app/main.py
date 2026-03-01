from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from sqlalchemy import text, create_engine
import os

from app.core.database import engine, Base, SessionLocal
from app.core.config import APP_NAME, APP_VERSION, UPLOAD_DIR, DATABASE_URL
from app.core.security import get_password_hash
from app.models import models
from app.routers import questions, exams, ai, auth, admin, community

# Run schema migrations BEFORE creating tables
# This ensures new columns are added to existing tables
_migration_engine = create_engine(DATABASE_URL)
with _migration_engine.connect() as conn:
    # Add mcq_options to questions table
    try:
        conn.execute(text("ALTER TABLE questions ADD COLUMN mcq_options JSON"))
        conn.commit()
    except Exception:
        pass  # Column already exists
    
    # Add evaluation_status and mcq_answer to attempts table
    try:
        conn.execute(text("ALTER TABLE attempts ADD COLUMN evaluation_status TEXT DEFAULT 'pending'"))
        conn.commit()
    except Exception:
        pass
    
    try:
        conn.execute(text("ALTER TABLE attempts ADD COLUMN mcq_answer VARCHAR(1)"))
        conn.commit()
    except Exception:
        pass

_migration_engine.dispose()

# Create database tables (for any new tables)
Base.metadata.create_all(bind=engine)

# Create upload directories
os.makedirs(f"{UPLOAD_DIR}/pdfs", exist_ok=True)
os.makedirs(f"{UPLOAD_DIR}/answers", exist_ok=True)


def seed_initial_data() -> None:
    """Seed essential user accounts and default KTU departments."""
    db = SessionLocal()
    try:
        _ensure_departments(db)
        _ensure_users(db)
        _ensure_s2_cs_subjects(db)
        _ensure_questions(db)
    finally:
        db.close()


def ensure_schema_compatibility() -> None:
    """Apply lightweight runtime schema fixes for existing SQLite databases."""
    db = SessionLocal()
    try:
        # Fix attempts table
        attempts_columns = db.execute(text("PRAGMA table_info(attempts)")).fetchall()
        attempt_column_names = {row[1] for row in attempts_columns}
        if "error_category" not in attempt_column_names:
            db.execute(text("ALTER TABLE attempts ADD COLUMN error_category TEXT"))
        if "evaluation_status" not in attempt_column_names:
            db.execute(text("ALTER TABLE attempts ADD COLUMN evaluation_status TEXT DEFAULT 'pending'"))
        if "mcq_answer" not in attempt_column_names:
            db.execute(text("ALTER TABLE attempts ADD COLUMN mcq_answer VARCHAR(1)"))

        # Fix questions table
        questions_columns = db.execute(text("PRAGMA table_info(questions)")).fetchall()
        question_column_names = {row[1] for row in questions_columns}
        if "mcq_options" not in question_column_names:
            db.execute(text("ALTER TABLE questions ADD COLUMN mcq_options JSON"))

        db.commit()
    finally:
        db.close()



def _ensure_questions(db) -> None:
    """Seed hardcoded KTU questions into the database (idempotent)."""
    from app.models.models import Subject, Question

    def _add(q_list):
        for q in q_list:
            exists = db.query(Question).filter(
                Question.content == q["content"],
                Question.subject_id == q["subject_id"],
            ).first()
            if not exists:
                db.add(Question(**q))
        db.commit()

    # ── GAMAT201 – Mathematics for Information Science-2 ─────────────────────
    math = db.query(Subject).filter(Subject.code == "GAMAT201").first()
    if math:
        _add([
            {"subject_id": math.id, "year": 2024, "month": "May", "marks": 3, "frequency_score": 2.5,
             "topics": ["Eigenvalues", "Eigenvectors"],
             "content": "Find the eigenvalues and eigenvectors of the matrix A = [[2, 1], [1, 2]]."},
            {"subject_id": math.id, "year": 2024, "month": "May", "marks": 5, "frequency_score": 2.5,
             "topics": ["Gauss Elimination"],
             "content": "Solve the system 2x + y - z = 3, x - y + 2z = 1, x + 3y - z = 2 using Gauss elimination."},
            {"subject_id": math.id, "year": 2024, "month": "May", "marks": 7, "frequency_score": 3.0,
             "topics": ["Fourier Series"],
             "content": "Find the Fourier series of f(x) = x in the interval (-π, π). Hence deduce π²/6 = 1 + 1/4 + 1/9 + ..."},
            {"subject_id": math.id, "year": 2024, "month": "May", "marks": 7, "frequency_score": 2.5,
             "topics": ["Laplace Transform", "Solving ODEs"],
             "content": "Using Laplace transforms, solve y'' + 3y' + 2y = e^(-t) with y(0) = 0, y'(0) = 1."},
            {"subject_id": math.id, "year": 2024, "month": "May", "marks": 5, "frequency_score": 2.0,
             "topics": ["Gram-Schmidt Process"],
             "content": "Apply Gram-Schmidt orthogonalization to the set {(1,0,1), (1,1,0), (0,1,1)} in ℝ³."},
            {"subject_id": math.id, "year": 2023, "month": "November", "marks": 3, "frequency_score": 2.0,
             "topics": ["Matrix Rank"],
             "content": "Find the rank of the matrix [[1, 2, 3], [4, 5, 6], [7, 8, 9]]."},
            {"subject_id": math.id, "year": 2023, "month": "November", "marks": 7, "frequency_score": 2.5,
             "topics": ["Diagonalization"],
             "content": "Diagonalize the matrix A = [[4, 1], [2, 3]] and hence find A⁴."},
            {"subject_id": math.id, "year": 2024, "month": "November", "marks": 7, "frequency_score": 2.0,
             "topics": ["Green's Theorem"],
             "content": "Using Green's theorem evaluate ∮C (y²dx + x²dy) where C is the boundary of the region enclosed by y = x and y = x² in the first quadrant."},
            {"subject_id": math.id, "year": 2024, "month": "November", "marks": 5, "frequency_score": 2.0,
             "topics": ["Orthogonal Projection"],
             "content": "Find the orthogonal projection of b = (1, 2, 3) onto the plane spanned by u₁ = (1, 0, 1) and u₂ = (0, 1, 0)."},
            {"subject_id": math.id, "year": 2023, "month": "May", "marks": 7, "frequency_score": 3.0,
             "topics": ["Stokes Theorem"],
             "content": "Verify Stokes' theorem for F⃗ = (2x - y)î - yz²ĵ - y²zk̂ over the upper half of the sphere x² + y² + z² = 1, z ≥ 0."},
        ])

    # ── GACSE202 – Programming in C ──────────────────────────────────────────
    c_prog = db.query(Subject).filter(Subject.code == "GACSE202").first()
    if c_prog:
        _add([
            {"subject_id": c_prog.id, "year": 2024, "month": "May", "marks": 3, "frequency_score": 2.5,
             "topics": ["Pointers"],
             "content": "What is a pointer? Explain with a C program how pointers are used to swap two integers without a temporary variable."},
            {"subject_id": c_prog.id, "year": 2024, "month": "May", "marks": 5, "frequency_score": 3.0,
             "topics": ["Arrays", "Sorting"],
             "content": "Write a C program to sort an array of n integers using Bubble Sort. Analyse its time complexity."},
            {"subject_id": c_prog.id, "year": 2024, "month": "May", "marks": 7, "frequency_score": 2.5,
             "topics": ["Recursion"],
             "content": "Write a recursive C function to compute the nth Fibonacci number. Trace the execution for n = 5 and explain the call stack."},
            {"subject_id": c_prog.id, "year": 2024, "month": "May", "marks": 5, "frequency_score": 2.5,
             "topics": ["Structures"],
             "content": "Define a C structure Student with fields name, roll number, and marks. Write a program to read details of 5 students, find and print the topper."},
            {"subject_id": c_prog.id, "year": 2023, "month": "November", "marks": 3, "frequency_score": 2.0,
             "topics": ["File Handling"],
             "content": "Write a C program to count the number of vowels in a text file 'input.txt' and display the result."},
            {"subject_id": c_prog.id, "year": 2023, "month": "November", "marks": 7, "frequency_score": 2.5,
             "topics": ["Dynamic Memory Allocation"],
             "content": "Explain malloc(), calloc(), realloc(), and free() with examples. Write a C program to create a dynamic array of n integers and find their average."},
            {"subject_id": c_prog.id, "year": 2023, "month": "November", "marks": 5, "frequency_score": 2.5,
             "topics": ["String Functions"],
             "content": "Write a C program to reverse a string without using the strrev() library function. Use both iterative and recursive approaches."},
            {"subject_id": c_prog.id, "year": 2024, "month": "November", "marks": 7, "frequency_score": 2.5,
             "topics": ["Linked List"],
             "content": "Define a singly linked list. Write C functions to: (i) insert a node at the beginning, (ii) delete a node with a given value, and (iii) display all elements."},
            {"subject_id": c_prog.id, "year": 2024, "month": "November", "marks": 3, "frequency_score": 2.0,
             "topics": ["Operators", "Bitwise"],
             "content": "Explain all bitwise operators in C with examples. Write a C expression to check if a given number is a power of 2 using bitwise operations."},
            {"subject_id": c_prog.id, "year": 2023, "month": "May", "marks": 5, "frequency_score": 2.0,
             "topics": ["Functions", "Scope"],
             "content": "Differentiate between call by value and call by reference in C with examples. When should each be preferred?"},
        ])

    # ── GAPHY201 – Physics for Information Science ────────────────────────────
    physics = db.query(Subject).filter(Subject.code == "GAPHY201").first()
    if physics:
        _add([
            {"subject_id": physics.id, "year": 2024, "month": "May", "marks": 3, "frequency_score": 2.5,
             "topics": ["Quantum Mechanics", "de Broglie"],
             "content": "Calculate the de Broglie wavelength of an electron moving with a velocity of 1.5 × 10⁶ m/s. (mass of electron = 9.1 × 10⁻³¹ kg, h = 6.626 × 10⁻³⁴ Js)"},
            {"subject_id": physics.id, "year": 2024, "month": "May", "marks": 5, "frequency_score": 2.5,
             "topics": ["Lasers"],
             "content": "Explain the principle of stimulated emission. Derive the relationship between Einstein's A and B coefficients."},
            {"subject_id": physics.id, "year": 2024, "month": "May", "marks": 7, "frequency_score": 2.5,
             "topics": ["Optical Fibre"],
             "content": "Explain the structure of an optical fibre. Derive expressions for numerical aperture and acceptance angle. Calculate NA if n₁ = 1.5 and n₂ = 1.48."},
            {"subject_id": physics.id, "year": 2023, "month": "November", "marks": 5, "frequency_score": 2.0,
             "topics": ["Semiconductors"],
             "content": "Distinguish between intrinsic and extrinsic semiconductors. Explain the formation of a p-n junction and draw the energy band diagram."},
            {"subject_id": physics.id, "year": 2023, "month": "November", "marks": 7, "frequency_score": 2.5,
             "topics": ["Superconductivity"],
             "content": "Define superconductivity. Explain the Meissner effect, Type-I and Type-II superconductors, and list three applications of superconductors in modern technology."},
            {"subject_id": physics.id, "year": 2024, "month": "November", "marks": 3, "frequency_score": 2.0,
             "topics": ["Quantum Mechanics", "Uncertainty Principle"],
             "content": "State Heisenberg's Uncertainty Principle. An electron is confined to a nucleus of radius 5 × 10⁻¹⁵ m. Find the minimum uncertainty in its momentum."},
            {"subject_id": physics.id, "year": 2023, "month": "May", "marks": 7, "frequency_score": 2.5,
             "topics": ["Crystallography"],
             "content": "Explain Bragg's law. Derive the Bragg diffraction condition and explain how it is used to determine crystal structure. Calculate d-spacing for NaCl if λ = 0.154 nm and 2θ = 27.5°."},
        ])

    # ── GACSE203 – Discrete Mathematics ──────────────────────────────────────
    dm = db.query(Subject).filter(Subject.code == "GACSE203").first()
    if dm:
        _add([
            {"subject_id": dm.id, "year": 2024, "month": "May", "marks": 3, "frequency_score": 2.5,
             "topics": ["Propositional Logic"],
             "content": "Construct a truth table for the formula (p → q) ↔ (¬q → ¬p). Is it a tautology?"},
            {"subject_id": dm.id, "year": 2024, "month": "May", "marks": 5, "frequency_score": 2.5,
             "topics": ["Graph Theory", "Euclidean Algorithm"],
             "content": "Use the Euclidean algorithm to find gcd(252, 105). Express it as a linear combination of 252 and 105."},
            {"subject_id": dm.id, "year": 2024, "month": "May", "marks": 7, "frequency_score": 3.0,
             "topics": ["Recurrence Relations"],
             "content": "Solve the recurrence relation aₙ = 5aₙ₋₁ - 6aₙ₋₂ with initial conditions a₀ = 0, a₁ = 1 using characteristic roots."},
            {"subject_id": dm.id, "year": 2023, "month": "November", "marks": 7, "frequency_score": 2.5,
             "topics": ["Graph Theory", "Euler Hamiltonian"],
             "content": "Define Eulerian and Hamiltonian graphs. Prove that a connected graph has an Eulerian circuit if and only if every vertex has even degree. Give one example of each."},
            {"subject_id": dm.id, "year": 2024, "month": "November", "marks": 5, "frequency_score": 2.5,
             "topics": ["Combinatorics", "Pigeonhole"],
             "content": "State the Pigeonhole Principle. In a group of 13 people, show that at least two of them were born in the same month. How many people are needed to guarantee 3 share a birth month?"},
            {"subject_id": dm.id, "year": 2023, "month": "May", "marks": 7, "frequency_score": 2.5,
             "topics": ["Groups", "Abstract Algebra"],
             "content": "Define a group. Show that the set of integers under addition forms a group. Prove that the set {1, -1, i, -i} forms a group under multiplication."},
            {"subject_id": dm.id, "year": 2023, "month": "November", "marks": 3, "frequency_score": 2.0,
             "topics": ["Sets", "Relations"],
             "content": "Define equivalence relation. Verify whether the relation R = {(a,b) | a ≡ b (mod 3)} on the set of integers is an equivalence relation."},
        ])

    # ── GACSE201 – Foundations of Computing ──────────────────────────────────
    foc = db.query(Subject).filter(Subject.code == "GACSE201").first()
    if foc:
        _add([
            {"subject_id": foc.id, "year": 2024, "month": "May", "marks": 3, "frequency_score": 2.5,
             "topics": ["Number Systems"],
             "content": "Convert the hexadecimal number 2F3A.B to binary and then to octal. Show all steps."},
            {"subject_id": foc.id, "year": 2024, "month": "May", "marks": 5, "frequency_score": 2.5,
             "topics": ["Boolean Algebra", "Karnaugh Map"],
             "content": "Minimize the Boolean expression F(A,B,C,D) = Σm(0,1,2,4,5,8,9,10) using a Karnaugh map."},
            {"subject_id": foc.id, "year": 2024, "month": "May", "marks": 7, "frequency_score": 2.5,
             "topics": ["Computer Architecture", "Memory Hierarchy"],
             "content": "Explain the memory hierarchy in a computer system. Compare Cache, RAM, and Secondary storage in terms of speed, capacity, and cost. What is the principle of locality?"},
            {"subject_id": foc.id, "year": 2023, "month": "November", "marks": 5, "frequency_score": 2.0,
             "topics": ["HTML", "Web Design"],
             "content": "Create an HTML page with a table of 5 students showing Name, Roll No, and CGPA. Use appropriate tags and add a stylesheet to colour alternate rows."},
            {"subject_id": foc.id, "year": 2023, "month": "November", "marks": 7, "frequency_score": 2.0,
             "topics": ["Operating Systems"],
             "content": "Define an Operating System and list its major functions. Explain the difference between a process and a thread. What is deadlock and what are its four necessary conditions?"},
            {"subject_id": foc.id, "year": 2024, "month": "November", "marks": 3, "frequency_score": 2.0,
             "topics": ["Logic Gates"],
             "content": "Implement a full adder using only NAND gates. Draw the circuit and verify with a truth table."},
        ])

    print("✅ Questions seeded successfully.")



def _ensure_departments(db) -> None:
    """Create the default KTU engineering departments if they don't exist yet."""
    default_departments = [
        {"name": "Electrical and Electronics Engineering", "code": "EEE"},
        {"name": "Mechanical Engineering", "code": "ME"},
        {"name": "Electronics and Communication Engineering", "code": "ECE"},
        {"name": "Civil Engineering", "code": "CE"},
        {"name": "Computer Science and Engineering", "code": "CSE"},
    ]
    for dept in default_departments:
        existing = db.query(models.Department).filter(
            models.Department.code == dept["code"]
        ).first()
        if not existing:
            db.add(models.Department(name=dept["name"], code=dept["code"]))
    db.commit()


def _ensure_s2_cs_subjects(db) -> None:
    """Create all S2 Computer Science subjects if they don't exist yet."""
    cse = db.query(models.Department).filter(models.Department.code == "CSE").first()
    if not cse:
        return  # Department not seeded yet; will be done on next startup

    S2_SUBJECTS = [
        ("Mathematics for Information Science \u2013 2",                    "GAMAT201"),
        ("Physics for Information Science",                                "GAPHY201"),
        ("Chemistry for Information Science and Electrical Science",       "GACHY201"),
        ("Foundations of Computing: From Hardware Essentials to Web Design","GACSE201"),
        ("Programming in C",                                               "GACSE202"),
        ("Engineering Entrepreneurship and IPR",                           "GAESE201"),
        ("Health and Wellness",                                            "GAHSS201"),
        ("Life Skills and Professional Communication",                     "GAHSS202"),
        ("IT Workshop",                                                    "GAIT201"),
        ("Discrete Mathematics",                                           "GACSE203"),
        ("Discrete Mathematical Structures",                               "GACSE204"),
    ]
    for name, code in S2_SUBJECTS:
        existing = db.query(models.Subject).filter(
            models.Subject.code == code,
            models.Subject.semester == 2
        ).first()
        if not existing:
            db.add(models.Subject(
                name=name, code=code, semester=2, department_id=cse.id
            ))
    db.commit()


def _ensure_users(db) -> None:
    """Create the default admin and student accounts if they don't exist yet."""
    if not db.query(models.User).filter(models.User.email == "admin@ktu.local").first():
        admin_user = models.User(
            email="admin@ktu.local",
            hashed_password=get_password_hash("admin123"),
            name="Platform Admin",
            is_admin=True,
            is_active=True,
        )
        db.add(admin_user)

    if not db.query(models.User).filter(models.User.email == "student@ktu.local").first():
        student_user = models.User(
            email="student@ktu.local",
            hashed_password=get_password_hash("student123"),
            name="KTU Student",
            is_admin=False,
            is_active=True,
        )
        db.add(student_user)

    db.commit()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    ensure_schema_compatibility()
    seed_initial_data()
    print(f"Starting {APP_NAME} v{APP_VERSION}")
    print("Database connected successfully")
    print("AI service initialized")
    yield
    print("Shutting down...")

app = FastAPI(
    title=APP_NAME,
    version=APP_VERSION,
    description="AI-powered academic platform for KTU students",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1|10\..*|172\.(1[6-9]|2[0-9]|3[0-1])\..*|192\.168\..*)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(questions.router)
app.include_router(exams.router)
app.include_router(ai.router)
app.include_router(community.router)

# Static files for uploads
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

@app.get("/")
def root():
    return {
        "app": APP_NAME,
        "version": APP_VERSION,
        "status": "running",
        "docs": "/docs"
    }

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": APP_NAME}

@app.get("/api/info")
def api_info():
    return {
        "name": APP_NAME,
        "version": APP_VERSION,
        "endpoints": {
            "auth": "/auth",
            "questions": "/questions",
            "exams": "/exams",
            "ai": "/ai",
            "admin": "/admin"
        }
    }
