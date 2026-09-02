# Base Image: Official Kali Linux Rolling Release
FROM kalilinux/kali-rolling:latest

# Environment Configuration
ENV DEBIAN_FRONTEND=noninteractive
ENV NODE_ENV=production
ENV PORT=3000

# Install system dependencies, OpenSSH server, Node.js, npm, curl, and build tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssh-server \
    curl \
    wget \
    git \
    sudo \
    ca-certificates \
    build-essential \
    python3 \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Configure SSH Server
RUN mkdir -p /var/run/sshd \
    && useradd -rm -d /home/kali -s /bin/bash -g root -G sudo -u 1000 kali \
    && echo 'kali:kali' | chpasswd \
    && echo 'root:kali' | chpasswd \
    && sed -i 's/#PermitRootLogin prohibit-password/PermitRootLogin yes/' /etc/ssh/sshd_config \
    && sed -i 's/#PasswordAuthentication yes/PasswordAuthentication yes/' /etc/ssh/sshd_config \
    && ssh-keygen -A

# Set working directory inside container
WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install npm dependencies
RUN npm ci --only=production || npm install

# Copy application source code
COPY . .

# Build application bundle
RUN npx vite build && npx esbuild server.ts --bundle --platform=node --format=cjs --packages=external --outfile=dist/server.cjs || npm run build

# Make entrypoint script executable
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Create data directory for host-bound SQLite persistence
RUN mkdir -p /app/data && chown -R kali:root /app/data

# Expose Web Application (3000) and OpenSSH Server (22)
EXPOSE 3000 22

# Entrypoint script starts sshd and application server
ENTRYPOINT ["/entrypoint.sh"]
