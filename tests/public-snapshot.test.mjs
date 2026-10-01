import assert from 'node:assert/strict';
import test from 'node:test';
import * as fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { allowedRequest, capturePublicVersion, createArchiveDirectory, parseArguments, publicReceiptMetadata } from '../scripts/capture-public-version.mjs';

test('capture command accepts only a public origin and has no historical date or output override', () => {
  assert.equal(parseArguments(['--url', 'https://www.habithalo.app']).origin, 'https://www.habithalo.app');
  assert.equal(parseArguments(['--url', 'http://127.0.0.1:61997']).origin, 'http://127.0.0.1:61997');
  for (const value of ['https://user:password@example.com', 'https://example.com/?email=private', 'https://example.com/#private', 'https://example.com/contact', 'http://example.com', 'file:///tmp/index.html']) {
    assert.throws(() => parseArguments(['--url', value]));
  }
  assert.throws(() => parseArguments(['--url', 'https://example.com', '--date', '2020-01-01']));
  assert.throws(() => parseArguments(['--url', 'https://example.com', '--output', 'public/archive']));
});

test('network capture blocks APIs, submissions, authenticated routes, cross-origin resources and arbitrary queries', () => {
  const origin = 'https://www.habithalo.app';
  assert.equal(allowedRequest(origin, `${origin}/`, 'GET', 'document'), true);
  assert.equal(allowedRequest(origin, `${origin}/how-it-works/`, 'GET', 'document'), true);
  assert.equal(allowedRequest(origin, `${origin}/patents`, 'GET', 'document'), true);
  assert.equal(allowedRequest(origin, `${origin}/halo-site/style.css?v=footer-1`, 'GET', 'stylesheet'), true);
  assert.equal(allowedRequest(origin, `${origin}/_next/static/chunks/page.js`, 'GET', 'script'), true);
  assert.equal(allowedRequest(origin, `${origin}/halo-site/assets/bracelet.webp`, 'GET', 'image'), true);
  assert.equal(allowedRequest(origin, `${origin}/halo-site/assets/stone-module-scene.svg?v=hidden-chapter-1`, 'GET', 'fetch'), true);
  assert.equal(allowedRequest(origin, `${origin}/halo-site/assets/bracelet-year/finale/dark-03.webp`, 'GET', 'fetch'), true);
  for (const [url, method, type] of [
    [`${origin}/api/subscribe`, 'POST', 'fetch'],
    [`${origin}/`, 'POST', 'document'],
    [`${origin}/contact`, 'GET', 'document'],
    [`${origin}/manufacture`, 'GET', 'document'],
    [`${origin}/demo`, 'GET', 'document'],
    [`${origin}/halo-site/secret.json`, 'GET', 'fetch'],
    [`${origin}/halo-site/app.js`, 'GET', 'fetch'],
    [`${origin}/api/asset.webp`, 'GET', 'fetch'],
    [`${origin}/halo-site/style.css?token=private`, 'GET', 'stylesheet'],
    [`${origin}/halo-site/style.css?v=foo%40bar.com`, 'GET', 'stylesheet'],
    ['https://external.example/image.webp', 'GET', 'image'],
    [`${origin}/halo-site/%2fprivate.js`, 'GET', 'script'],
  ]) assert.equal(allowedRequest(origin, url, method, type), false, `${method} ${url}`);
});

test('archive destination rejects symlinks and published roots', async () => {
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'halo-archive-policy-'));
  try {
    const publicDir = path.join(temp, 'public');
    await fs.mkdir(publicDir);
    await assert.rejects(createArchiveDirectory(publicDir), /public or website/);
    await fs.symlink(publicDir, path.join(temp, 'archives'));
    await assert.rejects(createArchiveDirectory(temp), /symlinks/);
  } finally { await fs.rm(temp, { recursive: true, force: true }); }
});

test('receipt keeps only narrow public metadata and distinguishes the reported remote commit', () => {
  const receipt = publicReceiptMetadata({
    schema_version: 1, event: 'production_build', generated_at_utc: '2026-10-01T04:00:00Z',
    source: { commit_sha: 'a'.repeat(40), branch: 'private-branch', working_tree_dirty: true },
    build: { id: 'build-123', application_version: '0.1.0', environment: 'production', secret: 'private' },
    site: { canonical_origin: 'https://www.habithalo.app', deployment_origin: 'https://halo.example' },
    cookies: 'private', environment: { API_KEY: 'private' },
  });
  assert.equal(receipt.source.commit_sha, 'a'.repeat(40));
  assert.equal(receipt.source.working_tree_dirty, true);
  assert.equal(JSON.stringify(receipt).includes('private'), false);
  assert.throws(() => publicReceiptMetadata({ schema_version: 2 }));
});

test('missing browser dependency produces a hashed partial archive without launching a browser', async () => {
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'halo-archive-failure-'));
  const previous = process.env.PLAYWRIGHT_MODULE_PATH;
  process.env.PLAYWRIGHT_MODULE_PATH = path.join(temp, 'intentionally-missing-playwright');
  const before = Date.now();
  try {
    const { directory, manifest } = await capturePublicVersion(new URL('https://www.habithalo.app'), { repositoryRoot: temp });
    assert.equal(manifest.status, 'partial');
    assert.equal(manifest.remote_reported_commit_sha, null);
    assert.equal(manifest.pages.length, 0);
    assert.match(manifest.errors[0].code, /playwright_unavailable/);
    assert.ok(Date.parse(manifest.capture_started_at_utc) >= before);
    assert.ok(Date.parse(manifest.capture_finished_at_utc) <= Date.now());
    const bytes = await fs.readFile(path.join(directory, 'manifest.json'));
    const expected = createHash('sha256').update(bytes).digest('hex');
    assert.equal(await fs.readFile(path.join(directory, 'manifest.sha256'), 'utf8'), `${expected}  manifest.json\n`);
    assert.ok(directory.startsWith(path.join(await fs.realpath(temp), 'archives', 'public-versions') + path.sep));
  } finally {
    if (previous === undefined) delete process.env.PLAYWRIGHT_MODULE_PATH;
    else process.env.PLAYWRIGHT_MODULE_PATH = previous;
    await fs.rm(temp, { recursive: true, force: true });
  }
});
