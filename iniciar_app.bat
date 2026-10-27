@echo off
title ExcelQR Express Web
echo ====================================================
echo       Iniciando ExcelQR Express Web (v6.4.2)
echo ====================================================
echo.
echo URL: http://localhost:5055/
echo Presiona Ctrl+C en esta ventana para detener el servidor.
echo.
cd /d "%~dp0"
python app.py
pause
