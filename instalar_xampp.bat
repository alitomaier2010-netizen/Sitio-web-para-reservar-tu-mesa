@echo off
setlocal

set SRC_FRONT=%~dp0Frontend
set SRC_SQL=%~dp0base de datos\non_stop.sql
set DEST=C:\xampp\htdocs\non_stop
set MYSQL=C:\xampp\mysql\bin\mysql.exe

echo [0/3] Revisando configuracion ...
if not exist "%SRC_FRONT%\api\config.local.php" (
  echo Falta Frontend\api\config.local.php
  echo Copia Frontend\api\config.example.php como config.local.php y completa
  echo la contrasena de MySQL y la clave admin antes de instalar.
  pause
  exit /b 1
)

echo [1/3] Copiando sitio a %DEST% ...
if not exist "%DEST%" mkdir "%DEST%"
xcopy "%SRC_FRONT%" "%DEST%\" /E /I /Y

echo [2/3] Importando base de datos ...
if not exist "%MYSQL%" (
  echo No se encontro %MYSQL%. Instalaste XAMPP en C:\xampp?
  pause
  exit /b 1
)
if not exist "%SRC_SQL%" (
  echo No se encontro %SRC_SQL%
  pause
  exit /b 1
)
echo Te va a pedir la contrasena del usuario root de MySQL.
"%MYSQL%" -u root -p --default-character-set=utf8mb4 < "%SRC_SQL%"
if errorlevel 1 (
  echo Fallo el import. Proba desde phpMyAdmin: http://localhost/phpmyadmin -^> Importar -^> non_stop.sql
  pause
  exit /b 1
)

echo [3/3] Listo.
echo Abri http://localhost/non_stop/
pause
