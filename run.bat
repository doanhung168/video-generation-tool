@echo off
echo ========================================================
echo    🎬 Starting AI Video Generation & Publishing Tool
echo    Models: Veo 3, Google Flow, Wan 2.1, Seedance, Kimi
echo ========================================================

echo [1/2] Starting Backend (FastAPI on http://localhost:8000)...
start "AI Video Backend" cmd /k "cd /d %~dp0backend && python main.py"

echo [2/2] Starting Frontend (Next.js on http://localhost:3000)...
start "AI Video Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo Both servers are launching!
echo App UI:      http://localhost:3000
echo Backend API: http://localhost:8000/docs
echo ========================================================
pause
