@echo off
echo ================================================
echo   Email Classifier - Complete Project Setup
echo ================================================
echo.

echo This script will set up both frontend and backend
echo.
pause

echo.
echo [STEP 1] Setting up Backend...
echo ================================================
cd backend
call setup.bat
cd ..

echo.
echo [STEP 2] Setting up Frontend...
echo ================================================
cd frontend
call setup.bat
cd ..

echo.
echo ================================================
echo   Setup Complete!
echo ================================================
echo.
echo To start the application:
echo 1. Make sure MongoDB is running on localhost:27017
echo 2. Open a terminal and run: backend\start_backend.bat
echo 3. Open another terminal and run: frontend\start_frontend.bat
echo 4. Open browser and go to: http://localhost:3000
echo.
pause
