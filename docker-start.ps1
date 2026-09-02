Write-Host "--------------------------------------------------------" -ForegroundColor Cyan
Write-Host "🐳 Building & Running Kali Linux Docker Container" -ForegroundColor Green
Write-Host "--------------------------------------------------------" -ForegroundColor Cyan

# Ensure data directory exists on host
if (-not (Test-Path "data")) {
    New-Item -ItemType Directory -Path "data" | Out-Null
}

# Restart container with updated ports
wsl -d kali-linux docker rm -f expense-tracker-server 2>$null
wsl -d kali-linux docker run -d --name expense-tracker-server --restart unless-stopped -p 16001:3000 -p 16000:22 -v /mnt/e/projects/expense-tracker/data:/app/data expense-tracker-kali

Write-Host "--------------------------------------------------------" -ForegroundColor Cyan
Write-Host "✅ Docker Container is running successfully!" -ForegroundColor Green
Write-Host "🌐 Web App & API: http://localhost:16001" -ForegroundColor Yellow
Write-Host "🔒 SSH Access:    ssh kali@localhost -p 16000 (Password: kali)" -ForegroundColor Yellow
Write-Host "💾 SQLite DB:     ./data/budget.sqlite (Persisted in current folder)" -ForegroundColor Yellow
Write-Host "--------------------------------------------------------" -ForegroundColor Cyan
