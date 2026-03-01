"""
Seed script for S2 Computer Science subjects and KTU question papers.
Run from the backend directory:
    python seed_s2_data.py
"""

import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal, engine, Base
from app.models.models import Department, Subject, Question

Base.metadata.create_all(bind=engine)
db = SessionLocal()

# ── 1. Ensure CSE department exists ──────────────────────────────────────────
cse = db.query(Department).filter(Department.code == "CSE").first()
if not cse:
    cse = Department(name="Computer Science and Engineering", code="CSE")
    db.add(cse); db.commit(); db.refresh(cse)

print(f"Department: {cse.name} (id={cse.id})")

# ── 2. S2 CS Subjects ─────────────────────────────────────────────────────────
S2_SUBJECTS = [
    # (name, code)
    ("Mathematics for Information Science – 2",           "GAMAT201"),
    ("Physics for Information Science",                   "GAPHY201"),
    ("Chemistry for Information Science and Electrical Science", "GACHY201"),
    ("Foundations of Computing: From Hardware Essentials to Web Design", "GACSE201"),
    ("Programming in C",                                  "GACSE202"),
    ("Engineering Entrepreneurship and IPR",              "GAESE201"),
    ("Health and Wellness",                               "GAHSS201"),
    ("Life Skills and Professional Communication",        "GAHSS202"),
    ("IT Workshop",                                       "GAIT201"),
    ("Discrete Mathematics",                              "GACSE203"),
    ("Discrete Mathematical Structures",                  "GACSE204"),
]

subject_map = {}   # code -> Subject ORM object
for name, code in S2_SUBJECTS:
    existing = db.query(Subject).filter(Subject.code == code, Subject.semester == 2).first()
    if not existing:
        subj = Subject(name=name, code=code, semester=2, department_id=cse.id)
        db.add(subj); db.commit(); db.refresh(subj)
        print(f"  Created subject: {code}")
    else:
        subj = existing
        print(f"  Subject exists: {code}")
    subject_map[code] = subj

# Helper to bulk-insert questions, skipping duplicates
def add_questions(questions):
    added = 0
    for q in questions:
        exists = db.query(Question).filter(
            Question.content == q["content"],
            Question.subject_id == q["subject_id"],
            Question.year == q["year"],
        ).first()
        if not exists:
            db.add(Question(**q)); added += 1
    db.commit()
    return added

# ── 3. GAMAT201 – Mathematics for Information Science-2 (May 2025) ────────────
mat201_id = subject_map["GAMAT201"].id
GAMAT201_QUESTIONS = [
    # ── PART A (3 marks each) ──────────────────────────────────────────────────
    {"subject_id": mat201_id, "year": 2025, "month": "May", "marks": 3, "frequency_score": 1.0,
     "topics": ["Matrix Rank"],
     "content": "Find the rank of the matrix A = [[3, -1], [3, -2]]."},
    {"subject_id": mat201_id, "year": 2025, "month": "May", "marks": 3, "frequency_score": 1.0,
     "topics": ["Eigenvalues", "Spectrum"],
     "content": "Find the spectrum (set of all eigenvalues) of the matrix [[1, -1, 1], [5, 0, 4], [-4, 0, 1]]."},
    {"subject_id": mat201_id, "year": 2025, "month": "May", "marks": 3, "frequency_score": 1.5,
     "topics": ["Vector Spaces", "Subspaces"],
     "content": "Show that W = {(x₁, x₂) : x₁ ≥ 0 and x₂ ≥ 0} with standard operations is NOT a subspace of ℝ²."},
    {"subject_id": mat201_id, "year": 2025, "month": "May", "marks": 3, "frequency_score": 1.5,
     "topics": ["Linear Independence"],
     "content": "Check whether the set {(1,2,3), (1,1,4)} is linearly independent in ℝ³."},
    {"subject_id": mat201_id, "year": 2025, "month": "May", "marks": 3, "frequency_score": 1.5,
     "topics": ["Dot Product", "Angle between vectors"],
     "content": "Find the angle between vectors u = (1,1,1) and v = (2,1,-1)."},
    {"subject_id": mat201_id, "year": 2025, "month": "May", "marks": 3, "frequency_score": 1.0,
     "topics": ["Vector Norm"],
     "content": "Find the norm of u+v, where u = (3,1,3) and v = (0,-1,1)."},
    {"subject_id": mat201_id, "year": 2025, "month": "May", "marks": 3, "frequency_score": 1.5,
     "topics": ["Rank-Nullity", "Linear Transformation"],
     "content": "Find the rank and nullity of T: ℝ³ → ℝ³ defined by T(x) = Ax where A = [[1,2,0],[0,1,1],[0,0,1]]."},
    {"subject_id": mat201_id, "year": 2025, "month": "May", "marks": 3, "frequency_score": 1.5,
     "topics": ["Linear Transformation"],
     "content": "Let T: ℝ³ → ℝ³ be a linear transformation such that T(1,0,0)=(2,-1,4), T(0,1,0)=(1,5,-2), T(0,0,1)=(0,3,1). Find T(2,3,-2)."},

    # ── PART B – Module 1 (9 marks) ────────────────────────────────────────────
    {"subject_id": mat201_id, "year": 2025, "month": "May", "marks": 5, "frequency_score": 2.0,
     "topics": ["Gauss Elimination", "Consistency of Linear Systems"],
     "content": "Find the values of α and β for which the system 2x+3y+5z=9, 7x+3y-2z=8, 2x+3y+αz=β has: (i) no solution, (ii) a unique solution, (iii) infinitely many solutions."},
    {"subject_id": mat201_id, "year": 2025, "month": "May", "marks": 4, "frequency_score": 2.0,
     "topics": ["Eigenvectors"],
     "content": "Find the eigenvectors of the matrix [[1, 2], [2, 4]]."},
    {"subject_id": mat201_id, "year": 2025, "month": "May", "marks": 5, "frequency_score": 1.5,
     "topics": ["Diagonalization"],
     "content": "Diagonalize the matrix A = [[2, -2, 4], [0, 2, 5], [3, -2, 0]], if possible."},
    {"subject_id": mat201_id, "year": 2025, "month": "May", "marks": 4, "frequency_score": 1.5,
     "topics": ["Gauss Elimination"],
     "content": "Solve the system of equations: 2x - y + 3z = 8, -x + 2y + z = 4, 3x + y - 4z = 0."},

    # ── PART B – Module 2 (9 marks) ────────────────────────────────────────────
    {"subject_id": mat201_id, "year": 2025, "month": "May", "marks": 5, "frequency_score": 2.0,
     "topics": ["Coordinate Representation", "Change of Basis"],
     "content": "Find the coordinate matrix of x = (1,2,-1) in ℝ³ relative to the nonstandard basis B' = {(1,0,1), (0,-1,2), (2,3,-5)}."},
    {"subject_id": mat201_id, "year": 2025, "month": "May", "marks": 4, "frequency_score": 1.5,
     "topics": ["Spanning Sets"],
     "content": "Determine whether the set S = {(4,7,3), (-1,2,6), (2,-3,5)} spans ℝ³."},
    {"subject_id": mat201_id, "year": 2025, "month": "May", "marks": 5, "frequency_score": 2.0,
     "topics": ["Transition Matrix", "Change of Basis"],
     "content": "Given B = {(-3,2), (4,-2)} and B' = {(-1,2), (2,-2)} are two bases of ℝ², find the transition matrix from B' to B."},
    {"subject_id": mat201_id, "year": 2025, "month": "May", "marks": 4, "frequency_score": 1.5,
     "topics": ["Linear Combinations"],
     "content": "Write the vector (1,1,1) as a linear combination of vectors in the set {(1,2,3), (0,1,2), (-1,0,1)}, if possible."},

    # ── PART B – Module 3 (9 marks) ────────────────────────────────────────────
    {"subject_id": mat201_id, "year": 2025, "month": "May", "marks": 5, "frequency_score": 2.5,
     "topics": ["Least Squares Regression"],
     "content": "Find the Least Squares regression line for the data points (-1,1), (1,0), (3,-3)."},
    {"subject_id": mat201_id, "year": 2025, "month": "May", "marks": 4, "frequency_score": 2.0,
     "topics": ["Orthogonal Projection"],
     "content": "Using the Euclidean inner product in ℝ³, find the orthogonal projection of u = (6,2,4) onto v = (1,2,0)."},
    {"subject_id": mat201_id, "year": 2025, "month": "May", "marks": 5, "frequency_score": 2.5,
     "topics": ["Gram-Schmidt Process", "Orthonormal Basis"],
     "content": "Apply the Gram-Schmidt orthonormalization process to transform the basis B = {(1,1), (0,1)} into an orthonormal basis."},
    {"subject_id": mat201_id, "year": 2025, "month": "May", "marks": 4, "frequency_score": 2.0,
     "topics": ["Cauchy-Schwarz Inequality", "Inner Product"],
     "content": "Verify the Cauchy-Schwarz inequality for A = [[0,3],[2,1]] and B = [[-3,1],[3,4]] with inner product ⟨A,B⟩ = a₁₁b₁₁ + a₁₂b₁₂ + a₂₁b₂₁ + a₂₂b₂₂."},

    # ── PART B – Module 4 (9 marks) ────────────────────────────────────────────
    {"subject_id": mat201_id, "year": 2025, "month": "May", "marks": 5, "frequency_score": 2.0,
     "topics": ["Linear Transformations"],
     "content": "Show that T(v₁, v₂) = (v₁ - v₂, v₁ + 2v₂) is a linear transformation from ℝ² to ℝ²."},
    {"subject_id": mat201_id, "year": 2025, "month": "May", "marks": 4, "frequency_score": 2.0,
     "topics": ["Kernel of Linear Transformation"],
     "content": "Find the kernel of the linear transformation T: ℝ³ → ℝ² defined by T(x) = Ax, where A = [[1,-1,-2],[3,2,-1]]."},
    {"subject_id": mat201_id, "year": 2025, "month": "May", "marks": 5, "frequency_score": 1.5,
     "topics": ["Standard Matrix", "Linear Transformation"],
     "content": "Find the standard matrix for the linear transformation T(x,y,z) = (x+y, x-y, z-x)."},
    {"subject_id": mat201_id, "year": 2025, "month": "May", "marks": 4, "frequency_score": 1.5,
     "topics": ["Matrix Representation", "Change of Basis", "Linear Transformation"],
     "content": "Let T: ℝ² → ℝ² be defined by T(x₁,x₂) = (x₁+x₂, 2x₁-x₂). Find the matrix for T relative to the bases B = {(1,2),(-1,1)} and B' = {(1,0),(0,1)}."},
]

n = add_questions(GAMAT201_QUESTIONS)
print(f"GAMAT201: added {n} questions")

# ── 4. MAT101 – Linear Algebra and Calculus (Dec 2022) ────────────────────────
# We store these under GAMAT201 since the content perfectly matches the maths
# syllabus; year/month differentiates them from the 2025 paper.
MAT101_2022_QUESTIONS = [
    # PART A (3 marks)
    {"subject_id": mat201_id, "year": 2022, "month": "December", "marks": 3, "frequency_score": 2.0,
     "topics": ["Matrix Rank"],
     "content": "Find the rank of the matrix [[1,-1,3],[-3,0,1],[2,7,-2]]."},
    {"subject_id": mat201_id, "year": 2022, "month": "December", "marks": 3, "frequency_score": 1.5,
     "topics": ["Quadratic Forms", "Principal Axes"],
     "content": "Show that the quadratic form 3x₁² + 22x₁x₂ + 3x₂² = 0 represents a pair of straight lines by transforming it into principal axes form."},
    {"subject_id": mat201_id, "year": 2022, "month": "December", "marks": 3, "frequency_score": 1.5,
     "topics": ["Partial Derivatives"],
     "content": "Find the slope of the surface z = √(xy) in the x-direction at the point (1, 2)."},
    {"subject_id": mat201_id, "year": 2022, "month": "December", "marks": 3, "frequency_score": 1.5,
     "topics": ["Mixed Partial Derivatives", "Clairaut's Theorem"],
     "content": "Prove that Z_xy = Z_yx where Z = x²y + 5y³."},
    {"subject_id": mat201_id, "year": 2022, "month": "December", "marks": 3, "frequency_score": 1.0,
     "topics": ["Double Integrals"],
     "content": "Evaluate ∬ x²y dxdy over appropriate limits."},
    {"subject_id": mat201_id, "year": 2022, "month": "December", "marks": 3, "frequency_score": 1.5,
     "topics": ["Double Integrals", "Area"],
     "content": "Use a double integral to find the area of the plane region enclosed by y = sin x and y = cos x for 0 ≤ x ≤ π/4."},
    {"subject_id": mat201_id, "year": 2022, "month": "December", "marks": 3, "frequency_score": 1.5,
     "topics": ["Series", "Geometric Series"],
     "content": "Determine whether the series Σ(k=1 to ∞) (4/5)^(k+2) converges. If so, find its sum."},
    {"subject_id": mat201_id, "year": 2022, "month": "December", "marks": 3, "frequency_score": 1.5,
     "topics": ["Series Convergence"],
     "content": "Examine the convergence of Σ(k=1 to ∞) 4ᵏ/k²."},
    {"subject_id": mat201_id, "year": 2022, "month": "December", "marks": 3, "frequency_score": 2.0,
     "topics": ["Taylor Series"],
     "content": "Find the Taylor series expansion of f(x) = cos x about x = π/4 up to the third-degree term."},
    {"subject_id": mat201_id, "year": 2022, "month": "December", "marks": 3, "frequency_score": 2.0,
     "topics": ["Fourier Series", "Half-Range Sine Series"],
     "content": "Find the half-range Fourier sine series expansion of f(x) = 2x - x² in (0, π)."},
    # PART B – Module 1
    {"subject_id": mat201_id, "year": 2022, "month": "December", "marks": 7, "frequency_score": 2.0,
     "topics": ["Gauss Elimination"],
     "content": "Solve using Gauss elimination: x + y + z = 2, y + z = -1, 4y + 6z = -12."},
    {"subject_id": mat201_id, "year": 2022, "month": "December", "marks": 7, "frequency_score": 2.5,
     "topics": ["Eigenvalues", "Eigenvectors"],
     "content": "Find the eigenvalues and eigenvectors of the matrix [[1,1,2],[1,2,1],[2,1,1]]."},
    {"subject_id": mat201_id, "year": 2022, "month": "December", "marks": 7, "frequency_score": 1.5,
     "topics": ["Gauss Elimination"],
     "content": "Solve using Gauss elimination: 2x - 3y - 3z + 6w = 2, y + z - 2w = 0, 4x + y + z - 2w = 4."},
    {"subject_id": mat201_id, "year": 2022, "month": "December", "marks": 7, "frequency_score": 2.0,
     "topics": ["Diagonalization"],
     "content": "Find the matrix that diagonalizes Q = [[3,-1],[-1,3]] and write the diagonal matrix."},
    # Module 2 – Multivariable Calculus
    {"subject_id": mat201_id, "year": 2022, "month": "December", "marks": 7, "frequency_score": 1.5,
     "topics": ["Chain Rule", "Partial Derivatives"],
     "content": "If w = f(ρ,θ,φ) with x=ρsinφcosθ, y=ρsinφsinθ, z=ρcosφ, show that (∂w/∂ρ)² + (1/ρ²)(∂w/∂φ)² + (1/(ρ²sin²φ))(∂w/∂θ)² = 1."},
    {"subject_id": mat201_id, "year": 2022, "month": "December", "marks": 7, "frequency_score": 2.0,
     "topics": ["Extrema", "Saddle Points"],
     "content": "Locate all relative extrema and saddle points of f(x,y) = 2xy - x³ - y²."},
    {"subject_id": mat201_id, "year": 2022, "month": "December", "marks": 7, "frequency_score": 1.5,
     "topics": ["Differentials", "Error Analysis"],
     "content": "The length and width of a rectangle are measured with errors of at most r% (small r). Use differentials to approximate the maximum percentage error in the calculated length of the diagonal."},
    {"subject_id": mat201_id, "year": 2022, "month": "December", "marks": 7, "frequency_score": 1.5,
     "topics": ["Local Linear Approximation", "Error"],
     "content": "Find the local linear approximation L of f(x,y) = √(x²+y²) at P(3,4). Compute the error in approximating f by L at Q(3.04, 3.98)."},
    # Module 3 – Multiple Integrals
    {"subject_id": mat201_id, "year": 2022, "month": "December", "marks": 7, "frequency_score": 2.0,
     "topics": ["Double Integrals"],
     "content": "Evaluate ∬ e^(x/y) dA where R is the triangular region bounded by the y-axis, y = x, and y = 1."},
    {"subject_id": mat201_id, "year": 2022, "month": "December", "marks": 7, "frequency_score": 2.0,
     "topics": ["Reversing Order of Integration"],
     "content": "Evaluate ∫(0 to 2)∫(y to 2) e^(y²) dx dy by reversing the order of integration."},
    {"subject_id": mat201_id, "year": 2022, "month": "December", "marks": 7, "frequency_score": 2.0,
     "topics": ["Polar Coordinates", "Double Integrals"],
     "content": "By converting to polar coordinates, evaluate ∫(0 to 2)∫(0 to √(4-x²)) (x²+y²) dy dx."},
    {"subject_id": mat201_id, "year": 2022, "month": "December", "marks": 7, "frequency_score": 1.5,
     "topics": ["Volume", "Triple Integrals"],
     "content": "Find the volume of the solid in the first octant bounded by the coordinate planes and the plane x + y + z = 1."},
    # Module 4 – Series
    {"subject_id": mat201_id, "year": 2022, "month": "December", "marks": 7, "frequency_score": 2.0,
     "topics": ["Series Convergence", "Ratio Test"],
     "content": "Test the convergence of: (i) Σ xᵏ/k!, (ii) Σ (k+1)/k · 3^(-k)."},
    {"subject_id": mat201_id, "year": 2022, "month": "December", "marks": 7, "frequency_score": 1.5,
     "topics": ["Series Convergence"],
     "content": "Test the convergence of the series: 1 + 1!/3 + (1·3)/(5!) + (1·3·5)/(7!) + ..."},
    {"subject_id": mat201_id, "year": 2022, "month": "December", "marks": 7, "frequency_score": 1.5,
     "topics": ["Alternating Series"],
     "content": "Determine whether the alternating series Σ(-1)^(n+1) · n/(n²+1) is conditionally convergent."},
    {"subject_id": mat201_id, "year": 2022, "month": "December", "marks": 7, "frequency_score": 1.5,
     "topics": ["Series Convergence"],
     "content": "Test the convergence of: (i) Σ ln(k+1)/[k(k+1)], (ii) Σ (2k+5)!/(3^k · k!)."},
    # Module 5 – Fourier Series
    {"subject_id": mat201_id, "year": 2022, "month": "December", "marks": 7, "frequency_score": 2.5,
     "topics": ["Fourier Series"],
     "content": "Find the Fourier series expansion of f(x) = x² - x in (0, 2π)."},
    {"subject_id": mat201_id, "year": 2022, "month": "December", "marks": 7, "frequency_score": 2.5,
     "topics": ["Fourier Series", "Half-Range Series"],
     "content": "Find the half-range Fourier sine and cosine series of f(x) = x in (0, π)."},
    {"subject_id": mat201_id, "year": 2022, "month": "December", "marks": 7, "frequency_score": 2.5,
     "topics": ["Fourier Series"],
     "content": "Find the Fourier series of f(x) = π + x for -π < x ≤ 0 and f(x) = π - x for 0 < x < π. Hence show that 1 + 1/3² + 1/5² + ... = π²/8."},
    {"subject_id": mat201_id, "year": 2022, "month": "December", "marks": 7, "frequency_score": 2.5,
     "topics": ["Fourier Series", "Half-Range Sine Series"],
     "content": "Obtain the half-range Fourier sine series of f(x) = x for 0 < x < π/2 and f(x) = π - x for π/2 < x < π. Hence find π²/8."},
]
n = add_questions(MAT101_2022_QUESTIONS)
print(f"MAT101-2022: added {n} questions")

# ── 5. MAT101 – Linear Algebra and Calculus (Dec 2023) ────────────────────────
MAT101_2023_QUESTIONS = [
    {"subject_id": mat201_id, "year": 2023, "month": "December", "marks": 3, "frequency_score": 2.0,
     "topics": ["Matrix Rank"],
     "content": "Find the rank of the matrix [[3,5,0],[0,0,5],[5,0,0]]."},
    {"subject_id": mat201_id, "year": 2023, "month": "December", "marks": 3, "frequency_score": 1.5,
     "topics": ["Quadratic Forms"],
     "content": "Show that the quadratic form Q = 3x₁² + 22x₁x₂ + 3x₂² is indefinite."},
    {"subject_id": mat201_id, "year": 2023, "month": "December", "marks": 3, "frequency_score": 1.5,
     "topics": ["Partial Derivatives"],
     "content": "Find f_x(1,3) and f_y(1,3) if f(x,y) = 2x³y² + 2y + 4x."},
    {"subject_id": mat201_id, "year": 2023, "month": "December", "marks": 3, "frequency_score": 1.5,
     "topics": ["Chain Rule"],
     "content": "If z = x²y² where x = t⁴ and y = t³, find dz/dt using the chain rule."},
    {"subject_id": mat201_id, "year": 2023, "month": "December", "marks": 3, "frequency_score": 1.5,
     "topics": ["Double Integrals"],
     "content": "Evaluate ∫(0 to 1)∫(0 to 2) (x + y) dy dx."},
    {"subject_id": mat201_id, "year": 2023, "month": "December", "marks": 3, "frequency_score": 1.5,
     "topics": ["Double Integrals"],
     "content": "Evaluate ∬ x dA, where R is the triangular region bounded by the x-axis, y = x, and x = 1."},
    {"subject_id": mat201_id, "year": 2023, "month": "December", "marks": 3, "frequency_score": 2.0,
     "topics": ["Series", "Geometric Series"],
     "content": "Determine whether the series Σ(k=1 to ∞) (-3/5)^k converges. If so, find its sum."},
    {"subject_id": mat201_id, "year": 2023, "month": "December", "marks": 3, "frequency_score": 1.5,
     "topics": ["Series Convergence"],
     "content": "Examine the convergence of Σ(k=1 to ∞) 4ᵏ/k²."},
    {"subject_id": mat201_id, "year": 2023, "month": "December", "marks": 3, "frequency_score": 2.0,
     "topics": ["Taylor Series"],
     "content": "Find the Taylor series expansion of f(x) = 1/x about x = -1."},
    {"subject_id": mat201_id, "year": 2023, "month": "December", "marks": 3, "frequency_score": 2.0,
     "topics": ["Fourier Series", "Half-Range Sine Series"],
     "content": "Find the half-range Fourier sine series representation of f(x) = k in (0, π)."},
    # Part B – Module 1
    {"subject_id": mat201_id, "year": 2023, "month": "December", "marks": 7, "frequency_score": 2.0,
     "topics": ["Gauss Elimination"],
     "content": "Solve using Gauss elimination: x + y - z = 9, 8y + 6z = -6, -2x + 4y - 6z = 40."},
    {"subject_id": mat201_id, "year": 2023, "month": "December", "marks": 7, "frequency_score": 2.5,
     "topics": ["Eigenvalues", "Eigenvectors"],
     "content": "Find the eigenvalues and eigenvectors of [[1,0,-1],[1,1,2],[3,2,2]]."},
    {"subject_id": mat201_id, "year": 2023, "month": "December", "marks": 7, "frequency_score": 1.5,
     "topics": ["Gauss Elimination"],
     "content": "Solve using Gauss elimination: 3x - 11y - 2z = -6, 4y + 4z = 24, 6x - 17y + z = 18."},
    {"subject_id": mat201_id, "year": 2023, "month": "December", "marks": 7, "frequency_score": 2.0,
     "topics": ["Diagonalization"],
     "content": "Find the matrix that diagonalizes A = [[2,4],[4,2]] and write the diagonal matrix."},
    # Module 2
    {"subject_id": mat201_id, "year": 2023, "month": "December", "marks": 7, "frequency_score": 1.5,
     "topics": ["Chain Rule", "Partial Derivatives"],
     "content": "If w = x² + y² - z² where x=ρsinφcosθ, y=ρsinφsinθ, z=ρcosφ, find ∂w/∂ρ and ∂w/∂θ using the chain rule."},
    {"subject_id": mat201_id, "year": 2023, "month": "December", "marks": 7, "frequency_score": 2.0,
     "topics": ["Extrema", "Saddle Points"],
     "content": "Locate all relative extrema and saddle points of f(x,y) = x³ + 3xy² - 15x² - 15y² + 72x."},
    {"subject_id": mat201_id, "year": 2023, "month": "December", "marks": 7, "frequency_score": 1.5,
     "topics": ["Laplace Equation", "Partial Derivatives"],
     "content": "Show that f(x,y) = 2tan⁻¹(y/x) satisfies the Laplace equation f_xx + f_yy = 0."},
    {"subject_id": mat201_id, "year": 2023, "month": "December", "marks": 7, "frequency_score": 1.5,
     "topics": ["Local Linear Approximation"],
     "content": "Find the local linear approximation L of f(x,y) = ln(xy) at P(1,2). Compute the error in approximating f by L at Q(1.01, 2.01)."},
    # Module 3
    {"subject_id": mat201_id, "year": 2023, "month": "December", "marks": 7, "frequency_score": 2.0,
     "topics": ["Double Integrals", "Polar Coordinates"],
     "content": "Evaluate ∬(3x - 2y) dA where R is enclosed by the circle x² + y² = 1."},
    {"subject_id": mat201_id, "year": 2023, "month": "December", "marks": 7, "frequency_score": 2.0,
     "topics": ["Reversal of Order of Integration"],
     "content": "Evaluate ∫(0 to 1)∫(4x to 4) e^(-y²) dy dx by reversing the order of integration."},
    {"subject_id": mat201_id, "year": 2023, "month": "December", "marks": 7, "frequency_score": 2.0,
     "topics": ["Polar Coordinates", "Double Integrals"],
     "content": "Evaluate ∫(0 to 2)∫(0 to √(4-x²)) y(x²+y²) dx dy using polar coordinates."},
    {"subject_id": mat201_id, "year": 2023, "month": "December", "marks": 7, "frequency_score": 1.5,
     "topics": ["Volume", "Triple Integrals"],
     "content": "Let G be the tetrahedron in the first octant bounded by the coordinate planes and the plane x/a + y/b + z/c = 1 (a,b,c > 0). Find the volume of G."},
    # Module 4 – Convergence
    {"subject_id": mat201_id, "year": 2023, "month": "December", "marks": 7, "frequency_score": 2.0,
     "topics": ["Series Convergence"],
     "content": "Test the convergence of: (i) Σ (4k²-2k+6)/(8k⁷+k-8), (ii) Σ ((k+1)/k)^(k²)."},
    {"subject_id": mat201_id, "year": 2023, "month": "December", "marks": 7, "frequency_score": 1.5,
     "topics": ["Series Convergence"],
     "content": "Test the convergence of 1 + (1·2)/(1·3) + (1·2·3)/(1·3·5) + (1·2·3·4)/(1·3·5·7) + ..."},
    {"subject_id": mat201_id, "year": 2023, "month": "December", "marks": 7, "frequency_score": 1.5,
     "topics": ["Alternating Series"],
     "content": "Show that Σ (-1)^(k+1) · (k+3)/[k(k+1)] is conditionally convergent."},
    {"subject_id": mat201_id, "year": 2023, "month": "December", "marks": 7, "frequency_score": 1.5,
     "topics": ["Series Convergence"],
     "content": "Test the convergence of: (i) Σ (k+3)!/(3!·k!·3^k), (ii) Σ 1/∛(2k-1)."},
    # Module 5 – Fourier Series
    {"subject_id": mat201_id, "year": 2023, "month": "December", "marks": 7, "frequency_score": 2.5,
     "topics": ["Fourier Series"],
     "content": "Find the Fourier series expansion of f(x) = x + x² in the range (-π, π)."},
    {"subject_id": mat201_id, "year": 2023, "month": "December", "marks": 7, "frequency_score": 2.5,
     "topics": ["Fourier Series", "Half-Range Sine Series"],
     "content": "Obtain the half-range Fourier sine series of f(x) = x for 0 < x < 2 and f(x) = 4 - x for 2 < x < 4."},
    {"subject_id": mat201_id, "year": 2023, "month": "December", "marks": 7, "frequency_score": 2.5,
     "topics": ["Fourier Series"],
     "content": "Find the Fourier series of f(x) = |x| in (-π, π). Hence show that 1 + 1/3² + 1/5² + ... = π²/8."},
    {"subject_id": mat201_id, "year": 2023, "month": "December", "marks": 7, "frequency_score": 2.0,
     "topics": ["Fourier Series", "Half-Range Cosine Series"],
     "content": "Obtain the half-range Fourier cosine series of f(x) = x² in 0 < x < 2."},
]
n = add_questions(MAT101_2023_QUESTIONS)
print(f"MAT101-2023: added {n} questions")

# ── 6. MAT102 – Vector Calculus, Differential Equations and Transforms (Jun 2023) ─
MAT102_2023_QUESTIONS = [
    # Part A (3 marks)
    {"subject_id": mat201_id, "year": 2023, "month": "June", "marks": 3, "frequency_score": 1.5,
     "topics": ["Vector Calculus", "Tangent Vector"],
     "content": "Find the parametric equation of the tangent vector of the curve r⃗(t) = t²î + 2t³ĵ + 3tk̂ at t = 1."},
    {"subject_id": mat201_id, "year": 2023, "month": "June", "marks": 3, "frequency_score": 2.0,
     "topics": ["Directional Derivative"],
     "content": "Find the directional derivative of f(x,y) = xe^y at (1,1) in the direction of the vector î - ĵ."},
    {"subject_id": mat201_id, "year": 2023, "month": "June", "marks": 3, "frequency_score": 2.0,
     "topics": ["Green's Theorem", "Line Integral"],
     "content": "Use Green's theorem to evaluate ∮(x dy - y dx) where C is the circle x² + y² = 4."},
    {"subject_id": mat201_id, "year": 2023, "month": "June", "marks": 3, "frequency_score": 1.5,
     "topics": ["Divergence", "Sources and Sinks"],
     "content": "Determine whether the vector field F⃗ = 4(x³-x)î + 4(y³-y)ĵ + 4(z³-z)k̂ is free of sources and sinks. If not, locate them."},
    {"subject_id": mat201_id, "year": 2023, "month": "June", "marks": 3, "frequency_score": 1.5,
     "topics": ["Linear Independence of Functions"],
     "content": "Show that the functions x and x ln x are linearly independent."},
    {"subject_id": mat201_id, "year": 2023, "month": "June", "marks": 3, "frequency_score": 2.0,
     "topics": ["Second Order ODE", "Differential Equations"],
     "content": "Solve the differential equation y'' + 4y' + 2.5y = 0."},
    {"subject_id": mat201_id, "year": 2023, "month": "June", "marks": 3, "frequency_score": 2.0,
     "topics": ["Laplace Transform"],
     "content": "Find the Laplace transform of sin(4t)cos(3t)."},
    {"subject_id": mat201_id, "year": 2023, "month": "June", "marks": 3, "frequency_score": 1.5,
     "topics": ["Laplace Transform", "Unit Step Function"],
     "content": "Find the Laplace transform of e^(-3t) u(t-1)."},
    {"subject_id": mat201_id, "year": 2023, "month": "June", "marks": 3, "frequency_score": 1.5,
     "topics": ["Fourier Sine Transform"],
     "content": "Determine the Fourier sine transform of f(x) = 3x, 0 < x < 6."},
    {"subject_id": mat201_id, "year": 2023, "month": "June", "marks": 3, "frequency_score": 1.5,
     "topics": ["Fourier Integral"],
     "content": "Find the Fourier sine integral of f(x) = sin x for 0 < x < π and f(x) = 0 for x > π."},
    # Part B – Module 1
    {"subject_id": mat201_id, "year": 2023, "month": "June", "marks": 7, "frequency_score": 2.0,
     "topics": ["Divergence", "Curl"],
     "content": "Find the divergence and curl of F(x,y,z) = zy î + y²x ĵ + yz² k̂."},
    {"subject_id": mat201_id, "year": 2023, "month": "June", "marks": 7, "frequency_score": 2.0,
     "topics": ["Conservative Vector Field", "Potential Function"],
     "content": "Show that F⃗ = (cos y + y cos x)î + (sin x - x sin y)ĵ is conservative and find its potential function."},
    {"subject_id": mat201_id, "year": 2023, "month": "June", "marks": 7, "frequency_score": 1.5,
     "topics": ["Line Integral", "Work Done"],
     "content": "Find the work done by F⃗ = xy î + yz ĵ + xz k̂ on a particle moving along r⃗(t) = tî + t²ĵ + t³k̂ for 0 ≤ t ≤ 1."},
    {"subject_id": mat201_id, "year": 2023, "month": "June", "marks": 7, "frequency_score": 2.0,
     "topics": ["Path Independence", "Exact Differentials"],
     "content": "Show that ∫(3x²eʸ dx + x³eʸ dy) is path-independent and evaluate from (0,0) to (3,2)."},
    # Module 2
    {"subject_id": mat201_id, "year": 2023, "month": "June", "marks": 7, "frequency_score": 2.5,
     "topics": ["Green's Theorem"],
     "content": "Using Green's theorem, evaluate ∫(xy + y²)dx + x²dy where C is bounded by y=x and y=x² (positively oriented)."},
    {"subject_id": mat201_id, "year": 2023, "month": "June", "marks": 7, "frequency_score": 1.5,
     "topics": ["Surface Integral"],
     "content": "Evaluate ∬ z² dS where σ is the portion of the cone z = √(x²+y²) between z=1 and z=3."},
    {"subject_id": mat201_id, "year": 2023, "month": "June", "marks": 7, "frequency_score": 2.0,
     "topics": ["Gauss Divergence Theorem", "Flux"],
     "content": "Evaluate ∬ F⃗ · n̂ dS over the cylinder x²+y²=4, between z=0 and z=3, where F⃗=(2x-y)î+(2y-z)ĵ+z²k̂."},
    {"subject_id": mat201_id, "year": 2023, "month": "June", "marks": 7, "frequency_score": 2.0,
     "topics": ["Stokes' Theorem"],
     "content": "Apply Stokes' theorem to evaluate ∫(x-y)dx+(y-z)dy+(z-x)dz where C is the boundary of the plane x+y+z=1 in the first octant."},
    # Module 3 – ODEs
    {"subject_id": mat201_id, "year": 2023, "month": "June", "marks": 7, "frequency_score": 2.0,
     "topics": ["Cauchy-Euler Equation"],
     "content": "Solve the Cauchy-Euler differential equation (x²D² - 3xD + 10)y = 0."},
    {"subject_id": mat201_id, "year": 2023, "month": "June", "marks": 7, "frequency_score": 2.0,
     "topics": ["IVP", "Second Order ODE"],
     "content": "Solve the IVP: y'' - 2y' + 5y = 0, y(0) = -3, y'(0) = 1."},
    {"subject_id": mat201_id, "year": 2023, "month": "June", "marks": 7, "frequency_score": 2.0,
     "topics": ["Undetermined Coefficients"],
     "content": "By the method of undetermined coefficients, solve y'' + y' - 2y = sin x."},
    {"subject_id": mat201_id, "year": 2023, "month": "June", "marks": 7, "frequency_score": 2.0,
     "topics": ["Variation of Parameters"],
     "content": "Using variation of parameters, solve d²y/dx² + 4y = sec²x."},
    # Module 4 – Laplace Transform
    {"subject_id": mat201_id, "year": 2023, "month": "June", "marks": 7, "frequency_score": 2.0,
     "topics": ["Laplace Transform"],
     "content": "Find the Laplace transform of cos²t."},
    {"subject_id": mat201_id, "year": 2023, "month": "June", "marks": 7, "frequency_score": 2.0,
     "topics": ["Inverse Laplace Transform", "Partial Fractions"],
     "content": "Find the inverse Laplace transform of (3s+2)/[(s-1)(s²+1)]."},
    {"subject_id": mat201_id, "year": 2023, "month": "June", "marks": 7, "frequency_score": 2.5,
     "topics": ["Laplace Transform", "Solving ODEs"],
     "content": "Using Laplace transforms, solve y'' + 5y' + 6y = e^(-2t) given y(0) = y'(0) = 1."},
    {"subject_id": mat201_id, "year": 2023, "month": "June", "marks": 7, "frequency_score": 1.5,
     "topics": ["Convolution Theorem", "Inverse Laplace Transform"],
     "content": "Find the inverse Laplace transform of s/(s²+a²)² using convolution."},
    # Module 5 – Fourier Transforms
    {"subject_id": mat201_id, "year": 2023, "month": "June", "marks": 7, "frequency_score": 2.0,
     "topics": ["Fourier Transform"],
     "content": "Find the Fourier transform of f(x) = 1 for |x|<1, 0 otherwise. Hence show ∫(0 to ∞) sin(w)/w dw = π/2."},
    {"subject_id": mat201_id, "year": 2023, "month": "June", "marks": 7, "frequency_score": 2.0,
     "topics": ["Fourier Sine Transform"],
     "content": "Find the Fourier sine transform and inverse transform of e^(-ax), x > 0, a > 0."},
    {"subject_id": mat201_id, "year": 2023, "month": "June", "marks": 7, "frequency_score": 1.5,
     "topics": ["Complex Fourier Transform"],
     "content": "Find the complex Fourier transform of f(x) = sin x for |x| ≤ a (a > 0) and f(x) = 0 for |x| > a."},
    {"subject_id": mat201_id, "year": 2023, "month": "June", "marks": 7, "frequency_score": 1.5,
     "topics": ["Fourier Transform"],
     "content": "Find the Fourier transform of f(x) = 1 - x² for |x| ≤ 1 and f(x) = 0 otherwise."},
]
n = add_questions(MAT102_2023_QUESTIONS)
print(f"MAT102-2023: added {n} questions")

# ── 7. Update frequency scores based on repetition ────────────────────────────
# Questions that appear in multiple years get boosted
repeated_topics = [
    "Gauss Elimination", "Eigenvalues", "Eigenvectors", "Diagonalization",
    "Matrix Rank", "Fourier Series", "Taylor Series", "Laplace Transform",
    "Gram-Schmidt Process", "Least Squares Regression",
    "Green's Theorem", "Stokes' Theorem", "Extrema",
    "Orthogonal Projection", "Cauchy-Schwarz Inequality",
]
from sqlalchemy import cast, String
for topic in repeated_topics:
    qs = db.query(Question).filter(
        Question.subject_id == mat201_id
    ).all()
    for q in qs:
        if q.topics and topic in q.topics:
            q.frequency_score = min(q.frequency_score + 0.5, 3.0)
db.commit()
print("Frequency scores updated for repeated topics.")

print("\n✅ Seeding complete!")
print(f"   Total subjects: {db.query(Subject).filter(Subject.semester==2).count()}")
print(f"   Total questions under GAMAT201: {db.query(Question).filter(Question.subject_id==mat201_id).count()}")
db.close()
