# KTU AI-Powered Academic Platform

A centralized AI-powered platform for APJ Abdul Kalam Technological University students to organize PYQs, evaluate answers with AI, and get exam predictions. Everything runs locally on your PC (except AI APIs which use free tiers).

## ✨ Features

- **PYQ Management**: Organize all KTU previous year questions by department and subject
- **Frequent Questions**: Automatically identify and separate frequently asked questions
- **Mock Exam Simulation**: Real exam environment with timer and auto-submit
- **AI Answer Evaluation**: Get instant grades and improvement feedback using AI
- **Smart Predictions**: AI predicts which questions are likely in upcoming exams
- **AI Study Buddy**: 24/7 chat support for doubt clearing
- **YouTube Integration**: Quick access to concept videos
- **Stress Support**: AI-based emotional support and motivation

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│              YOUR PC                    │
│  ┌──────────────┬────────────────────┐ │
│  │   Frontend   │      Backend       │ │
│  │  React+Vite  │  FastAPI+SQLite    │ │
│  │  localhost   │   localhost:8000   │ │
│  └──────────────┴────────────────────┘ │
│                                         │
│  External (Free Tier):                  │
│  • Google AI Studio (60 req/min)       │
│  • OpenRouter (20 req/min)             │
│  • Groq (20 req/min)                   │
└─────────────────────────────────────────┘
```

## 📋 Prerequisites

- Python 3.8+ 
- Node.js 18+
- Tesseract OCR (for image text extraction)

### Install Tesseract OCR

**Windows:**
```bash
# Download and install from:
# https://github.com/UB-Mannheim/tesseract/wiki

# Add to PATH or set in config:
# pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
```

**Mac:**
```bash
brew install tesseract
```

**Linux:**
```bash
sudo apt-get install tesseract-ocr
```

## 🚀 Quick Start

### 1. Clone/Setup Project

```bash
cd ktu-ai-platform
```

### 2. Setup Backend

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
echo "GOOGLE_AI_API_KEY=your_key_here" > .env
echo "OPENROUTER_API_KEY=your_key_here" >> .env
echo "GROQ_API_KEY=your_key_here" >> .env

# Start backend
uvicorn app.main:app --reload
```

### 3. Setup Frontend (New Terminal)

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### 4. Access Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

## 🔑 API Keys Setup

Get your free API keys:

1. **Google AI Studio** (Recommended - 60 req/min free)
   - Visit: https://makersuite.google.com/app/apikey
   - Create API key
   - Copy to `.env` file

2. **OpenRouter** (20 req/min free)
   - Visit: https://openrouter.ai/keys
   - Create account and get API key
   - Copy to `.env` file

3. **Groq** (20 req/min free)
   - Visit: https://console.groq.com/keys
   - Create account and get API key
   - Copy to `.env` file

**Note**: You only need one API key to start. Google AI Studio is recommended.

## 📁 Project Structure

```
ktu-ai-platform/
├── backend/
│   ├── app/
│   │   ├── core/           # Config, database
│   │   ├── models/         # SQLAlchemy models, Pydantic schemas
│   │   ├── routers/        # API endpoints
│   │   ├── services/       # Business logic, AI integration
│   │   └── main.py         # FastAPI application entry
│   ├── data/               # SQLite database
│   ├── uploads/            # Uploaded PDFs and images
│   ├── chroma/             # Vector database
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   └── App.tsx         # Main application
│   └── package.json
└── README.md
```

## 💡 Usage Guide

### 1. Initial Setup

1. Open http://localhost:5173
2. Go to Dashboard
3. The system comes with sample data, but you can add more departments and subjects

### 2. Upload PYQs

1. Navigate to "PYQs" section
2. Click "Upload PYQ" button
3. Select subject, year, and month
4. Upload PDF file
5. System will automatically extract and organize questions

### 3. Practice Questions

1. Browse PYQs with filters (department, semester, subject)
2. Look for "Frequent" badge for commonly asked questions
3. Click "Practice" to work on specific questions

### 4. Take Mock Exam

1. Go to "Mock Exam" section
2. Configure exam settings:
   - Select subject
   - Number of questions
   - Duration
   - Include frequent/predicted questions
3. Start exam and answer questions
4. Submit when done
5. View AI evaluation and feedback

### 5. AI Features

**Doubt Clearing:**
- Go to "AI Helper" → "Chat"
- Ask any question
- Get instant answers and YouTube video suggestions

**Answer Evaluation:**
- Go to "AI Helper" → "Answer Evaluator"
- Paste question and your answer
- Get AI-powered grading and improvement tips

**Stress Support:**
- Go to "AI Helper" → "Stress Support"
- Select your mood
- Get motivational messages and coping strategies

### 6. View Results

1. Go to "Results" section
2. View exam history and scores
3. Click on any exam to see detailed breakdown
4. Review AI feedback for each question

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the `backend` directory:

```env
# AI API Keys (Free tiers)
GOOGLE_AI_API_KEY=your_google_ai_key
OPENROUTER_API_KEY=your_openrouter_key
GROQ_API_KEY=your_groq_key

# Optional: YouTube API Key for video search
YOUTUBE_API_KEY=your_youtube_key
```

### Backend Settings

Edit `backend/app/core/config.py` to customize:

```python
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg"}
DEFAULT_AI_PROVIDER = "google"  # google, openrouter, groq
```

## 📊 Daily Limits (Free Tiers)

| Provider | Requests/Day | Best For |
|----------|--------------|----------|
| Google AI Studio | ~86,400 (60/min) | Primary choice |
| OpenRouter | ~28,800 (20/min) | Fallback |
| Groq | ~28,800 (20/min) | Speed-critical tasks |

**Total**: ~144,000 API calls/day - plenty for personal use!

## 🛠️ Development

### Adding New Features

1. **Backend**: Add routes in `app/routers/`, logic in `app/services/`
2. **Frontend**: Add pages in `src/pages/`, components in `src/components/`
3. **Database**: Models in `app/models/models.py`, auto-migrated on startup

### Database Migrations

If you need to modify database schema:

```bash
cd backend

# Install alembic
pip install alembic

# Initialize migrations
alembic init migrations

# Create migration
alembic revision --autogenerate -m "description"

# Apply migration
alembic upgrade head
```

## 🐛 Troubleshooting

### Common Issues

**1. Backend won't start**
```bash
# Check if port 8000 is in use
lsof -i :8000  # Mac/Linux
netstat -ano | findstr :8000  # Windows

# Kill process or change port
uvicorn app.main:app --reload --port 8001
```

**2. Frontend can't connect to backend**
- Ensure backend is running
- Check CORS settings in `backend/app/main.py`
- Verify proxy config in `frontend/vite.config.ts`

**3. AI evaluation fails**
- Check API keys in `.env` file
- Verify you have internet connection
- Check API quota limits
- Try switching AI provider in settings

**4. PDF processing fails**
- Ensure PDF is text-based (not scanned images)
- For scanned PDFs, OCR will extract text
- Check file size (max 10MB)

**5. Database errors**
- Delete `backend/data/ktu_ai_platform.db` to reset
- Restart backend to recreate tables

## 🤝 Contributing

This is a personal project, but suggestions are welcome!

## 📝 License

MIT License - Feel free to use and modify!

## 🙏 Acknowledgments

- FastAPI for the amazing backend framework
- React and Vite for the frontend
- Google AI Studio, OpenRouter, and Groq for free AI APIs
- KTU for the academic content (PYQs)

## 📧 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review API logs in backend terminal
3. Check browser console for frontend errors

---

**Built with ❤️ for KTU Students**