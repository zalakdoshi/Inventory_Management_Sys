@echo off
set NODE_SKIP_PLATFORM_CHECK=1
title Inventory Management System — Local Server

echo.
echo ============================================
echo   Inventory Management System
echo   On-Premise Local Server (SQLite Edition)
echo ============================================
echo.

:: ── Install dependencies if node_modules missing ──────────────
echo [Step 1] Checking dependencies...
if not exist "server\node_modules\" (
    echo  Installing server packages (first time only)...
    cd server
    call npm install --silent
    cd ..
)
if not exist "client\node_modules\" (
    echo  Installing client packages (first time only)...
    cd client
    call npm install --silent
    cd ..
)
echo  Dependencies ready.

:: ── Start Backend ─────────────────────────────────────────────
echo.
echo [Step 2] Starting Backend on http://localhost:5000 ...
start "Backend - API Server" cmd /k "cd /d %~dp0server && node server.js"
timeout /t 3 /nobreak > nul

:: ── Start Frontend ────────────────────────────────────────────
echo [Step 3] Starting Frontend on http://localhost:5173 ...
start "Frontend - React App" cmd /k "cd /d %~dp0client && npm run dev"
timeout /t 4 /nobreak > nul

:: ── Open Browser ──────────────────────────────────────────────
echo.
echo Opening app in browser...
start http://localhost:5173

echo.
echo ============================================
echo   App is RUNNING!
echo.
echo   Frontend : http://localhost:5173
echo   Backend  : http://localhost:5000
echo   Database : SQLite (server/database.db)
echo.
echo   Close the terminal windows to stop.
echo ============================================
echo.
pause
