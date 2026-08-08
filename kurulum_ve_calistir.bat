@echo off
title PulCarpet CRM - Kurulum ve Calistirma Sihirbazi

echo ===================================================
echo   PulCarpet CRM - Otomatik Kurulum Scripti (Windows)
echo ===================================================
echo.

node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [HATA] Node.js bilgisayarinizda kurulu degil!
    echo Lutfen https://nodejs.org adresinden Node.js (LTS surumu) indirip kurun.
    echo.
    pause
    exit /b
)

echo [1/3] Ortam degiskenleri (.env) kontrol ediliyor...
if not exist .env (
    if exist .env.example (
        copy .env.example .env > nul
        echo [BILGI] .env dosyasi .env.example'dan olusturuldu.
    ) else (
        echo GEMINI_API_KEY=your_gemini_api_key > .env
    )
)

echo.
echo [2/3] Bagimliliklar yukleniyor (npm install)...
call npm install

echo.
echo [3/3] Uygulama baslatiliyor (npm run dev)...
echo Tarayiciniz otomatik olarak http://localhost:3000 adresini acacak.
echo.

start http://localhost:3000
call npm run dev

pause
