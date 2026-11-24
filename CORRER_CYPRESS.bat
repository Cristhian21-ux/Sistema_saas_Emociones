@echo off
REM Ejecuta las pruebas E2E de Cypress sobre la aplicación real (Windows).
REM ATENCION: reinicia la base de datos de demostración (migrate:fresh --seed).
cd /d %~dp0
echo == 1) Base de datos de demostracion ==
cd backend
php artisan migrate:fresh --seed --force
start "API Laravel" cmd /k php artisan serve --port=8000
cd ..\frontend
echo == 2) Dependencias del frontend (incluye Cypress) ==
if not exist node_modules\cypress call npm install
start "Frontend Vite" cmd /k npm run dev
echo Esperando a que el sistema levante...
timeout /t 10 >nul
echo == 3) Pruebas Cypress ==
call npx cypress run
echo.
echo Capturas de cada escenario en: frontend\cypress\screenshots
pause
