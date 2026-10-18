@echo off
set "PATH=C:\Program Files\nodejs\;%PATH%"
cd /d "%~dp0"
echo ==================================================
echo Starting TerraPulse Soil Health Monitoring Platform
echo ==================================================
echo [1/2] Launching FastAPI Backend on http://127.0.0.1:8000 ...
start "TerraPulse Backend (FastAPI)" cmd /k "python backend/run_backend.py"
timeout /t 2 /nobreak >nul
echo [2/2] Launching Vite Frontend on http://localhost:5173 ...
call npm run dev
