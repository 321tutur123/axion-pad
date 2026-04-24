@echo off
REM Redirects to the main build script in the parent directory.
REM Pass "debug" to enable console window: scripts\build-windows.bat debug
cd /d "%~dp0.."
call build-windows.bat %*
