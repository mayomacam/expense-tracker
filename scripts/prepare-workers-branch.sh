#!/usr/bin/env bash
set -euo pipefail

# Assembles a clean, self-contained Cloudflare Workers deployment artifact in `.workers-release/`
# suitable for pushing to the `workers-deploy` branch or deploying directly via `wrangler deploy`.

RELEASE_DIR="${1:-.workers-release}"

echo "▶ Building Cloudflare Workers artifact..."
npm run build:workers

rm -rf "$RELEASE_DIR"
mkdir -p "$RELEASE_DIR"

cp -r dist "$RELEASE_DIR/dist"
cp -r worker "$RELEASE_DIR/worker"
cp wrangler.jsonc "$RELEASE_DIR/wrangler.jsonc"
cp package.json "$RELEASE_DIR/package.json"
[ -f package-lock.json ] && cp package-lock.json "$RELEASE_DIR/package-lock.json"
[ -f VERSION.json ] && cp VERSION.json "$RELEASE_DIR/VERSION.json"
[ -f CLOUDFLARE_WORKERS.md ] && cp CLOUDFLARE_WORKERS.md "$RELEASE_DIR/CLOUDFLARE_WORKERS.md"

cat << 'EOF' > "$RELEASE_DIR/.gitignore"
node_modules/
.wrangler/
.dev.vars
.env*
*.sqlite
*.db
EOF

echo "✅ Self-contained Cloudflare Workers branch artifact created at: $RELEASE_DIR"
echo "   Contents:"
ls -la "$RELEASE_DIR"
