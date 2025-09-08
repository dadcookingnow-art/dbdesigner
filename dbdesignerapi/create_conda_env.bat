@echo on
echo ========================================
echo   Create Anaconda Environment
echo ========================================

echo.
echo 1. Creating conda environment: dbdesigner-api
conda create -n dbdesigner-api python=3.12.3 -y

if %ERRORLEVEL% neq 0 (
    echo Error creating conda environment!
    pause
    exit /b 1
)

echo.
echo 2. Installing dependencies with conda run...

echo Installing FastAPI and dependencies from requirements.txt...
conda run -n dbdesigner-api pip install -r requirements.txt

echo.
echo ========================================
echo   Environment Setup Complete!
echo ========================================
echo.
echo Environment: dbdesigner-api
echo Python version: 3.12.3
echo.
echo Next steps:
echo 1. Run: setup_and_run.bat
echo 2. Or manually: conda activate dbdesigner-api
echo.
pause