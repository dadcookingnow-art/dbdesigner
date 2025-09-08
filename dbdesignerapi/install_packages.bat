@echo off
echo ========================================
echo   Install Requirements in Active Environment
echo ========================================

echo.
echo Current conda environment:
conda info --envs | findstr "*"

echo.
echo Current Python location:
where python

echo.
echo Installing requirements.txt...
pip install -r requirements.txt

echo.
echo Verifying installation:
pip list | findstr fastapi
pip list | findstr uvicorn
pip list | findstr sqlalchemy

echo.
echo Installation complete!
pause