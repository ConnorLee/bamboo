import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const sections = [
  ['01', 'roadmap', 'Manufacturing roadmap'], ['02', 'supply-chain', 'Split the supply chain'],
  ['03', 'sourcing', 'Supplier sourcing'], ['04', 'rf-reference', 'RF / NFC reference'],
  ['05', 'mechanical', 'Mechanical interface'], ['06', 'cad', 'CAD checklist'],
  ['07', 'prototypes', 'Prototype plan'], ['08', 'rf-matrix', 'RF test matrix'],
  ['09', 'quotes', 'Supplier quote tracker'], ['10', 'costs', 'Cost model'],
  ['11', 'procedure', 'Test procedure'], ['12', 'bracelet-outreach', 'Bracelet factory outreach'],
  ['13', 'nfc-outreach', 'NFC supplier outreach'], ['14', 'ip', 'Protecting Halo IP'],
  ['15', 'red-flags', 'Supplier red flags'], ['16', 'next-actions', 'Immediate next actions'],
];
const groups = { 0: 'Plan & source', 3: 'Engineer & validate', 8: 'Track & operate', 13: 'Protect & proceed' };
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
  const [template, content] = await Promise.all([
    readFile(path.join(source, 'page.html'), 'utf8'),
    readFile(path.join(source, 'content.html'), 'utf8'),
  ]);
  await mkdir(output, { recursive: true });
  await writeFile(path.join(output, 'index.html'), template.replace('{{NAVIGATION}}', navigation).replace('{{CONTENT}}', content));
  await Promise.all(assets.map(name => cp(path.join(source, name), path.join(output, name))));
  console.log('Built Halo manufacturing workspace: /manufacture');
}
