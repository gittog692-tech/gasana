@echo off
echo ===================================
echo KTU AI Platform - Setup Script
echo ===================================
echo.

REM Check Python
py --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python launcher is not installed
    echo Please install Python 3.8+ from https://python.org
    pause
    exit /b 1
)

REM Check Node
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js 18+ from https://nodejs.org
    pause
    exit /b 1
)

echo [1/4] Setting up Backend...
cd backend

if not exist venv (
    echo Creating virtual environment...
    py -3.11 -m venv venv
)

echo Activating virtual environment...
call venv\Scripts\activate

echo Installing Python dependencies...
pip install -r requirements.txt

echo.
echo [2/4] Creating .env file...
if not exist .env (
    echo # Add your API keys here > .env
    echo GOOGLE_AI_API_KEY= >> .env
    echo OPENROUTER_API_KEY= >> .env
    echo GROQ_API_KEY= >> .env
    echo .env file created. Please add your API keys!
)

echo.
echo [3/4] Setting up Frontend...
cd ..\frontend

echo Installing Node dependencies...
npm install

echo.
echo [4/4] Setup Complete!
echo.
echo ===================================
echo NEXT STEPS:
echo ===================================
echo 1. Add your API keys to backend\.env
echo 2. Terminal 1: cd backend ^&^& venv\Scripts\activate ^&^& python -m uvicorn app.main:app --reload
echo 3. Terminal 2: cd frontend ^&^& npm run dev
echo 4. Open http://localhost:5173 in browser
echo.
echo Get free API keys from:
echo - Google AI Studio: https://makersuite.google.com/app/apikey
echo - OpenRouter: https://openrouter.ai/keys
echo - Groq: https://console.groq.com/keys
echo.
pause
