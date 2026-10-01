import { createHash, randomUUID } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

export const canonicalOrigin = 'https://www.habithalo.app';
export const receiptPath = '/halo-site/release-provenance.json';
const imageExtension = /\.(?:png|jpe?g|webp|avif|svg|gif)$/i;
const publicTextExtension = /\.(?:html|css|js)$/i;
const shaPattern = /^[a-f0-9]{40,64}$/;

function git(root, args) {
  try { return execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); }
  catch { return null; }
}
function label(value) { return typeof value === 'string' && value.length <= 200 && !/[\x00-\x1f]/.test(value) ? value : null; }
export function origin(value) {
  if (!value) return null;
  const url = new URL(value.includes('://') ? value : `https://${value}`);
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || url.pathname !== '/') throw new Error('Expected a public HTTPS origin without credentials, path, or query.');
  return url.origin;
}
export function sourceMetadata(root, env = process.env) {
  const candidate = env.HALO_SOURCE_COMMIT || env.VERCEL_GIT_COMMIT_SHA || git(root, ['rev-parse', 'HEAD']);
  const status = git(root, ['status', '--porcelain', '--untracked-files=normal', '--', '.', ':!provenance/releases']);
  return {
    commit_sha: shaPattern.test(candidate || '') ? candidate : null,
    branch: label(env.HALO_SOURCE_BRANCH || env.VERCEL_GIT_COMMIT_REF || git(root, ['branch', '--show-current'])) || null,
    working_tree_dirty: env.HALO_SOURCE_DIRTY === 'true' ? true : env.HALO_SOURCE_DIRTY === 'false' ? false : status === null ? null : Boolean(status),
    metadata_origin: env.HALO_SOURCE_COMMIT ? 'deployment_command_git_context' : env.VERCEL_GIT_COMMIT_SHA ? 'vercel_git_metadata' : candidate ? 'local_git' : 'unavailable',
    qualification: 'Commit identity does not identify uncommitted content. Artifact hashes identify the captured public bytes.',
  };
}
export async function hashFile(file) {
  const hash = createHash('sha256');
  let bytes = 0;
  for await (const chunk of createReadStream(file)) { hash.update(chunk); bytes += chunk.length; }
  return { sha256: hash.digest('hex'), bytes };
}
async function walk(directory, prefix = '') {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const relative = path.posix.join(prefix, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path.join(directory, entry.name), relative));
    else if (entry.isFile()) files.push(relative); // Never follow symlinks into private files.
  }
  return files;
}
export async function appendRecord(root, record) {
  const directory = path.join(root, 'provenance/releases');
  await mkdir(directory, { recursive: true });
  const file = `${record.generated_at_utc.replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')}-${randomUUID()}.json`;
  const target = path.join(directory, file);
  await writeFile(target, JSON.stringify(record, null, 2) + '\n', { flag: 'wx' });
  return target;
}
export async function recordBuild(root, env = process.env) {
  const output = path.join(root, 'public/halo-site');
  const generated = new Date().toISOString();
  const files = await walk(output);
  const images = [];
  const artifacts = [];
  for (const relative of files) {
    const isImage = imageExtension.test(relative) && /^(?:assets\/|original\/assets\/|how-it-works\/assets\/)/.test(relative);
    const isText = publicTextExtension.test(relative) && (!relative.includes('/') || /^(?:how-it-works|patents)\/[^/]+$/.test(relative) || relative === 'original/style.css');
    const isFont = /^(?:original|how-it-works)\/assets\/fonts\/[^/]+\.(?:otf|ttf|woff2?)$/.test(relative);
    const isCatalog = relative === 'assets/stone-year/catalog.json';
    if (!isImage && !isText && !isCatalog && !isFont) continue;
    const artifact = { path: `/halo-site/${relative}`, ...await hashFile(path.join(output, relative)) };
    if (isImage) images.push(artifact);
    else artifacts.push(artifact);
  }
  const imageManifest = { schema_version: 1, generated_at_utc: generated, scope: 'Public image assets shipped in the selected landing-page asset directories; inclusion does not imply every image is currently displayed.', assets: images };
  const imageManifestFile = path.join(output, 'product-imagery-manifest.json');
  await writeFile(imageManifestFile, JSON.stringify(imageManifest, null, 2) + '\n');
  artifacts.push({ path: '/halo-site/product-imagery-manifest.json', ...await hashFile(imageManifestFile) });
  const conceptsFile = path.join(root, 'provenance/product-concepts.json');
  const concepts = JSON.parse(await readFile(conceptsFile, 'utf8'));
  const pkg = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
  const record = {
    schema_version: 1,
    event: 'production_build',
    generated_at_utc: generated,
    source: sourceMetadata(root, env),
    build: { id: label(env.VERCEL_DEPLOYMENT_ID) || `local-${randomUUID()}`, application_version: pkg.version, environment: 'production' },
    site: { canonical_origin: canonicalOrigin, deployment_origin: origin(env.VERCEL_URL) },
    publication: { verified: false, note: 'Successful build only. This record does not establish public deployment or an independently trusted timestamp.' },
    artifacts,
    surfaces: {
      landing_page: { path: '/', artifacts: ['/halo-site/index.html', '/halo-site/style.css', '/halo-site/app.js'] },
      wearable: { path: '/#journey', artifacts: ['/halo-site/index.html', '/halo-site/bracelet.js', '/halo-site/product-imagery-manifest.json'] },
      milestone_stones: { path: '/#milestones', artifacts: ['/halo-site/index.html', '/halo-site/app.js', '/halo-site/product-imagery-manifest.json'] },
      support_network_copy: { path: '/', artifacts: ['/halo-site/index.html'], note: 'Support-system marketing copy; demo network presence is separately qualified in the concept manifest.' },
      product_imagery: { path: '/halo-site/product-imagery-manifest.json', artifacts: ['/halo-site/product-imagery-manifest.json'] },
      patent_information: { path: '/patents', artifacts: ['/halo-site/patents/index.html'] },
    },
    product_concepts: { ...await hashFile(conceptsFile), manifest: concepts },
    product_imagery: { ...await hashFile(imageManifestFile), manifest: imageManifest },
  };
  const target = await appendRecord(root, record);
  const publicRecord = structuredClone(record);
  publicRecord.source.branch = null;
  publicRecord.source.branch_omission = 'Branch names are retained in local release records, not the public receipt.';
  delete publicRecord.product_imagery.manifest; // The current public image inventory has its own hashed URL.
  await writeFile(path.join(output, 'release-provenance.json'), JSON.stringify(publicRecord, null, 2) + '\n');
  return { record, target };
}

export async function getPublicFile(url) {
  const response = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(45000), headers: { 'Cache-Control': 'no-cache' } });
  if (!response.ok) throw new Error(`Public verification failed (${response.status}): ${new URL(url).pathname}`);
  const chunks = [];
  let length = 0;
  for await (const chunk of response.body) {
    length += chunk.length;
    if (length > 20 * 1024 * 1024) throw new Error('Public verification artifact exceeds 20 MB.');
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

export async function collectDeployment(root, deploymentOrigin, sourceContext = null) {
  const host = origin(deploymentOrigin);
  if (!host) throw new Error('A verified deployment origin is required.');
  const receiptBytes = await getPublicFile(host + receiptPath);
  const receipt = JSON.parse(receiptBytes);
  if (receipt.schema_version !== 1 || receipt.event !== 'production_build' || receipt.site?.canonical_origin !== canonicalOrigin || !Array.isArray(receipt.artifacts)) throw new Error('Unrecognized Halo build receipt.');
  if (sourceContext?.commit_sha && receipt.source?.commit_sha !== sourceContext.commit_sha) throw new Error('Deployment commit does not match the source submitted by this command.');
  const verified = [];
  let imageManifest = null;
  for (const artifact of receipt.artifacts) {
    if (!/^\/halo-site\/[a-zA-Z0-9_./-]+$/.test(artifact.path) || artifact.path.includes('..')) throw new Error('Unsafe path in build receipt.');
    if (!/^[a-f0-9]{64}$/.test(artifact.sha256)) throw new Error('Invalid artifact hash.');
    const bytes = await getPublicFile(host + artifact.path);
    if (createHash('sha256').update(bytes).digest('hex') !== artifact.sha256) throw new Error(`Deployed artifact differs from build receipt: ${artifact.path}`);
    if (artifact.path === '/halo-site/product-imagery-manifest.json') imageManifest = JSON.parse(bytes);
    verified.push(artifact.path);
  }
  // Verify routed pages as well as their underlying static files.
  for (const [route, artifactPath] of [['/', '/halo-site/index.html'], ['/how-it-works', '/halo-site/how-it-works/index.html'], ['/patents', '/halo-site/patents/index.html']]) {
    const expected = receipt.artifacts.find(item => item.path === artifactPath);
    if (!expected) throw new Error(`Missing required surface: ${route}`);
    const bytes = await getPublicFile(host + route);
    if (createHash('sha256').update(bytes).digest('hex') !== expected.sha256) throw new Error(`Public route differs from built page: ${route}`);
    verified.push(route);
  }
  if (!imageManifest || imageManifest.schema_version !== 1 || !Array.isArray(imageManifest.assets)) throw new Error('Missing product imagery inventory.');
  const record = {
    schema_version: 1,
    event: 'production_deployment_observed',
    generated_at_utc: new Date().toISOString(),
    source: { ...receipt.source, branch: sourceContext?.branch ?? null, branch_omission: undefined },
    build: receipt.build,
    site: { ...receipt.site, observed_origin: host },
    publication: { verified: true, verified_artifacts: verified, note: 'Public HTTP responses matched the build hashes at observation time. Image bytes are listed in the hashed imagery manifest but are not all fetched by this collector. This is not proof of the first public disclosure or a trusted timestamp.' },
    build_receipt: { path: receiptPath, sha256: createHash('sha256').update(receiptBytes).digest('hex'), record: receipt },
    product_imagery: { ...receipt.product_imagery, manifest: imageManifest },
  };
  return { record, target: await appendRecord(root, record) };
}
