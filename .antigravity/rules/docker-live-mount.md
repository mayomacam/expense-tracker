# 🚨 CRITICAL RULE: DO NOT REBUILD DOCKER IMAGES ON CODE UPDATES

## Rule Statement
Never run `docker build` or `docker compose build` when updating source code, UI components, or server logic in this repository.

## Why This Rule Exists
1. **Disk Space Optimization**: Building new image tags creates duplicate layer bloat on the host machine.
2. **Performance & Speed**: Live volume mounts (`./src:/app/src`, `./server.ts:/app/server.ts`) provide instant hot-reloading without waiting 20-30 seconds for image builds.

## How to Apply Code Changes
- Edit the source files directly on the host (`src/`, `server.ts`, `public/`).
- The running container automatically hot-reloads through volume mounts `-v ./src:/app/src`.
- If container restart is required, run `docker restart expense-tracker-server` (DO NOT rebuild!).
- Use `docker image prune -af` to keep disk usage clean.
