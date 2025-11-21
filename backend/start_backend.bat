@echo off
echo ========================================
echo   Starting Email Classifier Backend
echo ========================================
echo.

call venv\Scripts\activate.bat

echo Starting FastAPI server on http://localhost:8000
echo.
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
