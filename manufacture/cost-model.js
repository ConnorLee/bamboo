/* One HALO program: shared geometry/tooling, Light and Dark cosmetic finishes.
 * All old item IDs remain stable. Blank/null/undefined means unknown, never zero.
 * Component prices are per finished kit (quantity-12 items are per component).
 * Dark adds PVD and packaging premiums to the shared preparation/packaging cost.
 * Shared tooling is one program amount; amortization is separate from variable
 * COGS and divided by the selected TOTAL Light + Dark saleable batch, once.
 * Yield is an explicit planning assumption: it estimates production starts and
 * never silently multiplies already-quoted finished-unit prices or monetary scrap.
 */
(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.HaloManufactureCosts = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  var SCENARIOS = Object.freeze([25, 100, 500, 1000]);
  var FINISHES = Object.freeze(['light', 'dark']);
  var ITEMS = Object.freeze([
    { id: 'body', label: 'Shared 316L rigid bracelet chassis', quantity: 1, group: 'cogs' },
    { id: 'clasp', label: 'Shared clasp / underside adjustment', quantity: 1, group: 'cogs' },
    { id: 'machining', label: 'Machining (if excluded from chassis)', quantity: 1, group: 'cogs' },
    { id: 'finishing', label: 'Brushing / natural steel finish preparation', quantity: 1, group: 'cogs' },
    { id: 'sockets', label: 'Socket / retention interface', quantity: 12, group: 'cogs' },
    { id: 'carrier', label: 'Stone carrier', quantity: 12, group: 'cogs' },
    { id: 'gemstone', label: 'Gemstone', quantity: 12, group: 'cogs' },
    { id: 'nfc', label: 'Passive NFC inlay', quantity: 12, group: 'cogs' },
    { id: 'ferrite', label: 'Ferrite / RF isolation allowance', quantity: 12, group: 'cogs' },
    { id: 'moduleAssembly', label: 'Stone / NFC module assembly', quantity: 12, group: 'cogs' },
    { id: 'blankFiller', label: 'Blank filler (12-piece supply allowance)', quantity: 12, group: 'cogs' },
    { id: 'assembly', label: 'Final bracelet / kit assembly', quantity: 1, group: 'cogs' },
    { id: 'engraving', label: 'Engraving', quantity: 1, group: 'cogs' },
    { id: 'masterPackaging', label: 'Shared master box, tray & fitted inserts', quantity: 1, group: 'cogs' },
    { id: 'milestonePackaging', label: 'Shared individual milestone packaging', quantity: 12, group: 'cogs' },
    { id: 'ritualCard', label: 'Milestone meaning card', quantity: 12, group: 'cogs' },
    { id: 'blackPvd', label: 'Dark black PVD premium', quantity: 1, group: 'cogs', finish: 'dark' },
    { id: 'darkPackaging', label: 'Dark charcoal packaging premium / kit', quantity: 1, group: 'cogs', finish: 'dark' },
    { id: 'fulfillment', label: 'Fulfillment / outbound delivery', quantity: 1, group: 'selling' },
    { id: 'shipping', label: 'Shipping / inbound freight', quantity: 1, group: 'landed' },
    { id: 'qc', label: 'Quality assurance', quantity: 1, group: 'cogs' },
    { id: 'scrap', label: 'Monetary scrap / replacement allowance', quantity: 1, group: 'cogs' },
    { id: 'duties', label: 'Duties / import', quantity: 1, group: 'landed' },
    { id: 'paymentFees', label: 'Payment fees', quantity: 1, group: 'selling' }
  ].map(function (item) { return Object.freeze(item); }));

  function blankModel() {
    var costs = {}, mix = {}, yieldAssumptions = {};
    SCENARIOS.forEach(function (scenario) {
      costs[scenario] = {};
      ITEMS.forEach(function (item) { costs[scenario][item.id] = ''; });
      mix[scenario] = { light: '', dark: '' };
      yieldAssumptions[scenario] = { light: '', dark: '', basis: '' };
    });
    return { currency: 'USD', costs: costs, retail: ['', '', ''], sharedTooling: '', toolingBasis: '', mix: mix, yieldAssumptions: yieldAssumptions };
  }
  function amount(input) {
    if (input === null || input === undefined || (typeof input === 'string' && input.trim() === '')) return { value: null, status: 'missing' };
    if (typeof input !== 'number' && typeof input !== 'string') return { value: null, status: 'invalid' };
    if (typeof input === 'string' && !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(input.trim())) return { value: null, status: 'invalid' };
    var value = Number(input);
    if (!Number.isFinite(value) || value < 0) return { value: null, status: 'invalid' };
    return { value: value, status: 'valid' };
  }
  function finite(value) { return Number.isFinite(value) ? value : null; }
  function sum(rows) {
    if (rows.some(function (row) { return row.lineTotal === null; })) return null;
    return finite(rows.reduce(function (total, row) { return total + row.lineTotal; }, 0));
  }
  function scale(value, quantity) { return quantity === 0 ? 0 : value === null || quantity === null ? null : finite(value * quantity); }
  function add(a, b) { return a === null || b === null ? null : finite(a + b); }
  function selectedQuantity(scenario) {
    var quantity = Number(scenario);
    if (SCENARIOS.indexOf(quantity) === -1) throw new RangeError('Unknown manufacture scenario: ' + scenario);
    return quantity;
  }
  function calculate(model, scenario, finish) {
    var quantity = selectedQuantity(scenario);
    finish = finish || 'light';
    if (FINISHES.indexOf(finish) === -1) throw new RangeError('Unknown HALO finish: ' + finish);
    model = model && typeof model === 'object' ? model : {};
    var costs = model.costs && model.costs[quantity] || {};
    var items = ITEMS.map(function (item) {
      var input = costs[item.id], parsed = amount(input);
      var applicable = !item.finish || item.finish === finish;
      var lineTotal = applicable && parsed.value !== null ? finite(parsed.value * item.quantity) : null;
      return {
        id: item.id, label: item.label, quantity: item.quantity, group: item.group, applicable: applicable,
        input: input === undefined ? '' : input, unitCost: parsed.value, lineTotal: lineTotal,
        status: !applicable ? 'not-applicable' : parsed.status === 'valid' && lineTotal === null ? 'invalid' : parsed.status
      };
    });
    var active = items.filter(function (item) { return item.applicable; });
    var missing = active.filter(function (item) { return item.status === 'missing'; }).map(function (item) { return item.id; });
    var invalid = active.filter(function (item) { return item.status === 'invalid'; }).map(function (item) { return item.id; });
    var cogs = sum(active.filter(function (item) { return item.group === 'cogs'; }));
    var landed = sum(active.filter(function (item) { return item.group !== 'selling'; }));
    var selling = sum(active.filter(function (item) { return item.group === 'selling'; }));
    var tooling = amount(model.sharedTooling);
    var toolingPerKit = tooling.value === null ? null : finite(tooling.value / quantity);
    var amortizedLanded = add(landed, toolingPerKit);
    var retailInputs = Array.isArray(model.retail) ? model.retail : ['', '', ''];
    var margins = retailInputs.map(function (input) {
      var parsed = amount(input), retail = parsed.value;
      var grossProfit = retail === null || landed === null ? null : finite(retail - landed);
      var contribution = grossProfit === null || selling === null ? null : finite(grossProfit - selling);
      return {
        input: input, retail: retail, status: parsed.status, grossProfit: grossProfit,
        grossMargin: retail === null || retail === 0 || grossProfit === null ? null : finite(grossProfit / retail * 100),
        contribution: contribution,
        contributionMargin: retail === null || retail === 0 || contribution === null ? null : finite(contribution / retail * 100)
      };
    });
    return {
      scenario: quantity, quantity: quantity, finish: finish,
      complete: missing.length === 0 && invalid.length === 0 && cogs !== null && landed !== null && selling !== null,
      missing: missing, invalid: invalid, items: items, cogs: cogs, landed: landed, selling: selling,
      tooling: { total: tooling.value, status: tooling.status, perKit: toolingPerKit }, amortizedLanded: amortizedLanded,
      // Homogeneous comparison only. calculateProgram is authoritative for a mixed batch.
      batch: { cogs: scale(cogs, quantity), landed: scale(landed, quantity), selling: scale(selling, quantity) }, margins: margins
    };
  }
  function calculateProgram(model, scenario) {
    var quantity = selectedQuantity(scenario);
    model = model && typeof model === 'object' ? model : {};
    var mix = model.mix && model.mix[quantity] || {}, counts = {}, mixStatus = 'valid';
    FINISHES.forEach(function (finish) {
      var parsed = amount(mix[finish]);
      counts[finish] = parsed.value;
      if (parsed.status === 'invalid' || (parsed.value !== null && (!Number.isInteger(parsed.value) || parsed.value > quantity))) mixStatus = 'invalid';
      else if (parsed.status === 'missing' && mixStatus !== 'invalid') mixStatus = 'missing';
    });
    if (mixStatus === 'valid' && counts.light + counts.dark !== quantity) mixStatus = 'invalid';
    var light = calculate(model, quantity, 'light'), dark = calculate(model, quantity, 'dark');
    var totals = {};
    ['cogs', 'landed', 'selling'].forEach(function (group) {
      totals[group] = mixStatus !== 'valid' ? null : add(scale(light[group], counts.light), scale(dark[group], counts.dark));
    });
    var yieldValues = model.yieldAssumptions && model.yieldAssumptions[quantity] || {}, yields = {};
    FINISHES.forEach(function (finish) {
      var parsed = amount(yieldValues[finish]);
      if (parsed.status === 'valid' && (parsed.value === 0 || parsed.value > 100)) parsed = { value: null, status: 'invalid' };
      var starts = mixStatus !== 'valid' ? null : counts[finish] === 0 ? 0 : parsed.value === null ? null : finite(Math.ceil(counts[finish] / (parsed.value / 100)));
      yields[finish] = { percent: parsed.value, status: parsed.status, starts: starts };
    });
    var totalStarts = add(yields.light.starts, yields.dark.starts);
    return {
      quantity: quantity, counts: counts, mixStatus: mixStatus, light: light, dark: dark, totals: totals,
      sharedTooling: light.tooling.total, toolingPerKit: light.tooling.perKit,
      landedPlusTooling: add(totals.landed, light.tooling.total),
      // No duplicated tooling and no hidden yield multiplier; yields plan starts only.
      yields: yields, totalStarts: totalStarts,
      complete: mixStatus === 'valid' && totals.cogs !== null && totals.landed !== null && totals.selling !== null && light.tooling.total !== null,
      yieldPlanComplete: totalStarts !== null
    };
  }
  return Object.freeze({ ITEMS: ITEMS, SCENARIOS: SCENARIOS, FINISHES: FINISHES, blankModel: blankModel, calculate: calculate, calculateProgram: calculateProgram });
});
