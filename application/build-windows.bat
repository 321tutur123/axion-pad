@echo off
REM ═══════════════════════════════════════════════════════════
REM  Axion Pad Configurator — Script de build Windows
REM  Génère : axionpad-1.0.0.exe (installateur Windows)
REM  Pré-requis : Java 17+, Maven 3.6+
REM ═══════════════════════════════════════════════════════════

echo.
echo  ╔══════════════════════════════════════╗
echo  ║   Axion Pad Configurator — Build     ║
echo  ╚══════════════════════════════════════╝
echo.

REM Vérification Java 17+
java -version 2>&1 | findstr /r /c:"version .1[7-9]" /c:"version .[2-9][0-9]" >nul
IF ERRORLEVEL 1 (
    echo [ERREUR] Java 17 ou superieur est requis.
    echo Telecharge Java 17 sur : https://adoptium.net/
    pause
    exit /b 1
)

REM Vérification Maven
mvn -version >nul 2>&1
IF ERRORLEVEL 1 (
    echo [ERREUR] Maven n'est pas installe ou pas dans le PATH.
    echo Telecharge Maven sur : https://maven.apache.org/download.cgi
    pause
    exit /b 1
)

echo [1/3] Compilation et packaging Maven...
call mvn clean package -q
IF ERRORLEVEL 1 (
    echo [ERREUR] La compilation a echoue. Verifie les erreurs ci-dessus.
    pause
    exit /b 1
)

echo [2/3] Creation de l'installateur Windows avec jpackage...
jpackage ^
    --input target ^
    --name "Axion Pad Configurator" ^
    --main-jar axionpad-1.0.0.jar ^
    --main-class com.axionpad.Main ^
    --type exe ^
    --dest dist/windows ^
    --app-version 1.0.0 ^
    --vendor "Axion Pad" ^
    --description "Configurateur officiel pour le clavier Axion Pad" ^
    --win-shortcut ^
    --win-menu ^
    --win-dir-chooser ^
    --icon src/main/resources/com/axionpad/icons/axionpad.ico ^
    --java-options "--add-modules javafx.controls,javafx.fxml,javafx.graphics"

IF ERRORLEVEL 1 (
    echo [INFO] jpackage non disponible, creation d'un JAR executable a la place...
    IF NOT EXIST dist\windows mkdir dist\windows
    copy target\axionpad-1.0.0.jar dist\windows\AxionPadConfigurator.jar
    echo @echo off > dist\windows\launch.bat
    echo java -jar "%%~dp0AxionPadConfigurator.jar" >> dist\windows\launch.bat
    echo [OK] JAR cree dans dist/windows/
    goto done
)

echo [3/3] Nettoyage...

:done
echo.
echo  ════════════════════════════════════════
echo   Build termine !
echo   Fichiers dans : dist/windows/
echo  ════════════════════════════════════════
echo.
pause
