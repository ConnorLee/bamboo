import { spawn } from 'node:child_process';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { collectDeployment, sourceMetadata } from './release-provenance.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const collectOnly = args[0] === '--collect';
if ((collectOnly && args.length !== 2) || (!collectOnly && args.length !== 0)) throw new Error('Usage: node scripts/deploy-production.mjs [--collect https://public-deployment-origin]');
// A failed post-deploy fetch must not lose the location of the deployment to collect.
const recovery = path.join(root, 'archives/deployment-recovery.json');
const context = sourceMetadata(root);
let deploymentOrigin = args[1];
if (!collectOnly) {
  if (!context.commit_sha || !context.branch) throw new Error('Production deployment requires a Git commit and branch.');
  const command = process.env.VERCEL_CLI || 'vercel';
  const flags = ['--prod', '--yes', '--build-env', `HALO_SOURCE_COMMIT=${context.commit_sha}`, '--build-env', `HALO_SOURCE_BRANCH=${context.branch}`, '--build-env', `HALO_SOURCE_DIRTY=${context.working_tree_dirty}`];
  let stdout = '';
  await new Promise((resolve, reject) => {
    const child = spawn(command, flags, { cwd: root, env: process.env, stdio: ['ignore', 'pipe', 'inherit'] });
    child.stdout.on('data', chunk => { stdout += chunk; process.stdout.write(chunk); });
    child.on('error', reject);
    child.on('close', code => code === 0 ? resolve() : reject(new Error(`Vercel exited with ${code}; no successful deployment record was created.`)));
  });
  deploymentOrigin = stdout.match(/https:\/\/[a-zA-Z0-9.-]+\.vercel\.app/g)?.at(-1);
  if (!deploymentOrigin) throw new Error('Vercel completed without a deployment URL. Run --collect with its verified public origin.');
  await mkdir(path.dirname(recovery), { recursive: true });
  await writeFile(recovery, JSON.stringify({ generated_at_utc: new Date().toISOString(), deployment_origin: deploymentOrigin, source: context }, null, 2) + '\n', { mode: 0o600 });
}
// Collection-only never guesses that the current local branch built a remote release.
const { target } = await collectDeployment(root, deploymentOrigin, collectOnly ? null : context);
if (!collectOnly) await rm(recovery, { force: true });
console.log(`Verified release record: ${path.relative(root, target)}`);
console.log('Commit this new provenance/releases record to retain it in repository history. Do not redeploy solely for that archival commit.');
