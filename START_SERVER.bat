@echo off
echo ================================================
echo KINGPIN DYNASTY - MULTIPLAYER SERVER STARTER
echo ================================================
echo.

:: Change to the correct directory
cd /d "c:\Users\jenna\OneDrive\Desktop\Portfolio projects\FromDuskToDon"

:: Check if we're in the right place
if not exist "server.js" (
    echo ERROR: server.js not found!
    echo Current directory: %CD%
    pause
    exit /b 1
)

echo Current directory: %CD%
echo.

:: List some key files
echo Key files found:
if exist "server.js" echo ✓ server.js
if exist "index.html" echo ✓ index.html
if exist "multiplayer.js" echo ✓ multiplayer.js
if exist "gamelogo.png" echo ✓ gamelogo.png
echo.

:: Check Node.js
echo Checking Node.js...
node --version
if %errorlevel% neq 0 (
    echo ERROR: Node.js not found!
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

echo.
echo Starting server on port 8080...
echo ⚠️ Keep this window open!
echo ⚠️ Your ngrok should forward to: http://localhost:8080
echo.

:: Start the server
node server.js

pause
