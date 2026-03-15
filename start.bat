@echo off
echo Starting QuizCraft AI via Docker Compose...

:: Start all services defined in docker-compose.yml in detached mode
docker-compose up -d

echo.
echo All services are starting in the background!
echo   Django API ^>  http://localhost:8000
echo   Frontend   ^>  http://localhost:3000
echo.
echo Note: If this is the first run, the frontend build might take a few minutes.
echo To view live logs at any time, run: docker-compose logs -f
echo To stop the application, run:       docker-compose down
echo.
