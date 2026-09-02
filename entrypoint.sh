#!/bin/bash
set -e

echo "--------------------------------------------------------"
echo "🚀 Starting Kali Linux Expense Tracker Container Server"
echo "--------------------------------------------------------"

# Ensure SSH host keys are generated
if [ ! -f /etc/ssh/ssh_host_rsa_key ]; then
    echo "🔑 Generating SSH host keys..."
    ssh-keygen -A
fi

# Start OpenSSH Server in background
echo "🔒 Starting OpenSSH Server on port 22..."
/usr/sbin/sshd

echo "✅ SSH Server active. Connect via: ssh kali@localhost -p 16000 (Password: kali)"

# Ensure SQLite data directory exists
mkdir -p /app/data
chmod 777 /app/data

# Export NODE_ENV=development so Vite dev middleware handles live source hot reloading
export NODE_ENV=development
export PORT=3000

echo "⚡ Launching Live Hot-Reload Server (npx tsx server.ts)..."
exec npx tsx server.ts
