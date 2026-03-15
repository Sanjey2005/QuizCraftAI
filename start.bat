@echo off
echo Starting QuizCraft AI...

:: Django backend
start "Django" cmd /k "cd /d %~dp0backend && python manage.py runserver"

:: Celery worker (needed for AI quiz generation)
start "Celery" cmd /k "cd /d %~dp0backend && celery -A config worker --loglevel=info"

:: Next.js frontend
start "Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo All services starting:
echo   Django   ^>  http://localhost:8000
echo   Frontend ^>  http://localhost:3000
echo.
