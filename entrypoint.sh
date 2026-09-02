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

# Start application server
echo "⚡ Launching Expense Tracker Node.js Server on port ${PORT:-3000}..."
if [ -f /app/dist/server.cjs ]; then
    exec node /app/dist/server.cjs
else
    exec npm run dev
fi
