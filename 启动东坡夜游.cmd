@echo off
setlocal
cd /d "%~dp0"

start "Dongpo Night Walk" /min cmd /c "npm run dev -- --host 127.0.0.1 --port 5173"
timeout /t 3 /nobreak >nul
start "" "http://127.0.0.1:5173/"

endlocal
