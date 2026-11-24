@echo off
REM Envia el analisis del codigo a SonarQube Cloud (o a un SonarQube local) sin Docker.
REM Requiere Node.js (usa npx sonarqube-scanner) y un token generado en SonarQube.
cd /d %~dp0
set HOST=https://sonarcloud.io
set /p HOST=URL del servidor [Enter = https://sonarcloud.io, local = http://localhost:9000]: 
set /p TOKEN=Pega tu token de SonarQube: 
set ORG=
if /i "%HOST%"=="https://sonarcloud.io" set /p ORG=Organization key de SonarCloud (la ves arriba a la izquierda en sonarcloud.io): 
set /p KEY=Project key [Enter = emociones-saas]: 
if "%KEY%"=="" set KEY=emociones-saas

echo == Cobertura del backend (opcional: requiere Xdebug o PCOV; si no, se omite) ==
cd backend
call php artisan test --coverage-clover=coverage.xml
cd ..

echo == Analisis ==
if "%ORG%"=="" (
  call npx --yes sonarqube-scanner -Dsonar.host.url=%HOST% -Dsonar.token=%TOKEN% -Dsonar.projectKey=%KEY%
) else (
  call npx --yes sonarqube-scanner -Dsonar.host.url=%HOST% -Dsonar.token=%TOKEN% -Dsonar.projectKey=%KEY% -Dsonar.organization=%ORG%
)
echo.
echo Abre el proyecto en %HOST% para ver el Quality Gate y las metricas.
pause
