@echo off
REM 🟣 MCP_LM_Terminal - Script de lancement rapide (Windows)

echo 🟣 MCP_LM_Terminal - Demarrage...
echo ==================================

REM Vérification de l'environnement virtuel
if not exist "venv\" (
    echo ⚠️  Environnement virtuel non trouve
    echo 📦 Creation de l'environnement virtuel...
    python -m venv venv

    echo 📥 Installation des dependances...
    call venv\Scripts\activate.bat
    pip install -r requirements.txt
) else (
    echo ✅ Environnement virtuel trouve
    call venv\Scripts\activate.bat
)

REM Vérification du fichier de configuration
if not exist "config.json" (
    echo ❌ Fichier config.json introuvable !
    pause
    exit /b 1
)

REM Vérification du token (basique sur Windows)
findstr /C:"CHANGEZ_MOI_IMMEDIATEMENT" config.json >nul
if %errorlevel% equ 0 (
    echo ❌ ERREUR : Vous devez changer le api_token dans config.json !
    echo 💡 Generez un token avec : python -c "import secrets; print(secrets.token_urlsafe(32))"
    pause
    exit /b 1
)

findstr /C:"A_CHANGER" config.json >nul
if %errorlevel% equ 0 (
    echo ❌ ERREUR : Vous devez changer le api_token dans config.json !
    echo 💡 Generez un token avec : python -c "import secrets; print(secrets.token_urlsafe(32))"
    pause
    exit /b 1
)

echo ✅ Configuration validee
echo.
echo 🚀 Lancement du serveur MCP...
echo.

REM Lancement du serveur
uvicorn server:app --host 0.0.0.0 --port 8080 --reload

pause
