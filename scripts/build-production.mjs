import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { recordBuild } from './release-provenance.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
for (const args of [['scripts/build-halo-site.mjs'], ['node_modules/next/dist/bin/next', 'build']]) {
  const result = spawnSync(process.execPath, args, { cwd: root, stdio: 'inherit', env: process.env });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
}
if (!process.env.VERCEL_ENV || process.env.VERCEL_ENV === 'production') {
  const { target } = await recordBuild(root);
  console.log(`Production build provenance: ${path.relative(root, target)}`);
}
