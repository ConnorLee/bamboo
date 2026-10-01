/* Run: node --test tests/manufacture-costs.cjs */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { ITEMS, SCENARIOS, blankModel, calculate, calculateProgram } = require('../manufacture/cost-model.js');

function zeroScenario(model, scenario) {
  ITEMS.forEach(item => { model.costs[scenario][item.id] = '0'; });
  return model;
}

test('a blank BOM contains no price assumptions and cannot publish incomplete totals', () => {
  const model = blankModel();
  assert.deepEqual(SCENARIOS, [25, 100, 500, 1000]);
  assert.equal(ITEMS.length, 24);
  assert.deepEqual(model.retail, ['', '', '']);
  SCENARIOS.forEach(scenario => {
    const result = calculate(model, scenario);
    assert.equal(result.complete, false);
    assert.equal(result.missing.length, ITEMS.filter(item => !item.finish).length);
    assert.deepEqual(result.invalid, []);
    assert.equal(result.cogs, null);
    assert.equal(result.landed, null);
    assert.equal(result.selling, null);
    assert.deepEqual(result.batch, { cogs: null, landed: null, selling: null });
    result.margins.forEach(row => {
      assert.equal(row.retail, null);
      assert.equal(row.grossProfit, null);
      assert.equal(row.grossMargin, null);
      assert.equal(row.contribution, null);
    });
  });
});

test('an explicit zero is valid and distinct from a missing cost', () => {
  const model = zeroScenario(blankModel(), 25);
  model.retail = ['100', '0', ''];
  const result = calculate(model, 25);
  assert.equal(result.complete, true);
  assert.equal(result.cogs, 0);
  assert.equal(result.landed, 0);
  assert.equal(result.margins[0].grossMargin, 100);
  assert.equal(result.margins[1].retail, 0);
  assert.equal(result.margins[1].grossMargin, null);
  assert.equal(result.margins[1].contributionMargin, null);
  assert.equal(result.margins[2].status, 'missing');
});

test('twelve-module quantities, cost boundaries, batch totals and margins do not double count', () => {
  const model = zeroScenario(blankModel(), 100);
  Object.assign(model.costs[100], {
    body: '20', clasp: '3', machining: '7', finishing: '4', carrier: '2',
    gemstone: '3', nfc: '0.5', ferrite: '0.25', assembly: '5', engraving: '1',
    masterPackaging: '4', milestonePackaging: '0.5', blankFiller: '1.5', ritualCard: '0.25', qc: '2', scrap: '3',
    shipping: '8', duties: '6', fulfillment: '5', paymentFees: '4'
  });
  model.retail = ['300', '150', '100'];
  const original = JSON.stringify(model);
  const result = calculate(model, '100');
  assert.equal(result.complete, true);
  assert.equal(result.items.find(item => item.id === 'carrier').lineTotal, 24);
  assert.equal(result.items.find(item => item.id === 'gemstone').lineTotal, 36);
  assert.equal(result.items.find(item => item.id === 'milestonePackaging').lineTotal, 6);
  assert.equal(result.items.find(item => item.id === 'blankFiller').lineTotal, 18);
  assert.equal(result.items.find(item => item.id === 'ritualCard').lineTotal, 3);
  assert.equal(result.cogs, 145);
  assert.equal(result.landed, 159);
  assert.equal(result.selling, 9);
  assert.deepEqual(result.batch, { cogs: 14500, landed: 15900, selling: 900 });
  assert.equal(result.margins[0].grossProfit, 141);
  assert.equal(result.margins[0].grossMargin, 47);
  assert.equal(result.margins[0].contribution, 132);
  assert.equal(result.margins[0].contributionMargin, 44);
  assert.equal(result.margins[1].grossMargin, -6);
  assert.equal(result.margins[2].grossProfit, -59);
  assert.equal(result.margins[2].contribution, -68);
  assert.equal(JSON.stringify(model), original, 'calculations must not change entered data');
});

test('older BOMs do not silently treat newly introduced components as free', () => {
  const model = zeroScenario(blankModel(), 25);
  model.costs[25].body = '40';
  delete model.costs[25].blankFiller;
  delete model.costs[25].ritualCard;
  let result = calculate(model, 25);
  assert.deepEqual(result.missing, ['blankFiller', 'ritualCard']);
  assert.equal(result.cogs, null);
  assert.equal(result.landed, null);
  assert.equal(result.items.find(item => item.id === 'body').lineTotal, 40);
  model.costs[25].blankFiller = '0';
  model.costs[25].ritualCard = '0';
  result = calculate(model, 25);
  assert.equal(result.complete, true);
  assert.equal(result.cogs, 40);
});

test('only complete dependency groups can produce totals or margins', () => {
  const model = zeroScenario(blankModel(), 25);
  model.costs[25].body = '40';
  model.costs[25].shipping = '';
  model.retail = ['100'];
  let result = calculate(model, 25);
  assert.equal(result.cogs, 40);
  assert.equal(result.landed, null);
  assert.equal(result.margins[0].grossProfit, null);
  assert.deepEqual(result.missing, ['shipping']);
  model.costs[25].shipping = '5';
  model.costs[25].paymentFees = '';
  result = calculate(model, 25);
  assert.equal(result.landed, 45);
  assert.equal(result.margins[0].grossProfit, 55);
  assert.equal(result.margins[0].contribution, null);
  model.costs[25].nfc = '';
  result = calculate(model, 25);
  assert.equal(result.cogs, null);
  assert.equal(result.landed, null);
  assert.equal(result.batch.cogs, null);
});

test('missing, invalid, nonfinite and negative inputs are never coerced to prices', () => {
  const model = zeroScenario(blankModel(), 500);
  for (const input of ['', ' ', undefined, null]) {
    model.costs[500].body = input;
    const result = calculate(model, 500);
    assert.deepEqual(result.missing, ['body']);
    assert.equal(result.cogs, null);
  }
  for (const input of ['-1', -0.01, Infinity, NaN, 'Infinity', '12abc', '0x10', '$4', true, {}, []]) {
    model.costs[500].body = input;
    const result = calculate(model, 500);
    assert.deepEqual(result.invalid, ['body']);
    assert.equal(result.complete, false);
    assert.equal(result.cogs, null);
    assert.equal(result.landed, null);
  }
  model.costs[500].body = ' 12.50 ';
  assert.equal(calculate(model, 500).cogs, 12.5);
});

test('retail validation preserves zero without producing undefined percentages', () => {
  const model = zeroScenario(blankModel(), 25);
  model.costs[25].body = '20';
  model.costs[25].fulfillment = '2';
  model.retail = ['0', '-5', 'Infinity', ' ', '50'];
  const rows = calculate(model, 25).margins;
  assert.equal(rows[0].grossProfit, -20);
  assert.equal(rows[0].contribution, -22);
  assert.equal(rows[0].grossMargin, null);
  assert.equal(rows[0].contributionMargin, null);
  for (const row of rows.slice(1, 4)) {
    assert.equal(row.retail, null);
    assert.equal(row.grossProfit, null);
    assert.equal(row.contribution, null);
  }
  assert.equal(rows[4].grossMargin, 60);
  assert.ok(Math.abs(rows[4].contributionMargin - 56) < 1e-10);
});

test('scenarios and blank models remain independent', () => {
  const model = blankModel();
  SCENARIOS.forEach((scenario, index) => {
    zeroScenario(model, scenario);
    model.costs[scenario].body = String(index + 1);
  });
  SCENARIOS.forEach((scenario, index) => {
    const result = calculate(model, scenario);
    assert.equal(result.cogs, index + 1);
    assert.equal(result.batch.cogs, (index + 1) * scenario);
  });
  assert.equal(blankModel().costs[25].body, '');
  assert.throws(() => calculate(model, 20), RangeError);
});

test('overflow never escapes as an infinite cost or margin', () => {
  const model = zeroScenario(blankModel(), 25);
  model.costs[25].carrier = '1e308';
  assert.deepEqual(calculate(model, 25).invalid, ['carrier']);
  assert.equal(calculate(model, 25).landed, null);
  model.costs[25].carrier = '0';
  model.costs[25].body = '1e308';
  model.costs[25].clasp = '1e308';
  assert.equal(calculate(model, 25).complete, false);
  assert.equal(calculate(model, 25).cogs, null);
});

test('the same dependency-free module is available in a browser', () => {
  const context = {};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../manufacture/cost-model.js'), 'utf8'), context);
  assert.equal(typeof context.HaloManufactureCosts.calculate, 'function');
  assert.equal(context.HaloManufactureCosts.ITEMS.length, ITEMS.length);
  assert.equal(context.HaloManufactureCosts.calculate(context.HaloManufactureCosts.blankModel(), 25).landed, null);
});


test('shared tooling is not included in variable costs and is amortized once across both finishes', () => {
  const model = zeroScenario(blankModel(), 100);
  Object.assign(model.costs[100], { body:'20', sockets:'1', moduleAssembly:'0.5', finishing:'4', blackPvd:'8', darkPackaging:'2', shipping:'3' });
  model.sharedTooling = '1000';
  model.mix[100] = {light:'60', dark:'40'};
  const light = calculate(model, 100, 'light');
  const dark = calculate(model, 100, 'dark');
  const original = JSON.stringify(model);
  const result = calculateProgram(model, 100);
  assert.equal(light.cogs, 42);
  assert.equal(dark.cogs, 52);
  assert.equal(light.landed, 45);
  assert.equal(dark.landed, 55);
  assert.equal(light.tooling.perKit, 10);
  assert.equal(dark.tooling.perKit, 10);
  assert.equal(light.amortizedLanded, 55);
  assert.equal(dark.amortizedLanded, 65);
  assert.equal(result.totals.landed, 4900);
  assert.equal(result.landedPlusTooling, 5900);
  assert.equal(result.complete, true);
  assert.equal(JSON.stringify(model), original);
  assert.equal(calculate(model, 25).tooling.perKit, 40, 'Scenario alternatives share one tooling figure');
});

test('a missing Dark premium cannot imply a free Dark finish, but cannot block Light costs', () => {
  const model = zeroScenario(blankModel(), 25);
  delete model.costs[25].blackPvd;
  delete model.costs[25].darkPackaging;
  model.costs[25].body = '30';
  assert.equal(calculate(model, 25, 'light').cogs, 30);
  assert.deepEqual(calculate(model, 25, 'dark').missing, ['blackPvd', 'darkPackaging']);
  assert.equal(calculate(model, 25, 'dark').cogs, null);
  model.mix[25] = {light:'24', dark:'1'};
  assert.equal(calculateProgram(model, 25).totals.cogs, null);
  model.mix[25] = {light:'25', dark:'0'};
  assert.equal(calculateProgram(model, 25).totals.cogs, 750, 'An explicit zero-count finish has no purchased units');
});

test('old models preserve known costs and leave new sockets, assembly and tooling unknown', () => {
  const model = zeroScenario(blankModel(), 25);
  model.costs[25].body = '30';
  delete model.costs[25].sockets;
  delete model.costs[25].moduleAssembly;
  delete model.sharedTooling;
  delete model.mix;
  delete model.yieldAssumptions;
  assert.deepEqual(calculate(model,25).missing, ['sockets','moduleAssembly']);
  assert.equal(calculate(model,25).items.find(item => item.id === 'body').unitCost, 30);
  const program = calculateProgram(model,25);
  assert.equal(program.sharedTooling, null);
  assert.equal(program.toolingPerKit, null);
  assert.equal(program.landedPlusTooling, null);
  assert.equal(program.totalStarts, null);
  assert.equal(program.mixStatus, 'missing');
});

test('yield is explicit production planning and never double-counts monetary scrap or quoted finished costs', () => {
  const model = zeroScenario(blankModel(), 25);
  model.costs[25].body = '20';
  model.costs[25].scrap = '3';
  model.sharedTooling = '0';
  model.mix[25] = {light:'15', dark:'10'};
  model.yieldAssumptions[25] = {light:'90', dark:'80', basis:'Illustrative estimate, not pilot evidence'};
  const program = calculateProgram(model,25);
  assert.equal(program.yields.light.starts, 17);
  assert.equal(program.yields.dark.starts, 13);
  assert.equal(program.totalStarts, 30);
  assert.equal(program.totals.cogs, 575);
  assert.equal(program.yieldPlanComplete, true);
  model.yieldAssumptions[25].dark = '';
  assert.equal(calculateProgram(model,25).totalStarts, null);
  assert.equal(calculateProgram(model,25).totals.cogs, 575);
});

test('invalid mix, tooling or yield never produce a misleading complete estimate', () => {
  const model = zeroScenario(blankModel(), 25);
  model.sharedTooling = '0';
  for (const mix of [{light:'24',dark:'0'}, {light:'1.5',dark:'23.5'}, {light:'-1',dark:'26'}, {light:'26',dark:'0'}]) {
    model.mix[25] = mix;
    const result = calculateProgram(model,25);
    assert.equal(result.mixStatus, 'invalid');
    assert.equal(result.totals.cogs, null);
    assert.equal(result.totalStarts, null);
  }
  model.mix[25] = {light:'25',dark:'0'};
  for (const yieldValue of ['', '0', '-1', '101', 'Infinity', 'abc']) {
    model.yieldAssumptions[25].light = yieldValue;
    assert.equal(calculateProgram(model,25).totalStarts, null);
  }
  model.yieldAssumptions[25].light = '100';
  assert.equal(calculateProgram(model,25).totalStarts, 25);
  for (const tooling of ['', '-1', '1e999']) {
    model.sharedTooling = tooling;
    assert.equal(calculateProgram(model,25).landedPlusTooling, null);
    assert.equal(calculateProgram(model,25).complete, false);
  }
  assert.throws(() => calculate(model,25,'male'), RangeError);
});
