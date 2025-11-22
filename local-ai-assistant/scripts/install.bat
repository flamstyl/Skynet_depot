@echo off
REM Script d'installation automatique pour Windows

echo ============================================================
echo   Installation de l'Assistant IA Personnel Local
echo ============================================================
echo.

REM Vérifier Python
echo Verification de Python...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERREUR] Python 3 n'est pas installe
    echo Installez Python 3.11+ depuis https://www.python.org/
    pause
    exit /b 1
)
echo [OK] Python trouve

REM Vérifier Node.js
echo Verification de Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERREUR] Node.js n'est pas installe
    echo Installez Node.js 18+ depuis https://nodejs.org/
    pause
    exit /b 1
)
echo [OK] Node.js trouve

REM Installer les dépendances du backend
echo.
echo Installation des dependances du backend...
cd backend

REM Créer un environnement virtuel
if not exist "venv\" (
    echo Creation de l'environnement virtuel...
    python -m venv venv
)

REM Activer l'environnement
call venv\Scripts\activate.bat

REM Installer les dépendances
echo Installation des packages Python...
pip install --upgrade pip >nul
pip install -r requirements.txt >nul

echo [OK] Backend installe

REM Configurer l'environnement
if not exist ".env" (
    echo.
    echo Configuration de l'environnement...
    copy .env.example .env >nul
    echo [OK] Fichier .env cree
    echo [ATTENTION] N'oubliez pas d'ajouter vos cles API dans backend\.env
)

cd ..

REM Installer les dépendances du frontend
echo.
echo Installation des dependances du frontend...
cd frontend

call npm install >nul

echo [OK] Frontend installe

REM Copier .env si nécessaire
if not exist ".env" (
    copy .env.example .env >nul
)

cd ..

echo.
echo ============================================================
echo [OK] Installation terminee avec succes !
echo ============================================================
echo.
echo Prochaines etapes :
echo.
echo 1. Configurez vos cles API dans backend\.env
echo    Editez le fichier et ajoutez votre cle OpenAI/Anthropic
echo.
echo 2. Demarrez le backend :
echo    cd backend ^&^& venv\Scripts\activate ^&^& python main.py
echo.
echo 3. Dans un autre terminal, demarrez le frontend :
echo    cd frontend ^&^& npm run dev
echo.
echo 4. Ouvrez http://localhost:5173 dans votre navigateur
echo.
echo 5. Installez l'extension Chrome :
echo    - Allez sur chrome://extensions/
echo    - Activez le mode developpeur
echo    - Chargez le dossier 'extension/'
echo.
echo Documentation : README.md
echo Demarrage rapide : QUICKSTART.md
echo.
pause
