@echo off
chcp 65001 > nul
echo ========================================================
echo    ĐANG ĐÓNG GÓI ỨNG DỤNG ANDROID (MY CARD - LOCAL)
echo ========================================================

cd /d "%~dp0web"
echo [1/3] Đang build gói giao diện web...
call npm run build
if %errorlevel% neq 0 (
    echo [LỖI] Build web thất bại!
    pause
    exit /b %errorlevel%
)

echo [2/3] Đang đồng bộ tài nguyên vào Android (Capacitor Sync)...
call npx cap sync android
if %errorlevel% neq 0 (
    echo [LỖI] Sync Capacitor thất bại!
    pause
    exit /b %errorlevel%
)

echo [3/3] Đang biên dịch Android APK...
cd /d "%~dp0web\android"
java "-Dfile.encoding=UTF-8" -jar ".\gradle\wrapper\gradle-wrapper.jar" assembleDebug
if %errorlevel% neq 0 (
    echo [LỖI] Biên dịch APK thất bại!
    pause
    exit /b %errorlevel%
)

copy /y "app\build\outputs\apk\debug\app-debug.apk" "%~dp0MyCard.apk" > nul

echo ========================================================
echo    ĐÓNG GÓI THÀNH CÔNG!
echo    File cài đặt APK nằm tại:
echo    %~dp0MyCard.apk
echo ========================================================
pause
