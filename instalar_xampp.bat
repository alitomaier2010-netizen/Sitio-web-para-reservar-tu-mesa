@echo off

set SRC_FRONT=%~dp0Frontend
set SRC_SQL=%~dp0base de datos\non_stop.sql
set DEST=C:\xampp\htdocs\non_stop
set MYSQL=C:\xampp\mysql\bin\mysql.exe

echo [1/2] Copiando sitio a %DEST% ...
if not exist "%DEST%" mkdir "%DEST%"
xcopy "%SRC_FRONT%" "%DEST%\" /E /I /Y

echo [2/2] Importando base de datos ...
if not exist "%MYSQL%" (
  echo No se encontro %MYSQL%. ¿Instalaste XAMPP en C:\xampp?
  pause
  exit /b 1
)
if not exist "%SRC_SQL%" (
  echo No se encontro %SRC_SQL%
  pause
  exit /b 1
)
"%MYSQL%" -u root -e "SOURCE %SRC_SQL%"
if errorlevel 1 (
  echo Fallo el import. Probá desde phpMyAdmin: http://localhost/phpmyadmin -^> Importar -^> non_stop.sql
  pause
  exit /b 1
)

echo OK. Abri http://localhost/non_stop/
pause
