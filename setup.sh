#!/bin/bash

echo "==================================="
echo "GASANA- Setup Script"
echo "==================================="
echo ""

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "ERROR: Python 3 is not installed"
    echo "Please install Python 3.8+ from https://python.org"
    exit 1
fi

# Check Node
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed"
    echo "Please install Node.js 18+ from https://nodejs.org"
    exit 1
fi

echo "[1/4] Setting up Backend..."
cd backend

if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

echo "Activating virtual environment..."
source venv/bin/activate

echo "Installing Python dependencies..."
pip install -r requirements.txt

echo ""
echo "[2/4] Creating .env file..."
if [ ! -f ".env" ]; then
    cat > .env << EOF
# Add your API keys here
GOOGLE_AI_API_KEY=
OPENROUTER_API_KEY=
GROQ_API_KEY=
EOF
    echo ".env file created. Please add your API keys!"
fi

echo ""
echo "[3/4] Setting up Frontend..."
cd ../frontend

echo "Installing Node dependencies..."
npm install

echo ""
echo "[4/4] Setup Complete!"
echo ""
echo "==================================="
echo "NEXT STEPS:"
echo "==================================="
echo "1. Add your API keys to backend/.env"
echo "2. Terminal 1: cd backend && source venv/bin/activate && uvicorn app.main:app --reload"
echo "3. Terminal 2: cd frontend && npm run dev"
echo "4. Open http://localhost:5173 in browser"
echo ""
echo "Get free API keys from:"
echo "- Google AI Studio: https://makersuite.google.com/app/apikey"
echo "- OpenRouter: https://openrouter.ai/keys"
echo "- Groq: https://console.groq.com/keys"
echo ""
read -p "Press Enter to continue..."