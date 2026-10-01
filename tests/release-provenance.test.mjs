import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { renderNotice, renderPatents } from '../scripts/ip-notice.mjs';
import { recordBuild, collectDeployment, sourceMetadata, origin, hashFile } from '../scripts/release-provenance.mjs';

test('patent states are explicit; no claim or link is enabled by default', () => {
  const config = { schema_version: 1, PATENT_STATUS: 'none', patents: [] };
  assert.equal(renderNotice(config), '© 2026 Halo. All rights reserved.');
  assert.equal(renderPatents(config), '<p>Halo patent information will be published here as appropriate.</p>');
  assert.equal(renderNotice({ ...config, PATENT_STATUS: 'pending' }), '© 2026 Halo. All rights reserved. Patent pending.');
  assert.equal(renderNotice({ ...config, PATENT_STATUS: 'issued' }), '© 2026 Halo. All rights reserved. <a href="/patents">Patents</a>');
  assert.throws(() => renderNotice({ ...config, PATENT_STATUS: 'patented' }));
  assert.throws(() => renderPatents({ ...config, patents: [{ application_number: 'not-approved' }] }), /unapproved/);
});

test('approved future entries escape markup and must agree with patent status', () => {
  const patent = { approved_for_publication: true, product_or_technology: '<Halo>', status: 'issued', patent_number: '123', jurisdiction: 'Example', description: '<script>bad()</script>' };
  assert.throws(() => renderPatents({ schema_version: 1, PATENT_STATUS: 'pending', patents: [patent] }), /conflicts/);
  const html = renderPatents({ schema_version: 1, PATENT_STATUS: 'issued', patents: [patent] });
  assert.match(html, /&lt;Halo&gt;/);
  assert.doesNotMatch(html, /<script>/);
});

test('metadata is allowlisted and missing Git stays unknown', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'halo-metadata-'));
  try {
    const source = sourceMetadata(root, { API_KEY: 'secret-sentinel', VERCEL_OIDC_TOKEN: 'secret-token' });
    assert.equal(source.commit_sha, null);
    assert.equal(source.branch, null);
    assert.equal(source.working_tree_dirty, null);
    assert.doesNotMatch(JSON.stringify(source), /secret/);
    for (const value of ['https://user:pass@example.com', 'https://example.com?secret=1', 'http://example.com', 'https://example.com/path']) assert.throws(() => origin(value));
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('records use real capture time, hash exact bytes, remain append-only, and omit private paths', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'halo-receipt-'));
  const write = async (relative, data) => { const file = path.join(root, relative); await mkdir(path.dirname(file), { recursive: true }); await writeFile(file, data); };
  try {
    await write('package.json', JSON.stringify({ version: '0.1.0' }));
    await write('provenance/product-concepts.json', JSON.stringify({ schema_version: 1, concepts: [] }));
    for (const file of ['index.html', 'how-it-works/index.html', 'patents/index.html']) await write(`public/halo-site/${file}`, '<title>Halo</title>');
    await write('public/halo-site/assets/bracelet.webp', 'public-image-bytes');
    await write('public/halo-site/original/style.css', ':root{font-family:Aeonik}');
    await write('public/halo-site/assets/private-notes.md', 'secret-sentinel');
    await write('public/halo-site/manufacture/private.html', 'secret-sentinel');
    await write('private.png', 'secret-sentinel');
    await symlink(path.join(root, 'private.png'), path.join(root, 'public/halo-site/assets/symlink.png'));
    const before = Date.now();
    const env = { HALO_SOURCE_COMMIT: 'a'.repeat(40), HALO_SOURCE_BRANCH: 'private-feature-name', HALO_SOURCE_DIRTY: 'true', API_KEY: 'secret-sentinel' };
    const first = await recordBuild(root, env);
    assert.ok(Date.parse(first.record.generated_at_utc) >= before);
    assert.equal(first.record.publication.verified, false);
    assert.equal(first.record.source.branch, 'private-feature-name');
    assert.equal(first.record.source.working_tree_dirty, true);
    assert.ok(first.record.artifacts.some(item => item.path === '/halo-site/original/style.css'));
    assert.equal(first.record.product_imagery.manifest.assets[0].path, '/halo-site/assets/bracelet.webp');
    const publicReceipt = await readFile(path.join(root, 'public/halo-site/release-provenance.json'), 'utf8');
    assert.doesNotMatch(publicReceipt, /private-feature-name|secret-sentinel|\/Users\/|\/tmp\//);
    const manifest = await readFile(path.join(root, 'public/halo-site/product-imagery-manifest.json'), 'utf8');
    assert.doesNotMatch(manifest, /symlink|private-notes/);
    const oldHash = await hashFile(path.join(root, 'public/halo-site/index.html'));
    await write('public/halo-site/index.html', '<title>Changed</title>');
    assert.notEqual((await hashFile(path.join(root, 'public/halo-site/index.html'))).sha256, oldHash.sha256);
    const second = await recordBuild(root, env);
    assert.notEqual(first.target, second.target);
    assert.deepEqual(JSON.parse(await readFile(first.target, 'utf8')), first.record);
    // The collector verifies HTTP bytes and cannot mark a mismatched release as published.
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => new Response(publicReceipt, { status: 200 });
    try { await assert.rejects(collectDeployment(root, 'https://example.com'), /differs/); }
    finally { globalThis.fetch = originalFetch; }
    globalThis.fetch = async url => {
      let relative = new URL(url).pathname;
      relative = ({ '/': '/halo-site/index.html', '/how-it-works': '/halo-site/how-it-works/index.html', '/patents': '/halo-site/patents/index.html' })[relative] || relative;
      return new Response(await readFile(path.join(root, 'public', relative)), { status: 200 });
    };
    try {
      await assert.rejects(collectDeployment(root, 'https://example.com', second.record.source, 'https://wrong-deployment.vercel.app'), /expected deployment/);
      const collected = await collectDeployment(root, 'https://example.com', second.record.source);
      assert.equal(collected.record.publication.verified, true);
      assert.equal(collected.record.source.branch, 'private-feature-name');
      assert.deepEqual(collected.record.product_imagery.manifest, second.record.product_imagery.manifest);
    } finally { globalThis.fetch = originalFetch; }
  } finally { await rm(root, { recursive: true, force: true }); }
});
