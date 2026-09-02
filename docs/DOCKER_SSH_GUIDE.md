# 🐳 Docker & OpenSSH Server Deployment Guide (Kali Linux Base)

This guide explains how to build, run, and SSH into the **Kali Linux Docker Container** running the Expense Tracker application, with persistent SQLite database storage mapped directly to your current host folder (`./data`).

---

## 🏗️ Architecture & Overview

```
┌─────────────────────────────────────────────────────────────┐
│                       Host System                           │
│                                                             │
│   Web Browser                  Terminal / SSH Client        │
│   http://localhost:16001       ssh kali@localhost -p 16000  │
│         │                               │                   │
└─────────┼───────────────────────────────┼───────────────────┘
          │ Port 16001                    │ Port 16000
┌─────────▼───────────────────────────────▼───────────────────┐
│              Docker Container (Kali Linux)                  │
│                                                             │
│   ┌──────────────────────┐    ┌─────────────────────────┐   │
│   │ Express App & API    │    │ OpenSSH Server (sshd)   │   │
│   │ (Port 3000)          │    │ (Port 22)               │   │
│   └──────────┬───────────┘    └─────────────────────────┘   │
│              │                                              │
│              │ SQLite Read / Write                          │
│   ┌──────────▼───────────┐                                  │
│   │ /app/data            │                                  │
│   └──────────┬───────────┘                                  │
└──────────────┼──────────────────────────────────────────────┘
               │ Host Volume Mount (./data:/app/data)
┌──────────────▼──────────────────────────────────────────────┐
│  Host Filesystem: ./data/budget.sqlite (Current Folder)     │
└─────────────────────────────────────────────────────────────┘
```

---

## ⚡ Zero-Rebuild Hot Reloading & Disk Optimization

> **Do I need to rebuild the Docker image for every code update?**  
> **NO! You do NOT need to rebuild the Docker container for code changes.** Rebuilding every time wastes disk space and CPU cycles.

### How Live Code Mounts Work:
By mounting your local folders directly into the running container:

```yaml
volumes:
  - ./data:/app/data            # SQLite Database
  - ./src:/app/src              # React Frontend Source Code
  - ./public:/app/public        # Public Assets
  - ./server.ts:/app/server.ts  # Express Server
```

- Any file edit you save in your editor (VS Code, Antigravity, etc.) **instantly reflects inside the container**.
- Node.js / Vite hot-reloads the changes in real-time.
- The Docker image is built **once**, and reused indefinitely.

### Reclaiming Disk Space:
If you previously ran multiple image builds, clean up dangling layers and reclaim disk space:

```bash
# Remove unused dangling build images
wsl -d kali-linux docker image prune -f

# Complete cleanup of unused containers, networks, and build caches
wsl -d kali-linux docker system prune -f
```

---

## 🚀 Quick Start Instructions

### Method 1: Using WSL Kali Linux Docker (Recommended)

1. Open PowerShell or terminal in your project directory `E:\projects\expense-tracker`.
2. Run the container with live code mounts and port mappings `16001:3000` (Web App) and `16000:22` (SSH):
   ```bash
   wsl -d kali-linux docker run -d --name expense-tracker-server --restart unless-stopped -p 16001:3000 -p 16000:22 -v /mnt/e/projects/expense-tracker/data:/app/data -v /mnt/e/projects/expense-tracker/src:/app/src -v /mnt/e/projects/expense-tracker/server.ts:/app/server.ts expense-tracker-kali
   ```

### Method 2: Using Helper Script

Run:
```powershell
.\docker-start.ps1
```

---

## 🔒 SSH Access into Container

The container runs an OpenSSH server on container port `22`, mapped to host port `16000`.

### SSH Connection Credentials:
- **Host**: `localhost`
- **Port**: `16000`
- **Username**: `kali` (or `root`)
- **Password**: `kali`

### Command to SSH into Container:
```bash
ssh kali@localhost -p 16000
```
*When prompted for password, enter `kali`.*

To SSH as root:
```bash
ssh root@localhost -p 16000
```

---

## 💾 Current Folder SQLite Persistence

All database operations execute against `/app/data/budget.sqlite` inside the container. Because of the volume mapping:

```yaml
volumes:
  - ./data:/app/data
```

- Any transaction logged in the web app or API is written directly to **`./data/budget.sqlite` on your host machine**.
- Restarting or deleting the container will **NEVER lose your data**.
- You can inspect, back up, or copy `./data/budget.sqlite` anytime directly from your Windows / Linux host.

---

## 🛠️ Management Commands

| Action | Command |
| :--- | :--- |
| **Run Container (Live Sync)** | `wsl -d kali-linux docker run -d --name expense-tracker-server -p 16001:3000 -p 16000:22 -v /mnt/e/projects/expense-tracker/data:/app/data -v /mnt/e/projects/expense-tracker/src:/app/src expense-tracker-kali` |
| **Stop Container** | `wsl -d kali-linux docker stop expense-tracker-server` |
| **Remove Container** | `wsl -d kali-linux docker rm -f expense-tracker-server` |
| **View Live Logs** | `wsl -d kali-linux docker logs -f expense-tracker-server` |
| **Prune Old Images (Free Space)** | `wsl -d kali-linux docker image prune -f` |
| **SSH into Container** | `ssh kali@localhost -p 16000` |
| **Check SQLite Database** | `ls -la ./data/budget.sqlite` |

---

## 🧪 Testing Web Application & API

- **Web Application UI**: [http://localhost:16001](http://localhost:16001)
- **Database Status API**: [http://localhost:16001/api/db/status](http://localhost:16001/api/db/status)
- **Transactions API**: [http://localhost:16001/api/transactions](http://localhost:16001/api/transactions)
