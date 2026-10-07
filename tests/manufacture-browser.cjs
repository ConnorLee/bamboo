/*
 * Browser integration QA for the built /brief workspace.
 * Serve dist first: python3 -m http.server 61019 --directory dist
 * Run: node tests/manufacture-browser.cjs
 * For a shared install: NODE_PATH=/path/to/node_modules node tests/manufacture-browser.cjs
 * Or set PLAYWRIGHT_MODULE_PATH to the installed Playwright module directory.
 * Optional MANUFACTURE_BASE_URL overrides http://127.0.0.1:61019.
 * All edits occur in an isolated browser context, never the founder's storage.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');

const baseUrl = process.env.MANUFACTURE_BASE_URL || 'http://127.0.0.1:61019';
const storageKey = 'halo-manufacture-workspace-v1';
const output = path.resolve(__dirname, '../qa/manufacture');
const briefAnchors = ['first-piece', 'stones', 'your-eye', 'together', 'working-reference'];
const anchors = ['roadmap', 'supply-chain', 'sourcing', 'rf-reference', 'mechanical', 'cad', 'prototypes', 'rf-matrix', 'quotes', 'costs', 'procedure', 'bracelet-outreach', 'nfc-outreach', 'ip', 'red-flags', 'next-actions'];

async function run() {
  await fs.mkdir(output, { recursive: true });
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1050 }, colorScheme: 'light', acceptDownloads: true });
  const page = await context.newPage();
  const errors = [];
  const checks = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('requestfailed', request => errors.push(`${request.method()} ${request.url()}: ${request.failure()?.errorText}`));
  page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
  page.on('dialog', dialog => dialog.accept());
  const stored = () => page.evaluate(key => localStorage.getItem(key), storageKey);
  async function savedValue(value) {
    await page.waitForFunction(({ key, value }) => (localStorage.getItem(key) || '').includes(value), { key: storageKey, value });
  }
  async function downloadFrom(selector) {
    const event = page.waitForEvent('download');
    await page.locator(selector).click();
    const download = await event;
    assert.equal(await download.failure(), null);
    return { name: download.suggestedFilename(), text: await fs.readFile(await download.path(), 'utf8') };
  }
  async function assertNoOverflow(width, height) {
    await page.setViewportSize({ width, height });
    await page.evaluate(() => window.scrollTo(0, 0));
    // Let sticky layers settle after a viewport resize before recording pixels.
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const dimensions = await page.evaluate(() => ({ viewport: innerWidth, page: document.documentElement.scrollWidth, body: document.body.scrollWidth }));
    assert.ok(dimensions.page <= dimensions.viewport + 1, `Page overflows at ${width}px: ${JSON.stringify(dimensions)}`);
    assert.ok(dimensions.body <= dimensions.viewport + 1, `Body overflows at ${width}px: ${JSON.stringify(dimensions)}`);
  }

  try {
    const legacy = await page.request.get(`${baseUrl}/manufacture?reference=1`, { maxRedirects: 0 });
    assert.equal(legacy.status(), 308);
    assert.equal(legacy.headers().location, '/brief?reference=1');
    const oldAsset = await page.request.get(`${baseUrl}/halo-site/manufacture/manufacture.css`, { maxRedirects: 0 });
    assert.equal(oldAsset.status(), 308);
    assert.equal(oldAsset.headers().location, '/halo-site/brief/manufacture.css');
    const response = await page.goto(`${baseUrl}/brief?reference=1`, { waitUntil: 'networkidle' });
    assert.equal(response.status(), 200);
    assert.equal(response.headers()['x-robots-tag'], 'noindex, nofollow, noarchive');
    await page.waitForSelector('[data-cost="carrier"]');
    await page.locator('#nfc-mode').selectOption('all');
    assert.equal(await page.title(), 'First Bracelet Brief — Halo');
    assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'), 'https://www.habithalo.app/brief');
    assert.equal(await page.locator('#section-nav a').count(), briefAnchors.length);
    assert.equal(await page.locator('#working-reference').evaluate(element => element.open), true);
    for (const id of briefAnchors) {
      assert.equal(await page.locator(`#${id}`).count(), 1, `Missing/duplicate brief section ${id}`);
      assert.equal(await page.locator(`#section-nav a[href="#${id}"]`).count(), 1);
    }
    for (const id of anchors) {
      assert.equal(await page.locator(`#${id}`).count(), 1, `Missing/duplicate section ${id}`);
    }
    checks.push('The /brief route is canonical and noindex; legacy page and asset URLs redirect; all 16 technical sections remain available.');

    const schema = await page.evaluate(() => ({ dimensions: HaloManufactureData.dimensions.length, protocol: HaloManufactureData.protocol.length, rf: HaloManufactureData.rf.length, quotes: HaloManufactureData.quotes.length, costs: HaloManufactureCosts.ITEMS.length }));
    assert.equal(schema.dimensions, 54);
    assert.equal(schema.protocol, 19);
    assert.equal(schema.rf, 24);
    assert.equal(schema.quotes, 26);
    assert.equal(schema.costs, 24);
    assert.equal(await page.locator('[data-dimension]').count(), schema.dimensions);
    assert.equal(await page.locator('[data-protocol]').count(), schema.protocol);
    assert.equal(await page.locator('[data-cost]').count(), schema.costs);
    assert.equal(await page.locator('[data-retail]').count(), 3);
    for (const table of ['rf', 'quotes']) {
      const count = await page.locator(`[data-table="${table}"]`).count();
      assert.ok(count >= schema[table], `No editable ${table} row`);
      assert.equal(count % schema[table], 0);
    }
    assert.ok(await page.locator('[data-check]').count() >= 17, 'Expected usable lab and roadmap checklists');
    assert.ok(await page.locator('details').count() > 0);
    checks.push('Canonical field counts, editable trackers and checklists are rendered.');

    for (const [width, height] of [[1440, 1050], [768, 1024], [390, 844]]) {
      await assertNoOverflow(width, height);
      await page.screenshot({ path: path.join(output, `light-${width}.png`) });
    }
    await page.setViewportSize({ width: 1440, height: 1050 });
    await page.locator('#theme-toggle').click();
    assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark');
    await page.screenshot({ path: path.join(output, 'dark-1440.png') });
    await page.reload({ waitUntil: 'networkidle' });
    assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark');
    await page.locator('#theme-toggle').click();
    checks.push('No document overflow at 390/768/1440px; dark theme persists on reload.');

    await page.locator('[data-dimension="stone-diameter"]').fill('8.25 — QA fixture');
    await page.locator('[data-dimension="blank-profile"]').fill('Flush filler — QA revision');
    await page.locator('[data-dimension="pack-envelope"]').fill('240 × 180 × 85 mm — QA fixture');
    await page.locator('[data-protocol="revision"]').fill('QA revision A');
    const checkbox = page.locator('[data-check]').first();
    const checkboxId = await checkbox.getAttribute('data-check');
    await checkbox.check();
    await page.locator('[data-check="cad-stone-diameter"]').check();
    await page.locator('[data-table="rf"][data-row="0"][data-key="prototype"]').fill('QA-RF-01');
    await page.locator('[data-table="rf"][data-row="0"][data-key="result"]').selectOption({ label: 'Inconclusive' });
    await page.locator('[data-table="quotes"][data-row="0"][data-key="supplier"]').fill('QA placeholder supplier');
    await savedValue('QA placeholder supplier');
    await page.reload({ waitUntil: 'networkidle' });
    assert.equal(await page.locator('[data-dimension="stone-diameter"]').inputValue(), '8.25 — QA fixture');
    assert.equal(await page.locator('[data-dimension="blank-profile"]').inputValue(), 'Flush filler — QA revision');
    assert.equal(await page.locator('[data-dimension="pack-envelope"]').inputValue(), '240 × 180 × 85 mm — QA fixture');
    assert.equal(await page.locator('[data-protocol="revision"]').inputValue(), 'QA revision A');
    assert.equal(await page.locator(`[data-check="${checkboxId}"]`).isChecked(), true);
    assert.equal(await page.locator('[data-check="cad-stone-diameter"]').isChecked(), true);
    assert.equal(await page.locator('[data-table="rf"][data-row="0"][data-key="prototype"]').inputValue(), 'QA-RF-01');
    assert.equal(await page.locator('[data-table="rf"][data-row="0"][data-key="result"]').inputValue(), 'Inconclusive');
    assert.equal(await page.locator('[data-table="quotes"][data-row="0"][data-key="supplier"]').inputValue(), 'QA placeholder supplier');
    for (const table of ['rf', 'quotes']) {
      const before = await page.locator(`[data-table="${table}"]`).count();
      await page.locator(`[data-add="${table}"]`).click();
      assert.equal(await page.locator(`[data-table="${table}"]`).count(), before + schema[table]);
    }
    const addedCounts = {};
    for (const table of ['rf', 'quotes']) addedCounts[table] = await page.locator(`[data-table="${table}"]`).count();
    await page.reload({ waitUntil: 'networkidle' });
    for (const table of ['rf', 'quotes']) assert.equal(await page.locator(`[data-table="${table}"]`).count(), addedCounts[table]);
    checks.push('Dimensions, protocol, checkboxes, RF/quote rows and appended rows survive reload.');

    await page.locator('[data-scenario="25"]').click();
    const costInputs = page.locator('[data-cost]');
    for (let index = 0; index < await costInputs.count(); index++) await costInputs.nth(index).fill('0');
    await page.locator('[data-cost="carrier"]').fill('2');
    await page.getByText('Historical retail sensitivity / not the $189 offer', {exact: true}).click();
    await page.locator('[data-retail="0"]').fill('100');
    await page.locator('[data-retail="1"]').fill('0');
    await page.locator('[data-retail="2"]').fill('200');
    assert.deepEqual(await page.locator('#cost-results .cost-stat strong').allTextContents(), ['$24.00', '$24.00', '$0.00']);
    assert.match(await page.locator('#cost-results .cost-stat small').first().innerText(), /\$600\.00/);
    assert.deepEqual(await page.locator('#margin-results tbody tr').first().locator('td').allTextContents(), ['$100.00', '$76.00', '76.0%', '$76.00', '76.0%']);
    assert.deepEqual(await page.locator('#margin-results tbody tr').nth(1).locator('td').allTextContents(), ['$0.00', '-$24.00', '—', '-$24.00', '—']);
    await page.locator('[data-cost="nfc"]').fill('-1');
    assert.equal(await page.locator('[data-cost="nfc"]').getAttribute('aria-invalid'), 'true');
    assert.equal(await page.locator('#cost-results .cost-stat strong').first().innerText(), 'Incomplete');
    await page.locator('[data-cost="nfc"]').fill('0');
    await page.locator('#cost-currency').selectOption('EUR');
    assert.equal(await page.locator('#cost-results .cost-stat strong').first().innerText(), '€24.00');
    assert.equal(await page.locator('[data-cost="carrier"]').inputValue(), '2');
    await page.locator('#cost-currency').selectOption('USD');
    let costText = await page.locator('#costs').textContent();
    assert.match(costText, /24(?:\.00)?/, 'Expected 12 × $2 carrier contribution');
    assert.match(costText, /76(?:\.0+)?\s*%/, 'Expected 76% gross margin at $100');
    assert.match(costText, /88(?:\.0+)?\s*%/, 'Expected 88% gross margin at $200');
    await page.locator('[data-scenario="100"]').click();
    assert.equal(await page.locator('[data-cost="carrier"]').inputValue(), '');
    assert.deepEqual(await page.locator('#cost-results .cost-stat strong').allTextContents(), ['Incomplete', 'Incomplete', 'Incomplete']);
    await page.locator('[data-cost="carrier"]').fill('3');
    await page.locator('[data-scenario="25"]').click();
    assert.equal(await page.locator('[data-cost="carrier"]').inputValue(), '2');
    await page.reload({ waitUntil: 'networkidle' });
    await page.locator('[data-scenario="25"]').click();
    assert.equal(await page.locator('[data-cost="carrier"]').inputValue(), '2');
    costText = await page.locator('#costs').textContent();
    assert.match(costText, /76(?:\.0+)?\s*%/);
    await page.locator('#costs').screenshot({ path: path.join(output, 'cost-model.png') });
    checks.push('BOM inputs persist, 12× quantities and margin outputs update, scenarios remain independent.');

    const backup = await downloadFrom('#export-workspace');
    assert.match(backup.name, /\.json$/i);
    const backupData = JSON.parse(backup.text);
    assert.equal(typeof backupData, 'object');
    assert.match(backup.text, /QA-RF-01/);
    assert.match(backup.text, /QA placeholder supplier/);
    for (const table of ['rf', 'quotes']) {
      const csv = await downloadFrom(`[data-csv="${table}"]`);
      assert.match(csv.name, /\.csv$/i);
      assert.match(csv.text, table === 'rf' ? /QA-RF-01/ : /QA placeholder supplier/);
      assert.match(csv.text, table === 'rf' ? /Prototype ID/ : /Supplier/);
    }
    const beforeMalformed = await stored();
    await page.locator('#import-file').setInputFiles({ name: 'invalid.json', mimeType: 'application/json', buffer: Buffer.from('{broken') });
    await page.waitForFunction(() => document.getElementById('toast').textContent.startsWith('Import rejected:'));
    assert.equal(await stored(), beforeMalformed, 'Malformed imports must preserve saved work');
    assert.equal(await page.locator('[data-dimension="stone-diameter"]').inputValue(), '8.25 — QA fixture');
    await page.locator('[data-dimension="stone-diameter"]').fill('9.99 — temporary edit');
    await savedValue('9.99 — temporary edit');
    await page.locator('#import-file').setInputFiles({ name: backup.name, mimeType: 'application/json', buffer: Buffer.from(backup.text) });
    await page.waitForFunction(() => document.querySelector('[data-dimension="stone-diameter"]').value === '8.25 — QA fixture');
    await page.reload({ waitUntil: 'networkidle' });
    assert.equal(await page.locator('[data-dimension="stone-diameter"]').inputValue(), '8.25 — QA fixture');
    checks.push('JSON and CSV downloads contain entered data; malformed imports preserve state; valid backups restore it.');

    assert.deepEqual(errors, [], 'No JavaScript, console, failed request or HTTP errors expected');
    checks.push('No JavaScript, console or network errors.');
    await fs.writeFile(path.join(output, 'browser-results.json'), JSON.stringify({ status: 'passed', url: `${baseUrl}/brief`, checks, errors, screenshots: ['light-1440.png', 'light-768.png', 'light-390.png', 'dark-1440.png', 'cost-model.png'] }, null, 2));
    console.log(`Manufacture browser QA passed (${checks.length} groups). Screenshots and results: ${output}`);
  } finally {
    await context.close();
    await browser.close();
  }
}

run().catch(error => { console.error(error); process.exitCode = 1; });
