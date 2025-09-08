@echo off
echo Starting DB Designer Unified API...

echo.
echo Checking conda environment...
conda info --envs | findstr dbdesigner-api >nul
if %ERRORLEVEL% neq 0 (
    echo Conda environment 'dbdesigner-api' not found!
    echo Please run 'create_conda_env.bat' first to create the environment.
    pause
    exit /b 1
)

echo ========================================
echo   DB Designer Unified API Starting!
echo ========================================
echo.
echo Server will start on: http://localhost:8000
echo.
echo Available Services and Endpoints:
echo.
echo [MAIN API]
echo   Documentation: http://localhost:8000/docs
echo   Health Check:  http://localhost:8000/health
echo   Root Info:     http://localhost:8000/
echo.
echo [USER SERVICE] 
echo   Documentation: http://localhost:8000/api/user/docs
echo   Register:      POST /api/user/auth/register
echo   Login:         POST /api/user/auth/login  
echo   Verify Email:  POST /api/user/auth/verify
echo   Get Profile:   GET  /api/user/auth/me
echo   Reset Request: POST /api/user/auth/password-reset/request
echo   Reset Confirm: POST /api/user/auth/password-reset/confirm
echo.
echo [PROJECT SERVICE]
echo   Documentation: http://localhost:8000/api/project/docs
echo   List Projects: GET  /api/project/projects
echo   Create Project:POST /api/project/projects
echo   Get Project:   GET  /api/project/projects/{id}
echo   Delete Project:DEL  /api/project/projects/{id}
echo.
echo [SCHEMA SERVICE]
echo   Documentation: http://localhost:8000/api/schema/docs
echo   Get Tables:    GET  /api/schema/projects/{id}/tables
echo   Create Table:  POST /api/schema/projects/{id}/tables
echo   Get Relations: GET  /api/schema/projects/{id}/relationships
echo   Create Relation: POST /api/schema/projects/{id}/relationships
echo.
echo [AI SERVICE]
echo   Documentation: http://localhost:8000/api/ai/docs
echo   Chat for DB:   POST /api/ai/chat
echo.
echo Environment: dbdesigner-api (Anaconda)
echo.

set PYTHONPATH=%CD%
call conda activate dbdesigner-api
echo Starting server... (Press Ctrl+C to stop)
echo.
python gateway\main.py