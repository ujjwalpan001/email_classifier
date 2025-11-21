@echo off
echo ================================================
echo   Email Classifier - System Check
echo ================================================
echo.

echo Checking prerequisites...
echo.

:: Check Python
echo [1/4] Checking Python...
python --version >nul 2>&1
if %errorlevel% equ 0 (
    python --version
    echo ✓ Python is installed
) else (
    echo ✗ Python is NOT installed
    echo   Download from: https://www.python.org/downloads/
)
echo.

:: Check Node.js
echo [2/4] Checking Node.js...
node --version >nul 2>&1
if %errorlevel% equ 0 (
    node --version
    echo ✓ Node.js is installed
) else (
    echo ✗ Node.js is NOT installed
    echo   Download from: https://nodejs.org/
)
echo.

:: Check npm
echo [3/4] Checking npm...
npm --version >nul 2>&1
if %errorlevel% equ 0 (
    npm --version
    echo ✓ npm is installed
) else (
    echo ✗ npm is NOT installed
    echo   Install Node.js to get npm
)
echo.

:: Check MongoDB
echo [4/4] Checking MongoDB...
sc query MongoDB >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ MongoDB service exists
    sc query MongoDB | find "RUNNING" >nul 2>&1
    if %errorlevel% equ 0 (
        echo ✓ MongoDB is RUNNING
    ) else (
        echo ⚠ MongoDB service exists but is NOT running
        echo   Start with: net start MongoDB
    )
) else (
    echo ✗ MongoDB is NOT installed or service not found
    echo   Download from: https://www.mongodb.com/try/download/community
)
echo.

echo ================================================
echo   System Check Complete
echo ================================================
echo.
echo If all prerequisites are installed, run SETUP.bat
echo.
pause
