@echo off
setlocal EnableDelayedExpansion
cd /d "%~dp0.."

echo ===================================================
echo  Axion Pad Configurator - Build Windows
echo ===================================================

:: ── 1. Fat JAR ──────────────────────────────────────
echo.
echo [1/2] Compilation Maven...
call mvn clean package -q
if %ERRORLEVEL% neq 0 (
    echo ERREUR : mvn package a echoue.
    pause & exit /b 1
)
echo     OK ^> target\axionpad-1.0.0.jar

:: ── 2. jpackage ─────────────────────────────────────
echo.
echo [2/2] Creation du package Windows...
if not exist dist\windows mkdir dist\windows

:: Supprimer un build precedent s'il existe
if exist dist\windows\AxionPadConfigurator (
    rmdir /s /q dist\windows\AxionPadConfigurator
)

set ICON_OPT=
if exist src\main\resources\com\axionpad\icons\axionpad.ico (
    set ICON_OPT=--icon src\main\resources\com\axionpad\icons\axionpad.ico
)

:: app-image = dossier portable autonome (JRE inclus, aucun prerequis)
:: Pour un vrai installateur .exe : remplacer --type app-image par --type exe
::   (necessite WiX Toolset 3.x installe sur le PC de build)
jpackage ^
  --type app-image ^
  --name "AxionPadConfigurator" ^
  --app-version 1.0.0 ^
  --input target ^
  --main-jar axionpad-1.0.0.jar ^
  --main-class com.axionpad.Main ^
  --dest dist\windows ^
  --java-options "-Dos.arch=amd64" ^
  --java-options "--add-opens=java.base/java.lang=ALL-UNNAMED" ^
  %ICON_OPT%

if %ERRORLEVEL% neq 0 (
    echo.
    echo ERREUR : jpackage a echoue.
    echo Verifiez que JDK 17+ est dans le PATH : jpackage --version
    pause & exit /b 1
)

:: ── 3. Zip ──────────────────────────────────────────
echo.
echo Compression en ZIP...
if exist dist\windows\AxionPadConfigurator-1.0.0-windows.zip (
    del /q dist\windows\AxionPadConfigurator-1.0.0-windows.zip
)
powershell -NoProfile -Command ^
  "Compress-Archive -Path 'dist\windows\AxionPadConfigurator' -DestinationPath 'dist\windows\AxionPadConfigurator-1.0.0-windows.zip' -Force"

echo.
echo ===================================================
echo  Termine !
echo.
echo  Dossier portable : dist\windows\AxionPadConfigurator\
echo  Archive ZIP      : dist\windows\AxionPadConfigurator-1.0.0-windows.zip
echo.
echo  Pour lancer : AxionPadConfigurator\AxionPadConfigurator.exe
echo  (aucune installation de Java requise)
echo ===================================================
pause
