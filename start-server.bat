@echo off
echo ========================================
echo  KINGPIN DYNASTY - MULTIPLAYER SETUP
echo ========================================
echo.

echo Step 1: Installing Node.js dependencies...
npm install
if %errorlevel% neq 0 (
    echo Error: Failed to install dependencies. Make sure Node.js is installed.
    echo Download from: https://nodejs.org
    pause
    exit /b 1
)
echo ✅ Dependencies installed successfully!
echo.

echo Step 2: Starting the multiplayer server...
echo Server will run on http://localhost:8080
echo.
echo ⚠️  IMPORTANT: Keep this window open while testing multiplayer!
echo.
echo To test with friends:
echo 1. Run this script to start the server
echo 2. Install and run ngrok to expose your server online
echo 3. Share the ngrok URL with your friends
echo.
echo Starting server in 3 seconds...
timeout /t 3 > nul
echo.

npm start
