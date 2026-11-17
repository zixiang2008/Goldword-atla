@echo off
REM Windows wrapper: run the asset fetch script from Git Bash.
where bash >nul 2>nul
if %errorlevel% equ 0 (
  bash "%~dp0fetch-atlas-assets.sh" %*
  exit /b %errorlevel%
)
echo Git Bash was not found on PATH.
echo Install Git for Windows, or run this from Git Bash:
echo   bash scripts/fetch-atlas-assets.sh
exit /b 1
