@echo off
echo ========================================
echo   Email Classifier - Backend Setup
echo ========================================
echo.

echo [1/4] Creating virtual environment...
python -m venv venv

echo [2/4] Activating virtual environment...
call venv\Scripts\activate.bat

echo [3/4] Installing dependencies...
pip install --upgrade pip
pip install -r requirements.txt

echo [4/4] Training ML model...
python train_model.py

echo.
echo ========================================
echo   Backend setup complete!
echo ========================================
echo.
echo Next steps:
echo 1. Make sure MongoDB is running
echo 2. Run 'start_backend.bat' to start the server
echo.
pause
