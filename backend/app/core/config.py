import os
from dotenv import load_dotenv

load_dotenv()

# API Keys (Free tier)
GOOGLE_AI_API_KEY = os.getenv("GOOGLE_AI_API_KEY", "")
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")

# Application Settings
APP_NAME = "KTU AI Platform"
APP_VERSION = "1.0.0"
DEBUG = os.getenv("DEBUG", "true").lower() == "true"

# Database
DATABASE_URL = "sqlite:///./data/ktu_ai_platform.db"

# File Uploads
UPLOAD_DIR = "./uploads"
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg", ".webp", ".gif"}

# AI Settings
DEFAULT_AI_PROVIDER = "google"  # google, openrouter, groq
MAX_TOKENS = 800
TEMPERATURE = 0.7

# ChromaDB
CHROMA_PERSIST_DIR = "./chroma"
EMBEDDING_MODEL = "all-MiniLM-L6-v2"

# YouTube API (optional - can use search without API)
YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY", "")
