@echo off
title Subir ExcelQR Express Web a GitHub
echo ====================================================
echo      Subiendo ExcelQR Express Web a GitHub
echo ====================================================
echo.
cd /d "%~dp0"

echo [1/3] Comprobando estado de Git...
git status

echo.
echo [2/3] Preparando y confirmando cambios...
git add .
git commit -m "Update ExcelQR Express Web"

echo.
echo [3/3] Subiendo cambios a GitHub...
git push origin main

echo.
echo ====================================================
echo    Listo! Presiona cualquier tecla para cerrar.
echo ====================================================
pause
