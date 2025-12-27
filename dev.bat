@echo off
cls
echo ========================================
echo   Wakala EMS - تشغيل بيئة التطوير
echo ========================================
echo.

echo [1/4] إيقاف العمليات القديمة...
taskkill /F /IM node.exe 2>nul
timeout /t 1 /nobreak >nul

echo [2/4] مسح Vite cache (الجذر)...
if exist node_modules\.vite (
    rmdir /s /q node_modules\.vite
    echo    ✓ تم مسح node_modules\.vite
) else (
    echo    - لا يوجد node_modules\.vite
)

echo [3/4] مسح Vite cache (العميل)...
if exist client\node_modules\.vite (
    rmdir /s /q client\node_modules\.vite
    echo    ✓ تم مسح client\node_modules\.vite
) else (
    echo    - لا يوجد client\node_modules\.vite
)

echo [4/4] بدء الخوادم...
echo ========================================
echo.
npm run start-all

pause