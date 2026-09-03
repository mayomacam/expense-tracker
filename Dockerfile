# ==============================================================================
# Security-Hardened Multi-Stage Dockerfile
#
# Key Security Practices Implemented:
# 1. Minimal Attack Surface: Uses official node:20-alpine base image (fewer CVEs)
# 2. Multi-Stage Build: Isolates build toolchains & dev dependencies from runtime
# 3. Principle of Least Privilege: Drops root privileges and runs as 'node' (UID 1000)
# 4. Strict File Permissions: Secure ownership and 0700 access on data directories
# 5. Process & Signal Management: Uses tini for PID 1 signal forwarding & zombie reaping
# 6. Supply Chain Hardening: Uses --ignore-scripts during production dependency install
# 7. Production Environment: NODE_ENV=production avoids debug leaks and boosts perf
# 8. Liveness Monitoring: Built-in HEALTHCHECK probe for orchestrator health monitoring
# ==============================================================================

# --- Stage 1: Build Application Assets ---
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package manifests first for optimal layer caching
COPY package*.json ./

# Install all dependencies (including devDependencies required for bundling)
RUN npm ci

# Copy build configuration and source code
COPY tsconfig.json vite.config.ts index.html ./
COPY src/ ./src/
COPY public/ ./public/

# Compile frontend static bundle into /app/dist
RUN npm run build

# --- Stage 2: Hardened Production Runtime ---
FROM node:20-alpine AS runner

# Explicitly set production environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Install tini (init process for PID 1 signal handling) without caching package lists
RUN apk add --no-cache tini

# Create dedicated application directory
WORKDIR /app

# Copy package files for minimal production installation
COPY package*.json ./

# Install production dependencies only with script execution blocked for supply chain safety
RUN npm ci --only=production --ignore-scripts && \
    npm cache clean --force

# Copy pre-compiled frontend assets with unprivileged ownership
COPY --from=builder --chown=node:node /app/dist ./dist

# Copy application server code with unprivileged ownership
COPY --chown=node:node server.ts ./
COPY --chown=node:node src/server/ ./src/server/
COPY --chown=node:node src/data/ ./src/data/
COPY --chown=node:node src/utils/ ./src/utils/
COPY --chown=node:node src/types.ts ./src/types.ts

# Create SQLite database directory with restricted 0700 permissions owned by non-root 'node'
RUN mkdir -p /app/data && \
    chown -R node:node /app && \
    chmod 700 /app/data

# Switch to the non-root user provided by node:alpine
USER node

# Expose single application port
EXPOSE 3000

# Active healthcheck probe to monitor container responsiveness
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/db/status || exit 1

# Handle POSIX termination signals (SIGTERM, SIGINT) and child zombie reaping safely
ENTRYPOINT ["/sbin/tini", "--"]

# Start the application server using tsx
CMD ["npx", "tsx", "server.ts"]
