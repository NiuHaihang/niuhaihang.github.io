#!/usr/bin/env node
/**
 * Build the pages site: the math app at / and the English app at /english/.
 *
 * Mirrors what .github/workflows/deploy.yml does, so a local `pnpm build:site`
 * is a faithful preview of the deployed thing (service-worker scopes included).
 *
 *   pnpm build:site && pnpm exec vite preview --outDir site
 */
import { execFileSync } from 'node:child_process';
import { cpSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const site = join(root, 'site');
const base = process.env.VITE_BASE ?? '/';

const run = (cmd, args, env = {}) =>
  execFileSync(cmd, args, { cwd: root, stdio: 'inherit', env: { ...process.env, ...env } });

rmSync(site, { recursive: true, force: true });
mkdirSync(site, { recursive: true });

run('pnpm', ['--filter', '@bunny/math', 'build'], { VITE_BASE: base });
cpSync(join(root, 'apps/math/dist'), site, { recursive: true });
console.log(`math   → ${base}`);

if (existsSync(join(root, 'apps/english/package.json'))) {
  run('pnpm', ['--filter', '@bunny/english', 'build'], { VITE_BASE: `${base}english/` });
  mkdirSync(join(site, 'english'), { recursive: true });
  cpSync(join(root, 'apps/english/dist'), join(site, 'english'), { recursive: true });
  console.log(`english → ${base}english/`);
}

console.log(`\nsite ready in ${site}`);
