# Expense Tracker (Production Release)

This branch contains the pre-compiled, self-contained production bundle (Node.js + Express backend + pre-built frontend SPA + SQLite).

## How to Run on Any Node.js Host or VPS

1. **Install production dependencies**:
   ```bash
   npm install --omit=dev
   ```

2. **Start the application**:
   ```bash
   npm start
   ```
   - The server listens on `PORT` (or default `3000`).
   - It automatically serves the pre-compiled frontend from `/dist`.
   - SQLite database is persisted under `./data/budget.sqlite`.

## How to Run with Docker

```bash
docker compose up -d
```
