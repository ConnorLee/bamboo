/* New hardware-schema migration and finish-aware program QA. Edits use isolated contexts. */
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const {chromium} = require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');
const origin = process.env.MANUFACTURE_BASE_URL || 'http://127.0.0.1:61019';
const key = 'halo-manufacture-workspace-v1';
const oldCosts = ['body','clasp','machining','finishing','carrier','gemstone','nfc','ferrite','blankFiller','assembly','engraving','masterPackaging','milestonePackaging','ritualCard','fulfillment','shipping','qc','scrap','duties','paymentFees'];
const oldRf = ['prototype','chip','antenna','ferrite','carrier','loose','installed','wrist','removed','phone','orientation','notes','result'];
const oldQuotes = ['supplier','country','component','process','moq','tooling','sample','unit25','unit100','unit500','unit1000','lead','material','tolerance','finish','contact','status','sampleOrdered','notes'];
async function run() {
  const browser = await chromium.launch({headless:true,channel:'chrome'});
  const context = await browser.newContext({viewport:{width:1440,height:1050},acceptDownloads:true});
  const page = await context.newPage();
  const errors = [], checks = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => {if(response.status() >= 400) errors.push(response.status()+' '+response.url());});
  async function download(selector) {
    const pending = page.waitForEvent('download'); await page.locator(selector).click();
    const item = await pending; assert.equal(await item.failure(), null); return fs.readFile(await item.path(),'utf8');
  }
  async function imported(value) {await page.locator('#import-file').setInputFiles({name:'hardware-backup.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(value))});}
  const saved = () => page.evaluate(key => JSON.parse(localStorage.getItem(key)), key);
  try {
    assert.equal((await page.goto(origin+'/brief?reference=1',{waitUntil:'networkidle'})).status(),200);
    await page.waitForSelector('[data-cost="sockets"]');
    const seed = JSON.parse(await download('#export-workspace'));
    const legacy = {
      version:1,
      dimensions:{width:'18 mm - old revision', 'old-dimension-note':'Retain retired evidence'},
      protocol:{'installed-target':'Suppression: 0 reads in 10','mechanical-target':'Legacy fixture note','old-protocol-note':'Historical raw result'},
      checks:{'next-07':true,'retired-check':true,'cad-width':true},
      rf:[Object.fromEntries(oldRf.map(id => [id, id === 'result' ? 'Pass' : id === 'prototype' ? 'OLD-SUPPRESSION-01' : id === 'installed' ? '0/10 reads' : '']))],
      quotes:[Object.fromEntries(oldQuotes.map(id => [id, id === 'supplier' ? 'Retained supplier' : id === 'status' ? 'Qualified' : id === 'sampleOrdered' ? 'Received' : '']))],
      model:{currency:'USD',retail:['100','',''],costs:Object.fromEntries(Object.keys(seed.model.costs).map(q => [q,Object.fromEntries(oldCosts.map(id => [id,id === 'body' ? '20' : id === 'finishing' ? '3' : '0']))]))}
    };
    legacy.rf[0].historicalEvidence = 'Retain unrendered column';
    legacy.model.costs[25].historicalCostNote = 'Retain old inclusion';
    await imported(legacy);
    await page.waitForFunction(() => document.querySelector('[data-dimension="width"]').value === '18 mm - old revision');
    assert.equal(await page.locator('[data-protocol="installed-target"]').inputValue(),'Suppression: 0 reads in 10');
    assert.equal(await page.locator('[data-protocol="installed-readability-target"]').inputValue(),'');
    assert.equal(await page.locator('[data-table="rf"][data-row="0"][data-key="requirement"]').inputValue(),'Legacy \u2014 re-review required');
    assert.equal(await page.locator('[data-table="rf"][data-row="0"][data-key="result"]').inputValue(),'Pass');
    assert.equal(await page.locator('[data-table="rf"][data-row="0"][data-key="installed"]').inputValue(),'0/10 reads');
    assert.match(await page.locator('#rf-table').innerText(), /old installed-state results are not proof/);
    for(const id of ['sockets','moduleAssembly','blackPvd','darkPackaging']) assert.equal(await page.locator(`[data-cost="${id}"]`).inputValue(),'');
    for(const id of ['size-sm','size-ml','underside-travel','current-indexing','pvd-allowance']) assert.equal(await page.locator(`[data-dimension="${id}"]`).inputValue(),'');
    assert.equal(await page.locator('[data-cost="body"]').inputValue(),'20');
    assert.equal(await page.locator('[data-cost="finishing"]').inputValue(),'3');
    assert.equal(await page.locator('#cost-results .cost-stat strong').first().innerText(),'Incomplete');
    const migrated = await saved();
    assert.equal(migrated.protocol['old-protocol-note'],'Historical raw result');
    assert.equal(migrated.dimensions['old-dimension-note'],'Retain retired evidence');
    assert.equal(migrated.checks['retired-check'],true);
    assert.equal(migrated.rf[0].historicalEvidence,'Retain unrendered column');
    assert.equal(migrated.model.costs[25].historicalCostNote,'Retain old inclusion');
    assert.equal(migrated.model.sharedTooling,'');
    assert.equal(migrated.model.yieldAssumptions[25].light,'');
    assert.equal(migrated.quotes[0].status,'Qualified');
    assert.equal(migrated.quotes[0].finishScope,'Unconfirmed');
    checks.push('Authentic v1 rows/costs/retired fields survive; old suppression passes stay historical; new costs, targets and yield remain unknown.');

    await page.locator('[data-add="rf"]').click();
    assert.equal(await page.locator('[data-table="rf"][data-row="1"][data-key="requirement"]').inputValue(),'H3 optional NFC experiment');
    assert.equal(await page.locator('[data-table="rf"][data-row="1"][data-key="result"]').inputValue(),'Not tested');
    await page.locator('[data-table="decisions"][data-row="0"][data-key="topic"]').fill('Resolve current stone indexing');
    await page.locator('[data-table="decisions"][data-row="0"][data-key="status"]').selectOption('REQUIRES PROTOTYPE');
    await page.locator('[data-table="decisions"][data-row="0"][data-key="evidence"]').fill('CAD study only; no physical validation');
    await page.locator('[data-table="quotes"][data-row="0"][data-key="program"]').fill('HALO shared Light/Dark rev 2');
    await page.locator('[data-table="quotes"][data-row="0"][data-key="size"]').fill('S/M and M/L, mix unconfirmed');
    await page.locator('[data-protocol="clasp-cycles"]').fill('Proposed cycle plan - supplier to review');
    await page.locator('[data-protocol="installed-readability-target"]').fill('Proposed readable installed-state test');
    await page.reload({waitUntil:'networkidle'});
    assert.equal(await page.locator('[data-table="decisions"][data-row="0"][data-key="topic"]').inputValue(),'Resolve current stone indexing');
    assert.equal(await page.locator('[data-protocol="clasp-cycles"]').inputValue(),'Proposed cycle plan - supplier to review');
    assert.equal(await page.locator('[data-table="quotes"][data-row="0"][data-key="program"]').inputValue(),'HALO shared Light/Dark rev 2');
    checks.push('New RF rows start untested on the current requirement; decisions, shared-program quotes and configurable protocols persist.');

    await page.locator('[data-cost="sockets"]').fill('0');
    await page.locator('[data-cost="moduleAssembly"]').fill('1');
    await page.locator('[data-cost="blackPvd"]').fill('5');
    await page.locator('[data-cost="darkPackaging"]').fill('2');
    await page.locator('[data-model-field="sharedTooling"]').fill('250');
    await page.locator('[data-mix="light"]').fill('15');
    await page.locator('[data-mix="dark"]').fill('10');
    await page.locator('[data-yield="light"]').fill('90');
    await page.locator('[data-yield="dark"]').fill('80');
    await page.locator('[data-yield="basis"]').fill('Illustrative assumption, awaiting pilot');
    assert.equal(await page.locator('#cost-results .cost-stat strong').first().innerText(),'$35.00');
    assert.match(await page.locator('#program-results').innerText(),/\$1,195\.00/);
    assert.match(await page.locator('#program-results').innerText(),/17 \/ 13/);
    await page.locator('[data-finish="dark"]').click();
    assert.equal(await page.locator('#cost-results .cost-stat strong').first().innerText(),'$42.00');
    assert.equal(await page.locator('[data-cost="finishing"]').inputValue(),'3');
    await page.locator('[data-yield="dark"]').fill('0');
    assert.equal(await page.locator('[data-yield="dark"]').getAttribute('aria-invalid'),'true');
    assert.match(await page.locator('#program-results').innerText(),/17 \/ Incomplete/);
    assert.match(await page.locator('#program-results').innerText(),/\$1,195\.00/);
    await page.locator('[data-yield="dark"]').fill('80');
    await page.locator('[data-scenario="100"]').click();
    assert.equal(await page.locator('[data-model-field="sharedTooling"]').inputValue(),'250');
    assert.equal(await page.locator('[data-mix="light"]').inputValue(),'');
    assert.equal(await page.locator('[data-cost="blackPvd"]').inputValue(),'');
    await page.locator('[data-scenario="25"]').click();
    assert.equal(await page.locator('[data-cost="blackPvd"]').inputValue(),'5');
    checks.push('Light/Dark totals share preparation; mixed batch adds tooling once; yield estimates starts without altering finished costs; scenarios remain independent.');

    const csv = await download('[data-csv="decisions"]');
    assert.match(csv,/Resolve current stone indexing/);
    const roundtrip = JSON.parse(await download('#export-workspace'));
    await imported(roundtrip);
    await page.reload({waitUntil:'networkidle'});
    const restored = JSON.parse(await download('#export-workspace'));
    assert.deepEqual(restored,roundtrip);
    for(const width of [390,768,1440]) {
      await page.setViewportSize({width,height:900});
      const size = await page.evaluate(() => ({width:innerWidth,scroll:document.documentElement.scrollWidth}));
      assert.ok(size.scroll <= size.width + 1,JSON.stringify(size));
    }
    assert.deepEqual(errors,[]);
    checks.push('JSON round trip preserves all new and historical data; decision CSV works; no document overflow at 390/768/1440px or runtime/network errors.');
    const output = path.resolve(__dirname,'../qa/manufacture/hardware-results.json');
    await fs.mkdir(path.dirname(output),{recursive:true});
    await fs.writeFile(output,JSON.stringify({status:'passed',url:origin+'/brief',checks,errors},null,2));
    console.log(`Hardware QA passed (${checks.length} groups): ${output}`);
  } finally {await context.close();await browser.close();}
}
run().catch(error => {console.error(error);process.exitCode=1;});
