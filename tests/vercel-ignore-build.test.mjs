import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync, renameSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const script = fileURLToPath(new URL('../scripts/vercel-ignore-build.mjs', import.meta.url));
function fixture(t) {
  const root = mkdtempSync(path.join(os.tmpdir(), 'halo-ignore-build-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  git('init', '--quiet');
  git('config', 'user.name', 'Build guard test');
  git('config', 'user.email', 'build-guard@example.invalid');
  const write = (name, value = '{}\n') => {
    mkdirSync(path.dirname(path.join(root, name)), { recursive: true });
    writeFileSync(path.join(root, name), value);
  };
  const commit = () => { git('add', '.'); git('commit', '--quiet', '-m', 'Test fixture'); return git('rev-parse', 'HEAD'); };
  write('website/index.html', '<main>Halo</main>');
  const previous = commit();
  const decision = (overrides = {}) => {
    const result = spawnSync(process.execPath, [script], { cwd: root, encoding: 'utf8', env: {
      ...process.env, VERCEL_GIT_PREVIOUS_SHA: previous, VERCEL_GIT_COMMIT_SHA: git('rev-parse', 'HEAD'), ...overrides,
    } });
    assert.equal(result.error, undefined);
    assert.equal(result.signal, null);
    return result.status;
  };
  return { root, git, write, commit, previous, decision };
}

test('Vercel skips an archival-only commit using its 0 exit code', t => {
  const f = fixture(t);
  f.write('provenance/releases/actual-capture.json'); f.commit();
  assert.equal(f.decision(), 0);
});

test('a real source change followed by an archival commit still builds', t => {
  const f = fixture(t);
  f.write('website/index.html', '<main>Updated Halo</main>'); f.commit();
  assert.equal(f.decision(), 1);
  f.write('provenance/releases/actual-capture.json'); f.commit();
  assert.equal(f.decision(), 1, 'Compare against the previous deployment, not the parent commit');
});

test('concept manifests, other provenance files and renamed source files build', t => {
  const f = fixture(t);
  f.write('provenance/product-concepts.json'); f.commit();
  assert.equal(f.decision(), 1);
  const previous = f.git('rev-parse', 'HEAD');
  f.write('provenance/releases/README.md'); f.commit();
  assert.equal(f.decision({ VERCEL_GIT_PREVIOUS_SHA: previous }), 1);
  const beforeRename = f.git('rev-parse', 'HEAD');
  renameSync(path.join(f.root, 'website/index.html'), path.join(f.root, 'provenance/releases/moved-source.json'));
  f.commit();
  assert.equal(f.decision({ VERCEL_GIT_PREVIOUS_SHA: beforeRename }), 1);
});

test('missing, malformed, unavailable or mismatched history always builds', t => {
  const f = fixture(t);
  f.write('provenance/releases/actual-capture.json'); f.commit();
  for (const overrides of [
    { VERCEL_GIT_PREVIOUS_SHA: '' },
    { VERCEL_GIT_PREVIOUS_SHA: 'HEAD^' },
    { VERCEL_GIT_PREVIOUS_SHA: '0'.repeat(40) },
    { VERCEL_GIT_COMMIT_SHA: f.previous },
    { VERCEL_GIT_COMMIT_SHA: '' },
  ]) assert.equal(f.decision(overrides), 1);
});

test('a redeploy or dirty source checkout builds', t => {
  const f = fixture(t);
  assert.equal(f.decision(), 1, 'No change must not suppress an intentional redeploy');
  f.write('provenance/releases/actual-capture.json'); f.commit();
  f.write('website/index.html', '<main>Uncommitted source</main>');
  assert.equal(f.decision(), 1);
});

test('unrelated history and a checkout without Git build', t => {
  const f = fixture(t);
  f.git('checkout', '--orphan', 'unrelated'); f.git('rm', '-rf', '.');
  f.write('provenance/releases/actual-capture.json'); f.commit();
  assert.equal(f.decision(), 1);
  rmSync(path.join(f.root, '.git'), { recursive: true });
  const result = spawnSync(process.execPath, [script], { cwd: f.root, env: {
    ...process.env, VERCEL_GIT_PREVIOUS_SHA: f.previous, VERCEL_GIT_COMMIT_SHA: f.previous,
  } });
  assert.equal(result.status, 1);
});
