# Levanta el sistema en Windows con PowerShell (sin Docker).
# Uso:  powershell -ExecutionPolicy Bypass -File .\INICIAR.ps1
$raiz = $PSScriptRoot

# 1) Backend Laravel (API en http://localhost:8000)
Set-Location "$raiz\backend"
if (-not (Test-Path vendor)) { composer install }
if (-not (Test-Path .env)) { Copy-Item .env.example .env; php artisan key:generate }
if (-not (Test-Path database\database.sqlite)) {
    New-Item database\database.sqlite -ItemType File | Out-Null
    php artisan migrate --seed --force
}
Start-Process powershell -ArgumentList '-NoExit', '-Command', "Set-Location '$raiz\backend'; php artisan serve --port=8000"

# 2) Servicio de IA en Python (http://localhost:8001). Es opcional: sin el, el sistema usa la version en PHP.
Set-Location "$raiz\ia-service"
if (-not (Test-Path .venv)) {
    python -m venv .venv
    .\.venv\Scripts\python.exe -m pip install -r requirements.txt
}
Start-Process powershell -ArgumentList '-NoExit', '-Command', "Set-Location '$raiz\ia-service'; .\.venv\Scripts\python.exe -m uvicorn app.main:app --port 8001"

# 3) Frontend React (http://localhost:3000)
Set-Location "$raiz\frontend"
if (-not (Test-Path node_modules)) { npm.cmd install }
Start-Process powershell -ArgumentList '-NoExit', '-Command', "Set-Location '$raiz\frontend'; npm.cmd run dev"

Start-Sleep -Seconds 6
Start-Process 'http://localhost:3000'
Set-Location $raiz
