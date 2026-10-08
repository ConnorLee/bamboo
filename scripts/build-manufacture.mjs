import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

const sections = [
  ['01', 'gtm', 'Launch hypothesis'], ['02', 'first-piece', 'Year One'],
  ['03', 'your-eye', 'Jewelry'], ['04', 'stones', 'Twelve stones'],
  ['05', 'ai-generations-packaging', 'AI packaging concepts'],
  ['06', 'together', 'Open decisions'], ['07', 'review-notes', 'Review notes'],
  ['08', 'working-reference', 'Working reference'],
];
const groups = { 0: 'Brief', 7: 'Technical reference' };
const assets = [
  'manufacture.css', 'manufacture.js', 'brief-review.js', 'workspace-data.js', 'cost-model.js',
  'reference-bracelets.png', 'latest-design-reference.png', 'packaging-reference-02.png',
  'hardware-architecture.svg', 'clasp-sizing.svg',
];

// The parent website build owns URL normalization; templates stay outside public output.
export async function buildManufacture(source, output) {
  // A stable content timestamp is more useful than the time a CDN rebuilt the page.
  let updatedAt;
  try {
    updatedAt = execFileSync('git', [
      'log', '-1', '--format=%cI', '--',
      'manufacture/page.html', 'manufacture/brief.html', 'manufacture/manufacture.css',
      'manufacture/brief-review.js', 'website/assets/brief/packaging-concept-02.webp',
    ], { cwd: path.resolve(source, '..'), encoding: 'utf8' }).trim();
  } catch {
    updatedAt = '';
  }
  const date = updatedAt && !Number.isNaN(Date.parse(updatedAt)) ? new Date(updatedAt) : new Date();
  const updatedText = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York', month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit', timeZoneName: 'short',
  }).format(date);
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
    .replace('{{CONTENT}}', content)
    .replace('{{BRIEF_UPDATED_AT_ISO}}', date.toISOString())
    .replace('{{BRIEF_UPDATED_AT_TEXT}}', updatedText));
  await Promise.all(assets.map(name => cp(path.join(source, name), path.join(output, name))));
  console.log('Built Halo bracelet brief: /brief');
}
