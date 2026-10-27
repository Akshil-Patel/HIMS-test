Write-Host "Starting LIPMS Integrated Services..." -ForegroundColor Cyan

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd server; npm run dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd client; npm run dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'Doctor Portal'; npm run dev"

Write-Host "`nAll 3 services are launching in separate windows:" -ForegroundColor Green
Write-Host "  1. Backend API:     http://localhost:5000" -ForegroundColor Yellow
Write-Host "  2. Billing Module:  http://localhost:3000" -ForegroundColor Yellow
Write-Host "  3. Doctor Portal:   http://localhost:3001" -ForegroundColor Yellow
