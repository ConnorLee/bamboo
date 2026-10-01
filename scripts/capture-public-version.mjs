#!/usr/bin/env node
// Intentional, local-only public capture. Never called by builds or deployment.
import { createHash, randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import * as fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const PAGE_PATHS = new Set(['/', '/how-it-works', '/how-it-works/', '/patents', '/patents/']);
const ASSET_ROOTS = ['/halo-site/', '/_next/static/', '/halo-i/', '/social/', '/assets/'];
const ASSET_EXTENSIONS = /\.(?:css|js|mjs|png|jpe?g|webp|avif|svg|gif|ico|woff2?|ttf|otf)$/i;
const IMAGE_EXTENSIONS = /\.(?:png|jpe?g|webp|avif|svg|gif|ico)$/i;
const RESOURCE_TYPES = new Set(['stylesheet', 'script', 'image', 'font']);
const MAX_ASSET_BYTES = 12 * 1024 * 1024;
const MAX_TOTAL_ASSET_BYTES = 100 * 1024 * 1024;
const MAX_ASSETS = 1200;
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');

export function parseArguments(args) {
  if (args.length !== 2 || args[0] !== '--url') throw new Error('Usage: node scripts/capture-public-version.mjs --url https://www.habithalo.app');
  const url = new URL(args[1]);
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  if (url.username || url.password || args[1].includes('?') || args[1].includes('#') || url.pathname !== '/' || (url.protocol !== 'https:' && !(local && url.protocol === 'http:'))) {
    throw new Error('Use a public HTTPS origin with no credentials, path, query, or fragment. HTTP is allowed only for a local preview.');
  }
  return url;
}

export function allowedRequest(origin, rawUrl, method, resourceType) {
  try {
    const url = new URL(rawUrl);
    if (url.origin !== origin || url.username || url.password || url.hash || method !== 'GET') return false;
    // Refuse encoded paths and arbitrary query data; the site uses only short v= cache keys.
    if (url.pathname.includes('%') || [...url.searchParams].some(([key, value]) => key !== 'v' || !/^[a-zA-Z0-9._-]{1,80}$/.test(value))) return false;
    if (resourceType === 'document') return PAGE_PATHS.has(url.pathname) && !url.search;
    const fetchedImage = ['fetch', 'xhr'].includes(resourceType) && IMAGE_EXTENSIONS.test(url.pathname);
    if ((!RESOURCE_TYPES.has(resourceType) && !fetchedImage) || !ASSET_EXTENSIONS.test(url.pathname)) return false;
    return ASSET_ROOTS.some(prefix => url.pathname.startsWith(prefix)) || /^\/(?:favicon\.ico|icon\.png)$/.test(url.pathname);
  } catch { return false; }
}

export async function createArchiveDirectory(repositoryRoot) {
  // Fixed private destination: callers cannot redirect captures into published directories.
  const canonicalRoot = await fs.realpath(repositoryRoot);
  if (canonicalRoot.split(path.sep).some(part => part === 'public' || part === 'website')) throw new Error('Captures cannot be stored inside public or website directories.');
  let parent = canonicalRoot;
  for (const name of ['archives', 'public-versions']) {
    const next = path.join(parent, name);
    await fs.mkdir(next, { mode: 0o700 }).catch(error => { if (error.code !== 'EEXIST') throw error; });
    const info = await fs.lstat(next);
    if (!info.isDirectory() || info.isSymbolicLink() || await fs.realpath(next) !== next) throw new Error('Archive directories must be real directories inside the repository, not symlinks.');
    parent = next;
  }
  const started = new Date().toISOString();
  const directory = path.join(parent, `${started.replace(/[-:.]/g, '')}-${randomUUID()}`);
  await fs.mkdir(directory, { mode: 0o700 });
  return { directory, started };
}

function localCommit() {
  try { return execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); }
  catch { return null; }
}

async function bounded(promise, milliseconds) {
  let timer;
  try { return await Promise.race([promise, new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('Capture operation timed out.')), milliseconds); })]); }
  finally { clearTimeout(timer); }
}

export function publicReceiptMetadata(data) {
  if (data?.schema_version !== 1 || data?.event !== 'production_build') throw new Error('Unknown public receipt schema.');
  const text = value => typeof value === 'string' ? value.slice(0, 256) : null;
  const commit = /^[a-f0-9]{40,64}$/.test(data.source?.commit_sha || '') ? data.source.commit_sha : null;
  return {
    schema_version: 1, event: 'production_build', generated_at_utc: text(data.generated_at_utc),
    source: { commit_sha: commit, working_tree_dirty: typeof data.source?.working_tree_dirty === 'boolean' ? data.source.working_tree_dirty : null },
    build: { id: text(data.build?.id), application_version: text(data.build?.application_version), environment: text(data.build?.environment) },
    site: { canonical_origin: text(data.site?.canonical_origin), deployment_origin: text(data.site?.deployment_origin) },
  };
}

async function settleVisibleImages(page) {
  await bounded(page.evaluate(async () => {
    const visible = [...document.images].filter(image => {
      const rect = image.getBoundingClientRect();
      return (image.currentSrc || image.getAttribute('src')) && rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < innerHeight && rect.right > 0 && rect.left < innerWidth && getComputedStyle(image).visibility !== 'hidden';
    });
    await Promise.all(visible.map(image => image.decode()));
  }), 10000);
}

export async function capturePublicVersion(url, options = {}) {
  const { directory, started } = await createArchiveDirectory(options.repositoryRoot || root);
  const manifest = {
    schema_version: 1, status: 'partial', capture_started_at_utc: started, capture_finished_at_utc: null,
    public_origin: url.origin, local_repository_commit_sha: localCommit(),
    local_commit_caveat: 'The local repository commit is context only; it is not asserted to be the deployed commit. Dirty local files are not copied by this public capture.',
    deployed_build_receipt: null, remote_reported_commit_sha: null,
    capture_scope: 'Fresh unauthenticated browser. Selected public pages and the same-origin image, font, CSS, and JavaScript responses they request. This is not a complete static export of every site route or asset.',
    privacy: 'No existing browser profile, cookies, storage export, request/response headers, API requests, form submissions, or authenticated pages are archived. Rendered HTML strips form field values; fetched HTML is the original anonymous public response.',
    viewport: { width: 1440, height: 900 }, reduced_motion: true,
    pages: [], artifacts: [], assets: [], blocked_request_count: 0, errors: [],
  };
  let browser;
  let context;
  let assetBytes = 0;
  let assetCount = 0;
  const assetUrls = new Set();
  const pending = new Set();
  async function save(relative, bytes, kind) {
    const payload = Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes);
    const destination = path.join(directory, relative);
    await fs.mkdir(path.dirname(destination), { recursive: true, mode: 0o700 });
    await fs.writeFile(destination, payload, { flag: 'wx', mode: 0o600 });
    const artifact = { path: relative, kind, bytes: payload.length, sha256: sha256(payload) };
    manifest.artifacts.push(artifact);
    return artifact;
  }
  const error = (code, surface) => {
    if (!manifest.errors.some(item => item.code === code && item.surface === surface)) manifest.errors.push({ code, ...(surface ? { surface } : {}) });
  };
  async function archiveAsset(response) {
    const request = response.request();
    if (request.resourceType() === 'document' || !allowedRequest(url.origin, response.url(), request.method(), request.resourceType())) return;
    if (assetUrls.has(response.url())) return;
    assetUrls.add(response.url());
    if (++assetCount > MAX_ASSETS) { error('asset_count_limit_reached'); return; }
    if (!response.ok()) { error('public_asset_http_error', new URL(response.url()).pathname); return; }
    const declaredLength = Number(response.headers()['content-length']);
    if (declaredLength > MAX_ASSET_BYTES) { error('asset_size_limit_reached', new URL(response.url()).pathname); return; }
    const bytes = await bounded(response.body(), 15000);
    if (bytes.length > MAX_ASSET_BYTES || assetBytes + bytes.length > MAX_TOTAL_ASSET_BYTES) { error('asset_size_limit_reached', new URL(response.url()).pathname); return; }
    assetBytes += bytes.length;
    const extension = path.extname(new URL(response.url()).pathname).toLowerCase();
    const relative = `assets/${sha256(response.url()).slice(0, 16)}-${sha256(bytes).slice(0, 16)}${extension}`;
    const artifact = await save(relative, bytes, 'public_asset');
    manifest.assets.push({ url: response.url(), ...artifact });
  }
  try {
    let chromium;
    try { ({ chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright')); }
    catch { error('playwright_unavailable_set_PLAYWRIGHT_MODULE_PATH_to_an_existing_installation'); throw new Error('dependency'); }
    try { browser = await chromium.launch({ headless: true }); }
    catch { error('chromium_unavailable_no_browser_was_installed'); throw new Error('browser'); }
    context = await browser.newContext({ viewport: manifest.viewport, reducedMotion: 'reduce', serviceWorkers: 'block', acceptDownloads: false });
    await context.route('**/*', async route => {
      const request = route.request();
      if (allowedRequest(url.origin, request.url(), request.method(), request.resourceType())) return route.continue();
      manifest.blocked_request_count++;
      return route.abort();
    });
    context.on('response', response => {
      const task = archiveAsset(response).catch(() => error('public_asset_capture_failed', new URL(response.url()).pathname));
      pending.add(task);
      task.finally(() => pending.delete(task));
    });
    const page = await context.newPage();
    page.setDefaultTimeout(15000);
    page.on('dialog', dialog => dialog.dismiss());
    for (const target of [
      { name: 'landing', path: '/', sections: ['introduction', 'milestones', 'journey', 'app', 'yearly-bracelets'] },
      { name: 'how-it-works', path: '/how-it-works', sections: ['wearable', 'evolution'] },
      { name: 'patents', path: '/patents', sections: [] },
    ]) {
      const entry = { name: target.name, url: new URL(target.path, url.origin).href, captured_at_utc: new Date().toISOString(), status: 'partial', screenshots: [] };
      manifest.pages.push(entry);
      try {
        const response = await page.goto(entry.url, { waitUntil: 'load', timeout: 30000 });
        if (!response?.ok() || !allowedRequest(url.origin, page.url(), 'GET', 'document')) throw new Error('Public page unavailable.');
        entry.final_url = page.url();
        entry.http_status = response.status();
        const source = await bounded(response.body(), 15000);
        if (source.length > 5 * 1024 * 1024) throw new Error('Page size limit reached.');
        entry.fetched_html = await save(`pages/${target.name}/fetched.html`, source, 'fetched_public_html');
        await bounded(page.evaluate(() => document.fonts.ready), 10000);
        entry.title = await page.title();
        entry.metadata = await page.locator('head').evaluate(head => ({
          meta: [...head.querySelectorAll('meta[name], meta[property]')].map(item => ({ name: item.getAttribute('name') || item.getAttribute('property'), content: (item.getAttribute('content') || '').slice(0, 2000) })),
          canonical: head.querySelector('link[rel="canonical"]')?.getAttribute('href') || null,
        }));
        const render = await page.evaluate(() => {
          const clone = document.documentElement.cloneNode(true);
          clone.querySelectorAll('input').forEach(input => { input.removeAttribute('value'); input.removeAttribute('checked'); });
          clone.querySelectorAll('textarea').forEach(input => { input.textContent = ''; });
          clone.querySelectorAll('option').forEach(option => option.removeAttribute('selected'));
          return '<!doctype html>\n' + clone.outerHTML;
        });
        entry.rendered_html = await save(`pages/${target.name}/rendered.html`, render, 'rendered_html_form_values_removed');
        await settleVisibleImages(page);
        entry.screenshots.push(await save(`pages/${target.name}/overview.png`, await page.screenshot({ type: 'png' }), 'screenshot'));
        for (const section of target.sections) {
          const locator = page.locator(`#${section}`);
          if (!(await locator.count())) { error('expected_section_missing', `${target.path}#${section}`); continue; }
          await locator.evaluate(element => element.scrollIntoView({ block: 'start', behavior: 'instant' }));
          await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
          await settleVisibleImages(page);
          entry.screenshots.push(await save(`pages/${target.name}/${section}.png`, await page.screenshot({ type: 'png' }), 'screenshot'));
        }
        entry.status = 'captured';
      } catch { error('page_capture_failed', target.path); }
    }
    // A public receipt is optional; lack of one must never turn local HEAD into a deployed SHA.
    const receiptUrl = new URL('/halo-site/release-provenance.json', url.origin);
    try {
      const response = await fetch(receiptUrl, { redirect: 'error', signal: AbortSignal.timeout(5000), credentials: 'omit' });
      if (response.ok()) {
        const text = await bounded(response.text(), 5000);
        if (text.length > 64000) throw new Error('Receipt too large.');
        const safe = publicReceiptMetadata(JSON.parse(text));
        manifest.remote_reported_commit_sha = safe.source.commit_sha;
        manifest.deployed_build_receipt = {
          url: receiptUrl.href, response_sha256: sha256(text),
          caveat: 'Observed public build metadata; independently verified deployment identity is not asserted by this capture.',
          ...await save('public-build-receipt.json', JSON.stringify(safe, null, 2) + '\n', 'public_build_receipt_allowlisted_fields'),
        };
      }
    } catch { manifest.deployed_build_receipt = null; }
  } catch {
    if (!manifest.errors.length) error('capture_initialization_failed');
  } finally {
    if (context) {
      await Promise.allSettled([...pending]);
      await context.close().catch(() => error('browser_context_close_failed'));
      await Promise.allSettled([...pending]);
    }
    if (browser) await browser.close().catch(() => error('browser_close_failed'));
    manifest.capture_finished_at_utc = new Date().toISOString();
    manifest.status = manifest.errors.length === 0 && manifest.pages.length === 3 && manifest.pages.every(item => item.status === 'captured') ? 'complete' : 'partial';
    manifest.artifacts.sort((a, b) => a.path.localeCompare(b.path));
    manifest.assets.sort((a, b) => a.url.localeCompare(b.url));
    const serialized = JSON.stringify(manifest, null, 2) + '\n';
    await fs.writeFile(path.join(directory, 'manifest.json'), serialized, { flag: 'wx', mode: 0o600 });
    await fs.writeFile(path.join(directory, 'manifest.sha256'), `${sha256(serialized)}  manifest.json\n`, { flag: 'wx', mode: 0o600 });
  }
  return { directory, manifest };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const { directory, manifest } = await capturePublicVersion(parseArguments(process.argv.slice(2)));
    console.log(`${manifest.status === 'complete' ? 'Captured' : 'Partial capture'}: ${directory}`);
    if (manifest.status !== 'complete') { console.error('Capture incomplete; see manifest.json errors. No files were published.'); process.exitCode = 1; }
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
