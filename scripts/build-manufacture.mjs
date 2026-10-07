import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const sections = [
  ['01', 'first-piece', 'The first piece'], ['02', 'stones', 'The twelve stones'],
  ['03', 'your-eye', 'Where your eye helps'], ['04', 'together', 'Decide together'],
  ['05', 'working-reference', 'Working reference'],
];
const groups = { 0: 'Our brief', 4: 'Details when needed' };
const assets = [
  'manufacture.css', 'manufacture.js', 'workspace-data.js', 'cost-model.js',
  'reference-bracelets.png', 'latest-design-reference.png', 'packaging-reference-02.png',
  'hardware-architecture.svg', 'clasp-sizing.svg',
];

// The parent website build owns URL normalization; templates stay outside public output.
export async function buildManufacture(source, output) {
  const navigation = sections.map(([number, anchor, label], index) =>
    `${groups[index] ? `<p class="nav-group">${groups[index]}</p>\n` : ''}<a href="#${anchor}"><span>${number}</span>${label}</a>`
  ).join('\n');
  const [template, brief, content] = await Promise.all([
    readFile(path.join(source, 'page.html'), 'utf8'),
    readFile(path.join(source, 'brief.html'), 'utf8'),
    readFile(path.join(source, 'content.html'), 'utf8'),
  ]);
  await mkdir(output, { recursive: true });
  await writeFile(path.join(output, 'index.html'), template
    .replace('{{NAVIGATION}}', navigation)
    .replace('{{BRIEF}}', brief)
    .replace('{{CONTENT}}', content));
  await Promise.all(assets.map(name => cp(path.join(source, name), path.join(output, name))));
  console.log('Built Halo bracelet brief: /brief');
}
