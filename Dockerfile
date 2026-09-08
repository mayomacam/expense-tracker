# ==============================================================================
# Security-Hardened Multi-Stage Dockerfile for Expense & Prorated Budget Tracker
# ==============================================================================

# --- Stage 1: Build Frontend Assets ---
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package manifests and install build dependencies
COPY package*.json ./
RUN npm install

# Copy source code and build configs
COPY tsconfig.json vite.config.ts index.html ./
COPY src/ ./src/
COPY public/ ./public/
COPY server.ts ./

# Compile frontend production bundle into /app/dist
RUN npm run build

# --- Stage 2: Production Hardened Runtime ---
FROM node:20-alpine AS runner

ENV NODE_ENV=production
ENV PORT=3000

# Install tini for PID 1 signal forwarding & process handling
RUN apk add --no-cache tini

WORKDIR /app

# Install runtime dependencies
COPY package*.json ./
RUN npm install --ignore-scripts && npm cache clean --force

# Copy pre-compiled frontend assets and backend server source
COPY --from=builder --chown=node:node /app/dist ./dist
COPY --from=builder --chown=node:node /app/server.ts ./
COPY --from=builder --chown=node:node /app/src/ ./src/
COPY --from=builder --chown=node:node /app/index.html ./

# Create data directory for SQLite persistence with restricted permissions
RUN mkdir -p /app/data && \
    chown -R node:node /app && \
    chmod 700 /app/data

# Switch to unprivileged 'node' user
USER node

EXPOSE 3000

# Health check probe
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/db/status || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["npx", "tsx", "server.ts"]
