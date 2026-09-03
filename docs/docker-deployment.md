# Docker Deployment & Containerization Guide

This document details the container architecture, security hardening standards, and deployment options for the **Expense & Prorated Budget Tracker**.

---

## 1. Container Architecture

The application uses a **multi-stage build** based on `node:20-alpine` to maintain a minimal container size, eliminate build toolchain vulnerabilities, and run as an unprivileged user.

```
┌─────────────────────────────────────────────────────────────┐
│             Stage 1: builder (node:20-alpine)               │
│  1. Installs all npm dependencies (including dev tools)     │
│  2. Compiles TypeScript + Vite production bundle (/dist)     │
│  3. Discards compiler artifacts and source files            │
└──────────────────────────────┬──────────────────────────────┘
                               │ Copies compiled /dist
                               ▼
┌─────────────────────────────────────────────────────────────┐
│             Stage 2: runner (node:20-alpine)                │
│  1. Installs minimal runtime dependencies (--only=prod)     │
│  2. Flags --ignore-scripts (Prevents malicious hooks)        │
│  3. Adds tini for PID 1 signal forwarding & zombie reaping   │
│  4. Creates /app/data with strict 0700 permissions          │
│  5. Switches to unprivileged user 'node' (UID 1000)         │
│  6. Configures HEALTHCHECK probe against /api/db/status     │
│  7. Launches application server on port 3000                │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Security Hardening Controls

| Security Control | Implementation | Threat Mitigated |
| :--- | :--- | :--- |
| **Least Privilege Execution** | `USER node` (UID `1000`) | Prevents container breakout and unauthorized host escalation. |
| **Filesystem Isolation** | `chmod 700 /app/data` | Restricts SQLite database file read/write access strictly to the runtime process. |
| **Signal Handling & Zombie Reaping** | `ENTRYPOINT ["/sbin/tini", "--"]` | Ensures clean handling of `SIGTERM` and `SIGINT` signals, preventing database corruption during shutdown and reaping orphaned child processes. |
| **Supply-Chain Defense** | `npm ci --only=production --ignore-scripts` | Blocks third-party npm lifecycle scripts from executing during container builds. |
| **Minimal Attack Surface** | `node:20-alpine` base image | Strips extraneous OS packages, compilers, and utilities containing potential CVEs. |
| **Context Filtering** | `.dockerignore` | Prevents secrets, `.env` files, git metadata, and local development logs from leaking into the container layers. |
| **Active Health Probing** | `HEALTHCHECK --interval=30s` | Enables container orchestrators to detect locked processes or unhandled server exceptions. |

---

## 3. Running with Docker CLI

### 3.1 Build the Image
```bash
docker build -t expense-prorated-tracker:latest .
```

### 3.2 Run Container with Persistent Storage
To ensure that your SQLite database persists across container updates, mount the `/app/data` volume to your host machine:

```bash
docker run -d \
  --name expense-tracker \
  --restart unless-stopped \
  -p 3000:3000 \
  -v $(pwd)/data:/app/data \
  expense-prorated-tracker:latest
```

### 3.3 Verify Container Health
```bash
docker inspect --format='{{json .State.Health}}' expense-tracker
```
Or check application logs:
```bash
docker logs -f expense-tracker
```

---

## 4. Docker Compose Deployment

Create a `docker-compose.yml` file in your deployment environment:

```yaml
version: '3.8'

services:
  budget-app:
    build:
      context: .
      dockerfile: Dockerfile
    image: expense-prorated-tracker:latest
    container_name: expense_prorated_tracker
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
    volumes:
      - sqlite_data:/app/data
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000/api/db/status"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 15s

volumes:
  sqlite_data:
    driver: local
```

### Launch Services:
```bash
docker compose up -d
```

---

## 5. Cloud Run / Cloud Container Deployment

When deploying to Google Cloud Run or Kubernetes:
1. **Container Port**: Bind to port `3000`. Cloud Run routes ingress automatically to the container's designated port.
2. **Persistent Volumes**: For multi-replica deployments, attach a Cloud Storage volume or Cloud SQL / Persistent Disk mount at `/app/data` to retain the SQLite file.
3. **Graceful Shutdown**: The server handles `SIGTERM` passed via `tini`, giving the Node.js process up to 10 seconds to flush all in-memory database pages to disk before container teardown.
