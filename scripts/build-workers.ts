import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

function run(cmd: string) {
  console.log(`\n▶ ${cmd}`);
  execSync(cmd, { stdio: 'inherit' });
}

function main() {
  const rootDir = process.cwd();
  const distDir = path.join(rootDir, 'dist');
  const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf-8'));

  // 1. Typecheck Frontend + Worker separately
  run('npx tsc --noEmit');
  run('npx tsc -p worker/tsconfig.json --noEmit');

  // 2. Build React SPA frontend into dist/
  run('npx vite build');

  // 3. Ensure Edge _headers exists in dist/
  const publicHeaders = path.join(rootDir, 'public', '_headers');
  const distHeaders = path.join(distDir, '_headers');
  if (fs.existsSync(publicHeaders) && !fs.existsSync(distHeaders)) {
    fs.copyFileSync(publicHeaders, distHeaders);
  }

  // 4. Stamp VERSION.json for artifact tracking
  let commit = 'local';
  try {
    commit = execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
  } catch {
    // Not inside a git repo
  }

  const versionMeta = {
    name: pkg.name,
    version: process.env.WORKER_VERSION || pkg.version || '1.0.0',
    tag: `workers-v${process.env.WORKER_VERSION || pkg.version || '1.0.0'}`,
    commit,
    builtAt: new Date().toISOString(),
    runtime: 'cloudflare-workers-d1',
  };
  fs.writeFileSync(path.join(distDir, 'VERSION.json'), JSON.stringify(versionMeta, null, 2));
  fs.writeFileSync(path.join(rootDir, 'VERSION.json'), JSON.stringify(versionMeta, null, 2));

  // 5. Dry-run bundle Worker with Wrangler to verify compatibility & exact gzipped size
  const checkOutDir = path.join(rootDir, '.wrangler', 'dist-check');
  fs.rmSync(checkOutDir, { recursive: true, force: true });
  run(`npx wrangler deploy --dry-run --outdir "${checkOutDir}"`);

  const bundleFile = fs
    .readdirSync(checkOutDir)
    .find((f) => f.endsWith('.js') || f.endsWith('.mjs'));
  if (bundleFile) {
    const rawBytes = fs.readFileSync(path.join(checkOutDir, bundleFile));
    const gzBytes = zlib.gzipSync(rawBytes);
    console.log(
      `\n✅ Worker Bundle Verified: ${bundleFile} -> ${(rawBytes.length / 1024).toFixed(2)} KiB uncompressed / ${(gzBytes.length / 1024).toFixed(2)} KiB gzipped`
    );
  }

  fs.rmSync(checkOutDir, { recursive: true, force: true });
  console.log('\n🎉 Cloudflare Workers build & verification completed cleanly!');
}

main();
