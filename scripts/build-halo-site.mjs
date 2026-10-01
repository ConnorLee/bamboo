import { cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildManufacture } from './build-manufacture.mjs';
import { applyIpNotices } from './ip-notice.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(root, 'website');
const output = path.join(root, 'public/halo-site');

// Keep the approved full-document design isolated from legacy demo layout styles.
// Only this generated directory is replaced; website/ is the editable source.
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await cp(source, output, { recursive: true });
await applyIpNotices(root, output);
await buildManufacture(path.join(root, 'manufacture'), path.join(output, 'manufacture'));
// Keep image-generation prompts and workstation provenance out of public assets.
await rm(path.join(output, 'assets/halo-milestone-screen-v1.json'), { force: true });

function publicUrl(value, directory) {
  if (/^(?:#|\/|[a-z][a-z\d+.-]*:)/i.test(value)) return value;
  const url = new URL(value, `https://halo.invalid/${directory ? directory + '/' : ''}`);
  const pathname = url.pathname;
  const isPage = pathname.endsWith('/') || pathname.endsWith('/index.html');
  const target = isPage
    ? pathname.replace(/index\.html$/, '').replace(/\/$/, '') || '/'
    : `/halo-site${pathname}`;
  return target + url.search + url.hash;
}

async function transform(directory = '') {
  for (const entry of await readdir(path.join(output, directory), { withFileTypes: true })) {
    const relative = path.posix.join(directory, entry.name);
    if (entry.isDirectory()) { await transform(relative); continue; }
    const file = path.join(output, relative);
    if (entry.name.endsWith('.html')) {
      let html = await readFile(file, 'utf8');
      html = html.replace(/\b(src|href)="([^"]+)"/g, (_, attr, value) => `${attr}="${publicUrl(value, directory)}"`);
      // Responsive picture sources need the same mounted asset URLs as img.src.
      html = html.replace(/\bsrcset="([^"]+)"/g, (_, value) => `srcset="${value.split(',').map(candidate => {
        const [url, ...descriptor] = candidate.trim().split(/\s+/);
        return [publicUrl(url, directory), ...descriptor].join(' ');
      }).join(', ')}"`);
      await writeFile(file, html);
    } else if (entry.name.endsWith('.js')) {
      // Image paths in these small, framework-free explorers are document-relative.
      const js = (await readFile(file, 'utf8')).replace(/([`'"])((?:\.\.\/)*(?:original\/)?assets)\//g, (_, quote, assets) => `${quote}/halo-site/${path.posix.normalize(path.posix.join(directory, assets))}/`);
      await writeFile(file, js);
    }
  }
}
await transform();
await rm(path.join(output, 'halo-i-sections.html'));
console.log('Built Halo website: /, /how-it-works, /original, /variants (A–D)');
