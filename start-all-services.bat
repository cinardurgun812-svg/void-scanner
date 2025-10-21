@echo off
title Void Scanner Services
echo Starting Void Scanner Services...

:: Backend'i başlat
echo Starting Backend...
start "Backend" cmd /k "cd /d C:\Users\durgu\void-scanner\backend\scanner && node server5005.js"

:: 3 saniye bekle
timeout /t 3 /nobreak >nul

:: Frontend'i başlat
echo Starting Frontend...
start "Frontend" cmd /k "cd /d C:\Users\durgu\void-scanner\frontend && npm start"

:: Admin site'i başlat
echo Starting Admin Site...
start "AdminSite" cmd /k "cd /d C:\Users\durgu\void-scanner\admin-site && npm start"

echo.
echo ✅ Void Scanner Services Started!
echo Backend:   http://localhost:5005
echo Frontend:  http://localhost:3000
echo AdminSite: http://localhost:3001
echo.
echo Press any key to close this window...
pause >nul
