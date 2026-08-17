@echo off
title PulCarpet CRM - GitHub Otomatik Yukleme Sihirbazi

echo ===================================================
echo   PulCarpet CRM - GitHub Otomatik Yukleme Scripti
echo ===================================================
echo.

git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [HATA] Git bilgisayarinizda kurulu degil!
    echo Lutfen https://git-scm.com adresinden Git indirip kurun.
    pause
    exit /b
)

echo GitHub reponuzun URL adresini yapistirin:
echo Ornek: https://github.com/pulcarpet/pulcarpet-crm.git
echo.
set /p REPO_URL="GitHub Repo URL: "

if "%REPO_URL%"=="" (
    echo [HATA] Gecerli bir URL girmediniz!
    pause
    exit /b
)

echo.
echo [1/5] Eski Git kimlik bilgileri ve gecmis temizleniyor...
cmdkey /delete:LegacyGeneric:target=git:https://github.com >nul 2>&1
git credential-manager reject host=https://github.com >nul 2>&1

if exist .git (
    rmdir /s /q .git >nul 2>&1
)
git init

echo.
echo [2/5] Dosyalar hazirlaniyor ve ekleniyor...
if exist bun.lock del /f /q bun.lock >nul 2>&1
if exist bun.lockb del /f /q bun.lockb >nul 2>&1

git add .

echo.
echo [3/5] Ilk commit olusturuluyor...
git config user.name "pulcarpet"
git config user.email "export@pulcarpet.com"
git commit -m "Initial commit - PulCarpet CRM"

echo.
echo [4/5] 'main' dali olusturuluyor ve remote ekleniyor...
git branch -M main
git remote add origin %REPO_URL%

echo.
echo [5/5] GitHub'a yukleniyor (Giris penceresi acilacak)...
git push -u origin main --force

if %errorlevel% equ 0 (
    echo.
    echo ===================================================
    echo   [BASARILI] Kodlariniz GitHub'a yuklendi!
    echo   Simdi Vercel'e gidip bu depoyu baglayabilirsiniz.
    echo ===================================================
) else (
    echo.
    echo ===================================================
    echo   [HATA] Push islemi basarisiz oldu!
    echo.
    echo Nedenleri ve Cozumleri:
    echo 1. Windows'ta kayitli eski GitHub hesabiniz (qadhr12-wq) kalmis olabilir.
    echo 2. Kimlik Yöneticisi'nden (Credential Manager) GitHub kaydini silip tekrar deneyin.
    echo ===================================================
)

echo.
pause
