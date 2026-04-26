@echo off
SETLOCAL EnableDelayedExpansion
cd /d "%~dp0"

SET "JFX_VERSION=21.0.2"
SET "M2=%USERPROFILE%\.m2\repository\org\openjfx"

echo Step 1 - Maven build
call mvn clean package -Pjpackage -DskipTests
if %ERRORLEVEL% neq 0 (
    echo ERROR: Maven build failed
    pause
    exit /b 1
)

if not exist "target\axionpad-2.0.0.jar" (
    echo ERROR: target\axionpad-2.0.0.jar not found
    pause
    exit /b 1
)
if not exist "target\lib" (
    echo ERROR: target\lib not found
    pause
    exit /b 1
)

echo Step 2 - Copy main JAR into target\lib
copy /y "target\axionpad-2.0.0.jar" "target\lib\axionpad-2.0.0.jar" >nul

echo Step 3 - Build JavaFX module directory
if exist "target\javafx-mods" rmdir /s /q "target\javafx-mods"
mkdir "target\javafx-mods"
for %%N in (javafx-base javafx-graphics javafx-controls javafx-fxml) do (
    copy /y "%M2%\%%N\%JFX_VERSION%\%%N-%JFX_VERSION%-win.jar" "target\javafx-mods\" >nul
    if !ERRORLEVEL! neq 0 (
        echo ERROR: %%N win JAR not in Maven cache
        echo Run: mvn dependency:resolve -Dclassifier=win
        pause
        exit /b 1
    )
)
echo JavaFX module directory ready

echo Step 4 - Build custom JRE with jlink
if exist "target\custom-jre" rmdir /s /q "target\custom-jre"
jlink ^
 --module-path "target\javafx-mods" ^
 --add-modules javafx.controls,javafx.fxml,javafx.graphics,javafx.base,java.desktop,java.datatransfer,java.prefs,java.logging,java.xml,java.scripting,jdk.unsupported ^
 --output "target\custom-jre" ^
 --strip-debug ^
 --no-man-pages ^
 --no-header-files
if %ERRORLEVEL% neq 0 (
    echo ERROR: jlink failed
    pause
    exit /b 1
)

echo Step 5 - Extract JavaFX native DLLs from win JARs into runtime\bin
if exist "target\dll-extract" rmdir /s /q "target\dll-extract"
mkdir "target\dll-extract"
for %%N in (javafx-base javafx-graphics javafx-controls javafx-fxml) do (
    mkdir "target\dll-extract\%%N" 2>nul
    pushd "target\dll-extract\%%N"
    jar xf "%M2%\%%N\%JFX_VERSION%\%%N-%JFX_VERSION%-win.jar"
    popd
    for %%D in ("target\dll-extract\%%N\*.dll") do (
        copy /y "%%D" "target\custom-jre\bin\" >nul
    )
)
if not exist "target\custom-jre\bin\glass.dll" (
    echo ERROR: glass.dll not found in runtime\bin after extraction
    pause
    exit /b 1
)
echo glass.dll and prism DLLs confirmed in runtime\bin

echo Step 6 - jpackage
if not exist "dist" mkdir "dist"
jpackage ^
 --type msi ^
 --name AxionPad ^
 --app-version 2.0.0 ^
 --dest dist ^
 --runtime-image target\custom-jre ^
 --input target\lib ^
 --main-jar axionpad-2.0.0.jar ^
 --main-class com.axionpad.Main ^
 --icon icon.ico ^
 --win-upgrade-uuid 7f33663a-8664-4e2a-b733-4f9687e0259b ^
 --java-options "-Dprism.order=sw" ^
 --win-menu ^
 --win-shortcut

if %ERRORLEVEL% neq 0 (
    echo ERROR: jpackage failed
    echo Make sure WiX Toolset is installed: winget install WixToolset.WiXToolset
) else (
    echo SUCCESS: dist\AxionPad-2.0.0.msi is ready
)

pause

