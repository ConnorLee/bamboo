import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const copyright = '© 2026 Halo. All rights reserved.';
const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

export function validateIpConfig(config) {
  if (config.schema_version !== 1 || !['none', 'pending', 'issued'].includes(config.PATENT_STATUS)) throw new Error('Invalid IP configuration. PATENT_STATUS must be none, pending, or issued.');
  if (!Array.isArray(config.patents)) throw new Error('IP configuration requires a patents array.');
  for (const patent of config.patents) {
    if (patent.approved_for_publication !== true) throw new Error('Keep unapproved patent details outside the public configuration.');
    if (!['pending', 'issued'].includes(patent.status) || !patent.product_or_technology || !patent.description) throw new Error('Approved patent entries need a product, factual description, and valid status.');
    if (config.PATENT_STATUS === 'none' || (patent.status === 'issued' && config.PATENT_STATUS !== 'issued')) throw new Error('Patent entry conflicts with PATENT_STATUS.');
  }
  return config;
}

export function renderNotice(config) {
  validateIpConfig(config);
  return copyright + (config.PATENT_STATUS === 'pending' ? ' Patent pending.' : config.PATENT_STATUS === 'issued' ? ' <a href="/patents">Patents</a>' : '');
}

export function renderPatents(config) {
  validateIpConfig(config);
  if (!config.patents.length) return '<p>Halo patent information will be published here as appropriate.</p>';
  return config.patents.map(patent => {
    const fields = [
      ['Status', patent.status === 'issued' ? 'Issued' : 'Application pending'],
      ['Jurisdiction', patent.jurisdiction],
      ['Application number', patent.application_number],
      ['Patent number', patent.patent_number],
      ['Filing date', patent.filing_date],
      ['Grant date', patent.grant_date],
    ];
    return `<article><h2>${escapeHtml(patent.product_or_technology)}</h2><dl>${fields.filter(([, value]) => value).map(([label, value]) => `<div><dt>${label}</dt><dd>${escapeHtml(value)}</dd></div>`).join('')}</dl><p>${escapeHtml(patent.description)}</p></article>`;
  }).join('\n');
}

export async function applyIpNotices(root, output) {
  const config = validateIpConfig(JSON.parse(await readFile(path.join(root, 'config/ip.json'), 'utf8')));
  for (const relative of ['index.html', 'how-it-works/index.html', 'patents/index.html']) {
    const file = path.join(output, relative);
    let html = await readFile(file, 'utf8');
    if (!html.includes('<!-- halo:ip-notice -->')) throw new Error(`Missing IP notice slot: ${relative}`);
    html = html.replace(/<!-- halo:ip-notice -->[\s\S]*?<!-- \/halo:ip-notice -->/g, `<!-- halo:ip-notice -->${renderNotice(config)}<!-- /halo:ip-notice -->`);
    if (relative === 'patents/index.html') html = html.replace(/<!-- halo:patent-records -->[\s\S]*?<!-- \/halo:patent-records -->/, `<!-- halo:patent-records -->${renderPatents(config)}<!-- /halo:patent-records -->`);
    await writeFile(file, html);
  }
}
