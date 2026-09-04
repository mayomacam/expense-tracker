# Docker Deployment & Containerization Guide

This document provides complete details on how to build, run, manage, and persist data for the **Expense & Prorated Budget Tracker** Docker container.

---

## 1. Environment & Architecture Overview

- **Base Image**: `node:20-alpine` (Multi-stage build)
- **Container Name**: `expense-tracker-server`
- **Image Tag**: `expense-tracker:latest`
- **Exposed Port (Host -> Container)**: `16001:3000`
- **Healthcheck Endpoint**: `http://localhost:3000/api/db/status`
- **Database Storage Path (Container)**: `/app/data/budget.sqlite`
- **Host Volume Mount Path**:
  - **Linux / WSL**: `-v /mnt/e/projects/expense-tracker/data:/app/data`
  - **Windows PowerShell**: `-v E:\projects\expense-tracker\data:/app/data`
  - **Mac / Linux Bash**: `-v $(pwd)/data:/app/data`

---

## 2. Docker Execution Commands (Quick Reference for AI Agents & Devs)

### A. One-Line Build & Run (WSL / Kali / Ubuntu)
```bash
wsl -d kali-linux docker build -t expense-tracker:latest /mnt/e/projects/expense-tracker ; wsl -d kali-linux docker rm -f expense-tracker-server ; wsl -d kali-linux docker run -d --name expense-tracker-server -p 16001:3000 --restart unless-stopped -v /mnt/e/projects/expense-tracker/data:/app/data expense-tracker:latest
```

### B. PowerShell Commands (Windows Host)
```powershell
docker build -t expense-tracker:latest .
docker rm -f expense-tracker-server
docker run -d --name expense-tracker-server -p 16001:3000 --restart unless-stopped -v E:\projects\expense-tracker\data:/app/data expense-tracker:latest
```

### C. Standard Linux / macOS Bash Commands
```bash
docker build -t expense-tracker:latest .
docker rm -f expense-tracker-server
docker run -d --name expense-tracker-server -p 16001:3000 --restart unless-stopped -v $(pwd)/data:/app/data expense-tracker:latest
```

---

## 3. Persistent Data vs. Code Rebuilds

> [!IMPORTANT]
> **Data Persistence Rule**:
> Because `/app/data` is mounted to the host project folder (`E:\projects\expense-tracker\data\budget.sqlite`), **any database edits (adding transactions, deleting payments, updating budgets) happen directly on the host disk file**. 
> - **Editing Database Data**: Does **NOT** require Docker rebuilds or container restarts.
> - **Updating TypeScript Source Code**: Requires running `npm run build` and executing the `docker build` + `docker run` command above so compiled production files in `/app/dist` update.

---

## 4. Verification & Diagnostic Commands

### Check Health Status via HTTP API:
```powershell
(Invoke-RestMethod -Uri http://localhost:16001/api/db/status) | ConvertTo-Json
```

### Check Container Logs:
```bash
docker logs -f expense-tracker-server
```

### Inspect Container State:
```bash
docker inspect --format='{{json .State.Health}}' expense-tracker-server
```

---

## 5. Security & Isolation Controls

| Security Control | Implementation | Purpose |
| :--- | :--- | :--- |
| **Unprivileged User** | `USER node` (UID 1000) | Prevents container breakout and host root escalation. |
| **Directory Isolation** | `chmod 700 /app/data` | Restricts SQLite file access strictly to runtime node process. |
| **Process Supervision** | `ENTRYPOINT ["/sbin/tini", "--"]` | Forward `SIGTERM`/`SIGINT` signals cleanly to avoid database locks. |
| **Health Probe** | `HEALTHCHECK --interval=30s` | Auto-detects runtime server issues at `/api/db/status`. |
