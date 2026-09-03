Write-Host "--------------------------------------------------------" -ForegroundColor Cyan
Write-Host " Building and Running Kali Linux Docker Container" -ForegroundColor Green
Write-Host "--------------------------------------------------------" -ForegroundColor Cyan

# Ensure data directory exists on host
if (-not (Test-Path "data")) {
    New-Item -ItemType Directory -Path "data" | Out-Null
}

# Stop & Remove existing container
wsl -d kali-linux docker rm -f expense-tracker-server 2>$null

# Run container with ports and live source/dist code volume mounts
Write-Host " Launching container with live source and dist mounts..." -ForegroundColor Yellow
wsl -d kali-linux docker run -d --name expense-tracker-server --restart unless-stopped `
  -p 16001:3000 -p 16000:22 `
  -v /mnt/e/projects/expense-tracker/data:/app/data `
  -v /mnt/e/projects/expense-tracker/dist:/app/dist `
  -v /mnt/e/projects/expense-tracker/src:/app/src `
  -v /mnt/e/projects/expense-tracker/public:/app/public `
  -v /mnt/e/projects/expense-tracker/index.html:/app/index.html `
  -v /mnt/e/projects/expense-tracker/vite.config.ts:/app/vite.config.ts `
  -v /mnt/e/projects/expense-tracker/server.ts:/app/server.ts `
  -v /mnt/e/projects/expense-tracker/entrypoint.sh:/app/entrypoint.sh `
  expense-tracker-kali

Write-Host "--------------------------------------------------------" -ForegroundColor Cyan
Write-Host " Docker Container is running successfully!" -ForegroundColor Green
Write-Host " Web App and API: http://localhost:16001" -ForegroundColor Yellow
Write-Host " SSH Access:    ssh kali@localhost -p 16000 (Password: kali)" -ForegroundColor Yellow
Write-Host " SQLite DB:     ./data/budget.sqlite (Persisted in current folder)" -ForegroundColor Yellow
Write-Host "--------------------------------------------------------" -ForegroundColor Cyan
