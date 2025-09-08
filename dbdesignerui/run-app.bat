@echo on
echo DB Designer App starting...
echo.

if not exist "node_modules" (
    echo Installing Node modules...
    npm install
    echo.
)

echo Starting development server...
echo Please open http://localhost:3000 in your browser.
echo Press Ctrl+C to stop the server.
echo.

npm run dev

echo.
echo Server stopped.
pause