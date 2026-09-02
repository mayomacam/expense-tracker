#!/bin/bash
echo "--------------------------------------------------------"
echo "🐳 Building & Running Kali Linux Docker Container"
echo "--------------------------------------------------------"

# Ensure data directory exists on host
mkdir -p data

# Run container with ports 16001 and 16000
wsl -d kali-linux docker rm -f expense-tracker-server 2>/dev/null || true
wsl -d kali-linux docker run -d --name expense-tracker-server --restart unless-stopped -p 16001:3000 -p 16000:22 -v /mnt/e/projects/expense-tracker/data:/app/data expense-tracker-kali

echo "--------------------------------------------------------"
echo "✅ Docker Container is running successfully!"
echo "🌐 Web App & API: http://localhost:16001"
echo "🔒 SSH Access:    ssh kali@localhost -p 16000 (Password: kali)"
echo "💾 SQLite DB:     ./data/budget.sqlite (Persisted in current folder)"
echo "--------------------------------------------------------"
