/*
 * Focused storage/import and interaction regression checks.
 * Serve dist on 61019, then run: node tests/manufacture-resilience.cjs
 * For a shared install: NODE_PATH=/path/to/node_modules node tests/manufacture-resilience.cjs
 * Or set PLAYWRIGHT_MODULE_PATH to the installed Playwright module directory.
 * Uses isolated Chrome contexts; large synthetic backups stay in temporary files.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');

const origin = process.env.MANUFACTURE_BASE_URL || 'http://127.0.0.1:61019';
const url = `${origin}/brief?reference=1`;
const key = 'halo-manufacture-workspace-v1';
const output = path.resolve(__dirname, '../qa/manufacture/resilience-results.json');

async function run() {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const errors = [];
  const checks = [];
  const contexts = [];
  async function workspace(context) {
    if (!context) {
      context = await browser.newContext({ viewport: { width: 1440, height: 1050 }, colorScheme: 'light', acceptDownloads: true });
      contexts.push(context);
    }
    const page = await context.newPage();
    page.setDefaultTimeout(20000);
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('requestfailed', request => errors.push(`${request.url()}: ${request.failure()?.errorText}`));
    page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
    assert.equal((await page.goto(url, { waitUntil: 'networkidle' })).status(), 200);
    await page.waitForSelector('[data-cost="carrier"]');
    return { context, page };
  }
  async function download(page, selector) {
    const event = page.waitForEvent('download');
    await page.locator(selector).click();
    const file = await event;
    assert.equal(await file.failure(), null);
    return fs.readFile(await file.path(), 'utf8');
  }
  async function importJSON(page, value) {
    await page.locator('#import-file').setInputFiles({ name: 'qa-backup.json', mimeType: 'application/json', buffer: Buffer.from(typeof value === 'string' ? value : JSON.stringify(value)) });
  }
  const readStorage = page => page.evaluate(key => localStorage.getItem(key), key);

  try {
    {
      const { context, page } = await workspace();
      const legacy = JSON.parse(await download(page, '#export-workspace'));
      legacy.dimensions.width = 'Preserved pre-packaging revision';
      legacy.checks['cad-width'] = true;
      legacy.quotes[0].supplier = 'Existing quote record';
      for (const costs of Object.values(legacy.model.costs)) {
        delete costs.blankFiller;
        delete costs.ritualCard;
      }
      for (const id of Object.keys(legacy.model.costs[25])) legacy.model.costs[25][id] = '0';
      legacy.model.costs[25].body = '20';
      legacy.model.costs[25].masterPackaging = '8';
      await importJSON(page, legacy);
      await page.waitForFunction(() => document.querySelector('[data-dimension="width"]').value === 'Preserved pre-packaging revision');
      assert.equal(await page.locator('[data-cost="blankFiller"]').inputValue(), '');
      assert.equal(await page.locator('[data-cost="ritualCard"]').inputValue(), '');
      assert.equal(await page.locator('[data-cost="body"]').inputValue(), '20');
      assert.equal(await page.locator('[data-cost="masterPackaging"]').inputValue(), '8');
      assert.equal(await page.locator('[data-dimension="pack-envelope"]').inputValue(), '');
      assert.equal(await page.locator('[data-check="cad-width"]').isChecked(), true);
      assert.equal(await page.locator('[data-table="quotes"][data-row="0"][data-key="supplier"]').inputValue(), 'Existing quote record');
      assert.equal(await page.locator('#cost-results .cost-stat strong').first().innerText(), 'Incomplete');
      const migrated = JSON.parse(await readStorage(page));
      for (const costs of Object.values(migrated.model.costs)) {
        assert.equal(costs.blankFiller, '');
        assert.equal(costs.ritualCard, '');
      }
      await page.locator('[data-cost="blankFiller"]').fill('0');
      await page.locator('[data-cost="ritualCard"]').fill('0.5');
      assert.equal(await page.locator('#cost-results .cost-stat strong').first().innerText(), '$34.00');
      await page.reload({ waitUntil: 'networkidle' });
      assert.equal(await page.locator('[data-cost="ritualCard"]').inputValue(), '0.5');
      assert.equal(await page.locator('[data-check="cad-width"]').isChecked(), true);
      assert.equal(await page.locator('[data-dimension="width"]').inputValue(), 'Preserved pre-packaging revision');
      checks.push('Version-1 backups without filler/card costs retain existing data, add unknown costs without assuming zero, and remain editable after migration.');
      await context.close();
    }

    // A backup exceeding the old 5 MiB cutoff is valid under the row/schema limits.
    // It also exceeds Chrome's localStorage quota: retain it in memory and export it.
    {
      const { context, page } = await workspace();
      await page.locator('[data-dimension="stone-diameter"]').fill('Small saved baseline');
      const baselineText = await readStorage(page);
      const large = JSON.parse(await download(page, '#export-workspace'));
      large.dimensions['stone-diameter'] = 'Large backup retained in memory';
      const note = 'QA sample evidence '.repeat(1000); // 19,000 chars, below the 20,000-char field cap.
      large.rf = Array.from({ length: 320 }, (_, index) => ({ ...large.rf[0], prototype: `LARGE-QA-${index}`, notes: note }));
      const payload = JSON.stringify(large);
      assert.ok(Buffer.byteLength(payload) > 5 * 1024 * 1024);
      await importJSON(page, payload);
      await page.waitForFunction(() => document.querySelector('[data-dimension="stone-diameter"]').value === 'Large backup retained in memory');
      assert.equal(await page.locator('[data-table="rf"][data-key="prototype"]').count(), 320);
      assert.equal(await page.locator('[data-table="rf"][data-row="319"][data-key="notes"]').inputValue(), note);
      assert.match(await page.locator('#save-status').innerText(), /Not saved/);
      assert.match(await page.locator('#storage-notice').innerText(), /unavailable or full/);
      assert.equal(await page.locator('#storage-notice').isVisible(), true);
      assert.equal(await readStorage(page), baselineText, 'Quota failure must preserve the previous saved copy');
      const exported = await download(page, '#export-workspace');
      const roundtrip = JSON.parse(exported);
      assert.equal(roundtrip.rf.length, 320);
      assert.equal(roundtrip.rf[319].notes, note);
      assert.equal(roundtrip.dimensions['stone-diameter'], 'Large backup retained in memory');
      assert.deepEqual(Object.keys(roundtrip).sort(), Object.keys(large).sort());
      await page.close();
      const restored = (await workspace(context)).page;
      assert.equal(await restored.locator('[data-dimension="stone-diameter"]').inputValue(), 'Small saved baseline');
      await importJSON(restored, exported);
      await restored.waitForFunction(() => document.querySelector('[data-dimension="stone-diameter"]').value === 'Large backup retained in memory');
      assert.equal(await restored.locator('[data-table="rf"][data-row="319"][data-key="prototype"]').inputValue(), 'LARGE-QA-319');
      const exportedAgain = JSON.parse(await download(restored, '#export-workspace'));
      assert.equal(exportedAgain.rf.length, roundtrip.rf.length);
      assert.equal(exportedAgain.rf[0].notes, roundtrip.rf[0].notes);
      assert.equal(exportedAgain.rf[319].notes, roundtrip.rf[319].notes);
      assert.equal(await readStorage(restored), baselineText);
      checks.push(`Valid ${Buffer.byteLength(payload)}-byte backup imports, exports and reimports beyond 5 MiB; quota errors stay visible and previous saved data survives.`);
      await context.close();
    }

    {
      const { context, page } = await workspace();
      const compatible = JSON.parse(await download(page, '#export-workspace'));
      compatible.dimensions.width = 'Recovered valid backup';
      const corrupted = '{"version":1,"damaged":';
      await page.evaluate(({ key, corrupted }) => localStorage.setItem(key, corrupted), { key, corrupted });
      await page.reload({ waitUntil: 'networkidle' });
      assert.match(await page.locator('#save-status').innerText(), /Backup required/);
      assert.match(await page.locator('#storage-notice').innerText(), /has not been overwritten/);
      await page.locator('[data-dimension="width"]').fill('Temporary recovery work');
      assert.equal(await readStorage(page), corrupted);
      const temporary = JSON.parse(await download(page, '#export-workspace'));
      assert.equal(temporary.dimensions.width, 'Temporary recovery work');
      await importJSON(page, compatible);
      await page.waitForFunction(() => document.querySelector('[data-dimension="width"]').value === 'Recovered valid backup');
      assert.equal(JSON.parse(await readStorage(page)).dimensions.width, 'Recovered valid backup');
      assert.equal(await page.locator('#storage-notice').isHidden(), true);
      await page.locator('[data-dimension="width"]').fill('Saving works after recovery');
      assert.equal(JSON.parse(await readStorage(page)).dimensions.width, 'Saving works after recovery');
      checks.push('Corrupted saved JSON is preserved; temporary edits remain exportable; a valid import resumes saving.');
      await context.close();
    }

    {
      const { context, page: first } = await workspace();
      await first.locator('[data-dimension="width"]').fill('Shared original');
      const second = (await workspace(context)).page;
      assert.equal(await second.locator('[data-dimension="width"]').inputValue(), 'Shared original');
      await first.locator('[data-dimension="width"]').fill('Latest from first tab');
      await second.waitForFunction(() => document.getElementById('save-status').textContent === 'Another tab changed data');
      assert.match(await second.locator('#storage-notice').innerText(), /Saving here is paused/);
      await second.locator('[data-dimension="wall"]').fill('Unsaved work in stale tab');
      const saved = JSON.parse(await readStorage(second));
      assert.equal(saved.dimensions.width, 'Latest from first tab');
      assert.equal(saved.dimensions.wall, undefined);
      const temporary = JSON.parse(await download(second, '#export-workspace'));
      assert.equal(temporary.dimensions.width, 'Shared original');
      assert.equal(temporary.dimensions.wall, 'Unsaved work in stale tab');
      await second.reload({ waitUntil: 'networkidle' });
      assert.equal(await second.locator('[data-dimension="width"]').inputValue(), 'Latest from first tab');
      assert.equal(await second.locator('[data-dimension="wall"]').inputValue(), '');
      await second.locator('[data-dimension="wall"]').fill('Fresh tab edit');
      assert.equal(JSON.parse(await readStorage(second)).dimensions.wall, 'Fresh tab edit');
      checks.push('A second tab pauses stale writes, keeps unsaved edits exportable, and resumes from current state after reload.');
      await context.close();
    }

    {
      const { context, page } = await workspace();
      const anchor = page.locator('#section-nav a[href="#your-eye"]');
      await anchor.focus();
      await page.keyboard.press('Enter');
      await page.waitForFunction(() => location.hash === '#your-eye');
      const sectionTop = await page.locator('#your-eye').evaluate(element => element.getBoundingClientRect().top);
      assert.ok(sectionTop >= 76 && sectionTop < 180, `Keyboard target should sit below the sticky header; got ${sectionTop}px`);
      await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: () => Promise.reject(new Error('QA simulated clipboard denial')) } }));
      for (const id of ['bracelet-email', 'nfc-email']) {
        const enclosingDetails = page.locator(`[data-copy="${id}"]`).locator('xpath=ancestor::details[1]');
        if (await enclosingDetails.count() && !await enclosingDetails.evaluate(element => element.open)) {
          await enclosingDetails.locator(':scope > summary').click();
        }
        await page.locator(`[data-copy="${id}"]`).click();
        await page.waitForFunction(() => document.getElementById('toast').textContent.startsWith('Text selected.'));
        assert.equal(await page.evaluate(() => window.getSelection().toString()), await page.locator(`#${id}`).innerText());
      }
      checks.push('Keyboard Enter follows section anchors below the sticky header; both current outreach blocks select correctly when clipboard access fails.');
      await context.close();
    }

    {
      const { context, page } = await workspace();
      const literal = '"><img src="/qa-injection-should-not-load" onerror="window.haloUnsafe=true">';
      await page.locator('[data-dimension="width"]').fill(literal);
      await page.locator('[data-table="rf"][data-row="0"][data-key="notes"]').fill(literal);
      await page.locator('[data-add="rf"]').click();
      await page.reload({ waitUntil: 'networkidle' });
      assert.equal(await page.locator('[data-dimension="width"]').inputValue(), literal);
      assert.equal(await page.locator('[data-table="rf"][data-row="0"][data-key="notes"]').inputValue(), literal);
      assert.equal(await page.locator('#rf-table img, #cad-fields img').count(), 0);
      assert.equal(await page.evaluate(() => window.haloUnsafe), undefined);
      const formulae = ['=SUM(1,2)', '  +SUM(1,2)', '@SUM(1,2)'];
      for (let row = 0; row < formulae.length; row++) await page.locator(`[data-table="quotes"][data-row="${row}"][data-key="supplier"]`).fill(formulae[row]);
      await page.locator('[data-table="quotes"][data-row="0"][data-key="notes"]').fill('QA "quoted", cell\nsecond line');
      const csv = await download(page, '[data-csv="quotes"]');
      for (const formula of formulae) assert.ok(csv.includes(`"'${formula}"`), `CSV should neutralize formula ${formula}`);
      assert.ok(csv.includes('"QA ""quoted"", cell\nsecond line"'));
      const json = JSON.parse(await download(page, '#export-workspace'));
      assert.equal(json.quotes[0].supplier, formulae[0], 'JSON should preserve original text for reimport');
      assert.equal(json.rf[0].notes, literal);
      checks.push('HTML remains literal through rerenders/reloads; CSV prefixes potential formulae and escapes quotes/newlines while JSON preserves source text.');
      await context.close();
    }

    assert.deepEqual(errors, [], 'Resilience checks must not produce JavaScript or network errors');
    await fs.mkdir(path.dirname(output), { recursive: true });
    await fs.writeFile(output, JSON.stringify({ status: 'passed', url, checks, errors }, null, 2));
    console.log(`Manufacture resilience QA passed (${checks.length} focused groups). Results: ${output}`);
  } finally {
    for (const context of contexts) await context.close().catch(() => {});
    await browser.close();
  }
}

run().catch(error => { console.error(error); process.exitCode = 1; });
