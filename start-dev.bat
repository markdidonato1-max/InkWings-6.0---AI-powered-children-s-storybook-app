@echo off
echo Starting InkWings dev server...
echo This window will stay open while the server runs.
echo.
echo Once you see "Ready" below, open your browser to:
echo   http://localhost:3000
echo.
echo Press Ctrl+C then Y to stop the server.
echo.

set "PATH=%PATH%;C:\Users\markd\AppData\Local\Programs\kimi-desktop\resources\resources\runtime"

cd /d "C:\Users\markd\Documents\kimi\workspace"
npm run dev

pause
