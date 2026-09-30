import { cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(root, 'website');
const output = path.join(root, 'public/halo-site');
const fragment = await readFile(path.join(source, 'halo-i-sections.html'), 'utf8');

// Keep the approved full-document design isolated from legacy demo layout styles.
// Only this generated directory is replaced; website/ is the editable source.
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await cp(source, output, { recursive: true });

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
      if (relative === 'index.html') {
        if (!html.includes('<!-- HALO_I_SECTIONS -->')) throw new Error('Missing Halo I insertion point');
        html = html.replace('<!-- HALO_I_SECTIONS -->', fragment);
      }
      html = html.replace(/\b(src|href)="([^"]+)"/g, (_, attr, value) => `${attr}="${publicUrl(value, directory)}"`);
      await writeFile(file, html);
    } else if (entry.name.endsWith('.js')) {
      // Image paths in these small, framework-free explorers are document-relative.
      const js = (await readFile(file, 'utf8')).replace(/([`'"])assets\//g, `$1/halo-site/${directory ? directory + '/' : ''}assets/`);
      await writeFile(file, js);
    }
  }
}
await transform();
await rm(path.join(output, 'halo-i-sections.html'));
console.log('Built Halo website: /, /how-it-works, /original');
