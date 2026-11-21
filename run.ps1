Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "   🎬 AI Video Generation & Social Publishing Studio" -ForegroundColor Green
Write-Host "   Models: Veo 3, Google Flow, Wan 2.1, Seedance, Kimi" -ForegroundColor Yellow
Write-Host "========================================================" -ForegroundColor Cyan

$root = $PSScriptRoot

Write-Host "`n[1/2] Starting Backend (FastAPI on http://localhost:8000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root\backend'; python main.py"

Write-Host "[2/2] Starting Frontend (Next.js on http://localhost:3000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root\frontend'; npm run dev"

Write-Host "`nServers launched in separate windows!" -ForegroundColor Green
Write-Host "Web Interface: http://localhost:3000" -ForegroundColor Cyan
Write-Host "Backend Docs:  http://localhost:8000/docs" -ForegroundColor Cyan
