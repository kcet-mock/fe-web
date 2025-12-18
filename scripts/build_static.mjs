import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const internalDir = path.join(root, 'pages', 'internal');
const tempDir = path.join(root, '__internal_dev_only_pages_internal__');

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

function run(cmd, args, env) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: 'inherit', env });
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} exited with code ${code}`));
    });
  });
}

const env = {
  ...process.env,
  NODE_ENV: 'production',
  NEXT_PUBLIC_INTERNAL_PAGES: 'false',
};

let moved = false;

try {
  if (await exists(tempDir)) {
    // Recover from a previous failed run.
    if (await exists(internalDir)) {
      throw new Error(
        `Both internal dir and temp dir exist; cannot recover safely. internal=${internalDir} temp=${tempDir}`,
      );
    }
    await fs.rename(tempDir, internalDir);
  }

  if (await exists(internalDir)) {
    await fs.rename(internalDir, tempDir);
    moved = true;
  }

  const nextBin = path.join(root, 'node_modules', '.bin', 'next');
  await run(nextBin, ['build'], env);
} finally {
  if (moved) {
    // Next can recreate `pages/internal` during build; ensure restore is always clean.
    await fs.rm(internalDir, { recursive: true, force: true });
    await fs.rename(tempDir, internalDir);
  }
}
