/* Local-only founder workspace. User-entered values are always rendered as text. */
(() => {
  'use strict';
  const D = window.HaloManufactureData;
  const C = window.HaloManufactureCosts;
  const $ = selector => document.querySelector(selector);
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const freshRow = type => Object.fromEntries(D[type].map(([key,, choices]) => [key, choices ? choices[0] : '']));
  const fresh = () => ({version:1, requirementRevision:D.revision, legacyReviewRequired:false, dimensions:{}, protocol:{}, checks:{}, rf:Array.from({length:3}, () => freshRow('rf')), quotes:Array.from({length:3}, () => freshRow('quotes')), decisions:Array.from({length:3}, () => freshRow('decisions')), model:C.blankModel()});
  let state = fresh(), scenario = 25, finish = 'light', writesBlocked = false, toastTimer;
  const own = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
  const record = value => value && typeof value === 'object' && !Array.isArray(value);
  const scalar = value => typeof value === 'string' && value.length <= 20000;

  function normalize(input) {
    if (!record(input) || input.version !== 1) throw new Error('This is not a compatible Halo manufacture backup (version 1).');
    const result = fresh();
    result.legacyReviewRequired = input.requirementRevision !== D.revision || input.legacyReviewRequired === true;
    // Preserve historical keys too: changed checklists/criteria must not erase evidence.
    // Object.fromEntries treats every imported key as data, including __proto__.
    const values = (source, label, boolean = false) => {
      if (!record(source) || Object.keys(source).length > 5000) throw new Error('Invalid ' + label + '.');
      return Object.fromEntries(Object.entries(source).map(([key, value]) => {
        if (key.length > 200 || (boolean ? typeof value !== 'boolean' : !scalar(value))) throw new Error('Invalid ' + label + ' value.');
        return [key, value];
      }));
    };
    for (const group of ['dimensions', 'protocol', 'checks']) result[group] = values(input[group], group, group === 'checks');
    for (const type of ['rf', 'quotes', 'decisions']) {
      if (type === 'decisions' && !own(input, type)) continue;
      if (!Array.isArray(input[type]) || input[type].length > 500) throw new Error('The backup must contain at most 500 ' + type + ' rows.');
      result[type] = input[type].map(row => {
        const historical = values(row, type);
        const normalized = {...historical};
        D[type].forEach(([key,,choices]) => {
          let value = own(row, key) ? row[key] : (choices ? choices[0] : '');
          if (type === 'rf' && key === 'requirement' && !own(row, key)) value = 'Legacy — re-review required';
          if (!scalar(value) || (choices && !choices.includes(value))) throw new Error('Invalid value in ' + type + '.');
          Object.defineProperty(normalized, key, {value, writable:true, enumerable:true, configurable:true});
        });
        return normalized;
      });
    }
    const model = input.model;
    if (!record(model) || !record(model.costs) || !/^[A-Z]{3}$/.test(model.currency) || !Array.isArray(model.retail) || model.retail.length !== 3) throw new Error('Invalid cost model.');
    result.model.currency = model.currency;
    result.model.retail = model.retail.map(value => {if (!scalar(value)) throw new Error('Invalid retail value.'); return value;});
    for (const key of ['sharedTooling', 'toolingBasis']) {
      const value = own(model, key) ? model[key] : '';
      if (!scalar(value)) throw new Error('Invalid tooling value.');
      result.model[key] = value;
    }
    for (const key of ['mix', 'yieldAssumptions']) if (own(model, key) && !record(model[key])) throw new Error('Invalid ' + key + '.');
    C.SCENARIOS.forEach(quantity => {
      const historical = values(model.costs[quantity], 'cost scenario');
      result.model.costs[quantity] = {...historical};
      C.ITEMS.forEach(item => {
        // New lines migrate older v1 backups to unknown, never to a free cost.
        if (!own(historical, item.id)) result.model.costs[quantity][item.id] = '';
      });
      for (const group of ['mix', 'yieldAssumptions']) {
        if (model[group] && own(model[group], quantity)) {
          const supplied = values(model[group][quantity], group);
          result.model[group][quantity] = {...result.model[group][quantity], ...supplied};
        }
      }
    });
    return result;
  }
  function toast(message) {
    $('#toast').textContent = message; $('#toast').hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(() => { $('#toast').hidden = true; }, 5000);
  }
  function notice(message) { $('#storage-notice').textContent = message; $('#storage-notice').hidden = false; }
  function save() {
    if (writesBlocked) { $('#save-status').textContent = 'Backup required'; return; }
    try {
      localStorage.setItem(D.storageKey, JSON.stringify(state));
      $('#save-status').textContent = 'Saved on this browser';
    } catch {
      $('#save-status').textContent = 'Not saved — export backup';
      notice('Browser storage is unavailable or full. Your edits remain in this open page. Export a backup before closing it.');
    }
  }
  function inputField(group, [id, label, hint]) {
    const check = group === 'dimensions' ? `<input type="checkbox" data-check="cad-${id}" aria-label="Reviewed: ${escape(label)}" ${state.checks['cad-'+id] ? 'checked' : ''}>` : '';
    return `<div class="field"><span class="dimension-label">${check}<label for="${group}-${id}">${escape(label)}</label></span><input id="${group}-${id}" type="text" data-${group === 'dimensions' ? 'dimension' : 'protocol'}="${id}" value="${escape(state[group][id])}" placeholder="${escape(hint)}" aria-label="${escape(label)}" maxlength="2000"></div>`;
  }
  function renderFields() {
    $('#cad-fields').innerHTML = `<p class="empty-help">Design targets are not validated dimensions. Record units, tolerances, evidence status and CAD revision. Historical entries stay intact; re-review them against the rigid chassis, two-size strategy and installed NFC readability requirement.</p><h3>Shared Light / Dark chassis, clasp & removable interface</h3><div class="fields-grid">${D.dimensions.filter(field => field[3] !== 'packaging').map(field => inputField('dimensions',field)).join('')}</div><h3 class="field-group-title">Shared packaging geometry</h3><p class="small">One presentation system and exactly 12 milestone boxes, with a protected bracelet position and Month 01 accessible first. Light / Dark share dielines and content. Reference dimensions conflict; record corrected geometry and evidence before review.</p><div class="fields-grid">${D.dimensions.filter(field => field[3] === 'packaging').map(field => inputField('dimensions',field)).join('')}</div>`;
    let protocol = $('#protocol-fields');
    if (!protocol) { protocol = document.createElement('div'); protocol.id = 'protocol-fields'; $('#rf-table').before(protocol); }
    protocol.className = 'protocol';
    protocol.innerHTML = `<h3>Define the test before recording a pass</h3><p class="small">REQUIRES PROTOTYPE. Set cycles, loads, read attempts and acceptance criteria per revision; no validated thresholds are supplied. Test loose → partially integrated → final installed → installed on wrist → removed/post-cycle. Log phones, orientation, identity, distance and repeatability. An old suppression pass does not establish installed readability.</p><div class="fields-grid">${D.protocol.filter(field => field[3] !== 'legacy').map(field => inputField('protocol',field)).join('')}</div><details><summary>Historical installed-state criterion — retained for audit</summary><p class="small">Superseded by the new installed-readability criterion. This saved field may describe a previous suppression/detuning target; it cannot approve the current requirement.</p><div class="fields-grid">${D.protocol.filter(field => field[3] === 'legacy').map(field => inputField('protocol',field)).join('')}</div></details>`;
  }
  function renderTable(type) {
    const label = {rf:'RF test matrix',quotes:'Supplier quote tracker',decisions:'Decision log'}[type];
    const headers = D[type].map(([,label]) => `<th scope="col">${escape(label)}</th>`).join('');
    const rows = state[type].map((row,index) => `<tr>${D[type].map(([key,label,choices]) => {
      const attributes = `data-table="${type}" data-row="${index}" data-key="${key}" aria-label="${escape(label)}, row ${index+1}"`;
      const control = choices ? `<select ${attributes}>${choices.map(value => `<option ${row[key] === value ? 'selected' : ''}>${escape(value)}</option>`).join('')}</select>` : `<textarea ${attributes} maxlength="20000" placeholder="${key === 'prototype' ? 'Sample / revision' : key === 'supplier' ? 'Supplier name' : '—'}" rows="2">${escape(row[key])}</textarea>`;
      return `<td>${control}</td>`;
    }).join('')}</tr>`).join('');
    const help = type === 'rf' ? 'Record successful reads / attempts, exact assembly stage, phone, distance and orientation. Pass / fail applies only to the stated requirement and attached evidence. Legacy rows require a new installed-readability test.' : type === 'quotes' ? 'One shared program; record both chassis sizes, finish mix and incremental Dark premiums. Include currency, Incoterm, quote date / validity and inclusions. Quotes do not automatically populate the BOM; a prior Qualified status is not validation of this revision.' : 'Record the decision, unresolved alternatives, owner, revision and proof needed. Selecting an evidence status does not substitute for linked supplier or physical evidence.';
    const target = {rf:'#rf-table',quotes:'#quote-table',decisions:'#decision-log'}[type];
    if (!$(target)) return;
    $(target).innerHTML = `<p class="empty-help">${state[type].length} rows · Scroll horizontally for all ${D[type].length} columns. Each cell is editable. ${help}</p>${state.legacyReviewRequired && type !== 'decisions' ? '<p class="small">Historical workspace imported: prior dimensions, checkmarks, supplier qualifications and test results are preserved for audit. Re-review against this hardware revision; old installed-state results are not proof of installed readability.</p>' : ''}<div class="table-wrap" tabindex="0" role="region" aria-label="${label}, horizontally scrollable"><table class="editable-table"><caption class="sr-only">${label}</caption><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table></div>`;
  }
  const money = value => value === null ? 'Incomplete' : new Intl.NumberFormat('en-US', {style:'currency',currency:state.model.currency,maximumFractionDigits:2}).format(value);
  const percentage = value => value === null ? '—' : value.toFixed(1) + '%';
  function renderCosts() {
    const costField = (label, attribute, value, hint, numeric = true) => `<label class="field"><span>${label}</span><input type="${numeric ? 'number' : 'text'}" ${numeric ? 'min="0" step="any"' : 'maxlength="20000"'} ${attribute} value="${escape(value)}" placeholder="${hint}"></label>`;
    $('#cost-model').innerHTML = `
      <div class="cost-controls"><div><p class="eyebrow">One program / total saleable batch</p><div class="cost-scenarios" aria-label="Cost scenario">${C.SCENARIOS.map(q => `<button type="button" data-scenario="${q}" aria-pressed="${q === scenario}">${q.toLocaleString()} units</button>`).join('')}</div></div><label class="field"><span>Currency (label only)</span><select id="cost-currency" aria-label="BOM currency">${['USD','EUR','GBP','CNY','CAD','AUD','CHF','JPY',state.model.currency].filter((v,i,a) => a.indexOf(v) === i).map(code => `<option ${code === state.model.currency ? 'selected' : ''}>${code}</option>`).join('')}</select></label></div>
      <p class="empty-help">DESIGN INTENT / quote workspace. One geometry and mechanism, with Light / Dark cosmetic costs. Enter prices per finished component; quantities of 12 are applied automatically. Blank = unknown; enter 0 only when excluded or included elsewhere with evidence. Currency changes do not convert amounts.</p>
      <h3>Shared one-time tooling</h3><div class="fields-grid">${costField('Total shared program tooling ('+state.model.currency+')', 'data-model-field="sharedTooling"', state.model.sharedTooling, 'TBD - one program amount')}${costField('Tooling quote / scope / exclusions', 'data-model-field="toolingBasis"', state.model.toolingBasis, 'Both sizes + shared dielines; supplier evidence / revision', false)}</div>
      <p class="small">Tooling is stored once across all scenarios. Amortization divides it by the selected total saleable batch, across both finishes. Development and sample spend remain separate in quotes. A revised tooling scope needs a revised quote.</p>
      <h3>Shared unit costs &amp; finish premiums</h3><div class="cost-scenarios" aria-label="Finish cost comparison">${C.FINISHES.map(value => `<button type="button" data-finish="${value}" aria-pressed="${value === finish}">${value === 'light' ? 'Light' : 'Dark'} totals</button>`).join('')}</div>
      <div class="table-wrap" tabindex="0" role="region" aria-label="Bill of materials"><table class="bom-table"><caption class="sr-only">Shared BOM and Dark premiums for ${scenario} total units</caption><thead><tr><th scope="col">Component / operation</th><th scope="col">Qty / kit</th><th scope="col">Cost each</th><th scope="col">Per ${finish === 'light' ? 'Light' : 'Dark'} kit</th></tr></thead><tbody>${C.ITEMS.map(item => `<tr data-group="${item.group}"><td>${item.label}<div class="field-hint">${item.finish ? 'Dark only - incremental over shared baseline' : item.group === 'cogs' ? 'Shared COGS' : item.group === 'landed' ? 'Shared landed addition' : 'Shared selling expense'}</div></td><td>&times;${item.quantity}</td><td><input type="number" min="0" step="any" inputmode="decimal" data-cost="${item.id}" value="${escape(state.model.costs[scenario][item.id])}" placeholder="TBD" aria-label="${item.label} cost per component"></td><td data-line-total="${item.id}">-</td></tr>`).join('')}</tbody></table></div><div id="cost-results"></div>
      <h3>Mixed batch &amp; explicit yield plan</h3><p class="small">Enter saleable Light + Dark quantities totaling ${scenario.toLocaleString()}. Confirm S/M + M/L size mix in the supplier quote. Yield estimates production starts only; finished-unit costs already include the quoted basis, with monetary scrap entered separately. No yield or finish mix is assumed.</p><div class="fields-grid">${C.FINISHES.map(value => costField((value === 'light' ? 'Light' : 'Dark')+' saleable kits', 'data-mix="'+value+'"', state.model.mix[scenario][value], 'TBD') + costField((value === 'light' ? 'Light' : 'Dark')+' expected usable yield (%)', 'data-yield="'+value+'"', state.model.yieldAssumptions[scenario][value], 'TBD - greater than 0, up to 100')).join('')}<label class="field"><span>Yield / scrap basis &amp; evidence</span><textarea rows="2" maxlength="20000" data-yield="basis" placeholder="Assumption or pilot evidence; process scope; confirm no duplicated allowance">${escape(state.model.yieldAssumptions[scenario].basis)}</textarea></label></div><div id="program-results"></div>
      <h3>Retail scenarios / ${finish === 'light' ? 'Light' : 'Dark'}</h3><p class="small">Tax-exclusive retail per complete 12-stone kit. No selling price is assumed. These variable-cost margins exclude shared tooling; the tooling-adjusted landed cost is shown separately.</p><div class="retail-grid">${state.model.retail.map((value,index) => `<label class="field"><span>Retail option ${index+1} (${state.model.currency})</span><input type="number" min="0" step="any" inputmode="decimal" data-retail="${index}" value="${escape(value)}" placeholder="Enter retail price"></label>`).join('')}</div><div id="margin-results"></div>
      <details><summary>Calculation boundaries &amp; double-counting checks</summary><p>COGS = shared chassis, clasp, machining/preparation, 12 sockets, 12 complete stone/module sets, packaging, final assembly, QA and monetary scrap. Dark adds only its PVD and charcoal packaging premiums. Landed = COGS + inbound freight + duties. Selling = fulfillment/outbound delivery + payment fees. Gross margin uses landed cost; contribution also deducts selling costs.</p><p>Prices are amounts per finished unit, not percentages. Shared brushing/preparation is retained under the existing finishing field and needs quote review. If chassis pricing includes sockets, machining or finishing, enter 0 on the separate included line and record that inclusion. If the PVD quote includes preparation, separate its incremental premium before entry. Charcoal packaging uses the same dieline; enter 0 for its premium only when the supplier confirms no price difference. Do not duplicate shared tooling for two finishes or two size labels. Shared unit entries must use the quoted S/M + M/L mix for the selected batch (or a documented weighted price); the two chassis sizes are not assumed to cost the same. Confirm minimum quantities by size and finish. Include any extra Dark rework/scrap in its documented incremental premium, without duplicating the shared allowance.</p><p>Quantities of 12 apply to sockets, carriers, gemstones, NFC, RF isolation allowance, module assembly, milestone boxes, cards and the legacy 12-piece filler supply allowance. Eleven blanks remain visible with Month 01 installed; whether a twelfth spare/starting blank is supplied remains an explicit quote assumption. Enter 0 for a rejected optional item only after recording that decision. Exactly 12 milestone boxes are included, with one presentation system and bracelet accommodation. Correct conflicting reference dimensions before quoting.</p><p>Yield affects estimated starts (ceiling of saleable kits divided by usable-yield fraction), not the entered cost arithmetic. Confirm whether quoted unit prices and scrap already account for attrition. An unknown yield leaves the production-start plan incomplete. Mixed-batch landed spend includes shared tooling once; independent scenario comparisons are alternatives, not additive orders. Sampling/development and taxes not explicitly entered remain outside this estimate.</p></details>`;
    updateCosts();
  }
  function updateCosts() {
    const result = C.calculate(state.model, scenario, finish);
    const program = C.calculateProgram(state.model, scenario);
    result.items.forEach(item => {
      $(`[data-line-total="${item.id}"]`).textContent = !item.applicable ? 'Dark only' : item.lineTotal === null ? (item.status === 'invalid' ? 'Invalid amount' : '\u2014') : money(item.lineTotal);
      const inputResult = item.applicable ? item : program.dark.items.find(row => row.id === item.id);
      $(`[data-cost="${item.id}"]`).setAttribute('aria-invalid', inputResult.status === 'invalid');
    });
    $('[data-model-field="sharedTooling"]').setAttribute('aria-invalid', result.tooling.status === 'invalid');
    C.FINISHES.forEach(value => {
      $(`[data-mix="${value}"]`).setAttribute('aria-invalid', program.mixStatus === 'invalid');
      $(`[data-yield="${value}"]`).setAttribute('aria-invalid', program.yields[value].status === 'invalid');
    });
    $('#cost-results').innerHTML = `<p class="empty-help">${finish === 'light' ? 'Light' : 'Dark'} variable cost: ${result.complete ? 'all applicable lines entered.' : `${result.missing.length} unknown / ${result.invalid.length} invalid. Required dependencies must be complete.`}</p><div class="cost-summary">${[['COGS / kit',result.cogs,result.batch.cogs],['Landed / kit',result.landed,result.batch.landed],['Selling / kit',result.selling,result.batch.selling]].map(([label,total,batch]) => `<div class="cost-stat"><span>${label}</span><strong>${money(total)}</strong><small>All-${finish} comparison, ${scenario.toLocaleString()} kits: ${money(batch)}</small></div>`).join('')}</div><p class="small">Shared tooling / kit at ${scenario.toLocaleString()} total kits: ${money(result.tooling.perKit)}. ${finish === 'light' ? 'Light' : 'Dark'} landed / kit including separate amortization: ${money(result.amortizedLanded)}. Tooling is excluded from the variable-cost totals above.</p>`;
    const starts = value => value === null ? 'Incomplete' : value.toLocaleString();
    $('#program-results').innerHTML = `<p class="empty-help">${program.mixStatus === 'valid' ? `${program.counts.light} Light + ${program.counts.dark} Dark = ${scenario} saleable kits.` : program.mixStatus === 'invalid' ? `Invalid mix: use whole numbers totaling ${scenario}.` : 'Finish mix unknown - enter both quantities, including explicit zero when absent.'}</p><div class="table-wrap" tabindex="0" role="region" aria-label="Shared program estimate"><table class="margin-table"><thead><tr><th scope="col">Shared program estimate</th><th scope="col">Amount</th></tr></thead><tbody><tr><td>Mixed-batch COGS</td><td>${money(program.totals.cogs)}</td></tr><tr><td>Mixed-batch landed cost</td><td>${money(program.totals.landed)}</td></tr><tr><td>Shared one-time tooling</td><td>${money(program.sharedTooling)}</td></tr><tr><td>Mixed-batch landed + tooling once</td><td>${money(program.landedPlusTooling)}</td></tr><tr><td>Mixed-batch selling expense</td><td>${money(program.totals.selling)}</td></tr><tr><td>Estimated Light / Dark production starts</td><td>${starts(program.yields.light.starts)} / ${starts(program.yields.dark.starts)}</td></tr><tr><td>Total planned starts (yield assumption)</td><td>${starts(program.totalStarts)}</td></tr></tbody></table></div><p class="small">${program.yieldPlanComplete ? 'Production starts reflect entered yield assumptions; validate their basis with pilot evidence.' : 'Yield planning remains incomplete for any nonzero finish without a valid yield. Zero or greater-than-100% yield is invalid.'}</p>`;
    $('#margin-results').innerHTML = `<div class="table-wrap" tabindex="0" role="region" aria-label="Retail margin comparison"><table class="margin-table"><thead><tr><th scope="col">Retail</th><th scope="col">Gross profit</th><th scope="col">Gross margin</th><th scope="col">Contribution</th><th scope="col">Contribution margin</th></tr></thead><tbody>${result.margins.map(row => `<tr><td>${row.retail === null ? 'TBD' : money(row.retail)}</td><td>${money(row.grossProfit)}</td><td>${percentage(row.grossMargin)}</td><td>${money(row.contribution)}</td><td>${percentage(row.contributionMargin)}</td></tr>`).join('')}</tbody></table></div>`;
  }
  function restoreChecks() { document.querySelectorAll('[data-check]').forEach(input => {input.checked = state.checks[input.dataset.check] === true;}); }
  function render() {renderFields();renderTable('rf');renderTable('quotes');renderTable('decisions');renderCosts();restoreChecks();}
  function download(name,content,type) {
    const url = URL.createObjectURL(new Blob([content], {type}));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = name; document.body.append(anchor); anchor.click(); anchor.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function csvCell(value) {
    // Spreadsheet formula injection is possible even when CSV values are quoted.
    let text = String(value ?? '');
    if (/^[\s]*[=+@-]/.test(text) || /^[\t\r\n]/.test(text)) text = "'" + text;
    return '"' + text.replace(/"/g,'""') + '"';
  }
  function exportCSV(type) {
    const lines = [D[type].map(([,label]) => label), ...state[type].map(row => D[type].map(([key]) => row[key]))];
    download(`halo-${type}-${new Date().toISOString().slice(0,10)}.csv`, '\uFEFF'+lines.map(row => row.map(csvCell).join(',')).join('\r\n'), 'text/csv;charset=utf-8');
    toast('CSV exported. Keep the JSON backup to restore the full workspace.');
  }
  // Render fields before validating persisted check IDs (including generated CAD fields).
  render();
  try {
    const saved = localStorage.getItem(D.storageKey);
    if (saved) { state = normalize(JSON.parse(saved)); render(); $('#save-status').textContent = 'Saved workspace restored'; }
  } catch {
    writesBlocked = true; $('#save-status').textContent = 'Backup required';
    notice('Saved data could not be loaded. It has not been overwritten. You can work in this temporary session and export a backup, or import a valid backup to resume saving.');
  }
  document.addEventListener('input', event => {
    const el = event.target;
    if (el.matches('[data-dimension]')) state.dimensions[el.dataset.dimension] = el.value;
    else if (el.matches('[data-protocol]')) state.protocol[el.dataset.protocol] = el.value;
    else if (el.matches('[data-check]')) state.checks[el.dataset.check] = el.checked;
    else if (el.matches('[data-table]')) state[el.dataset.table][Number(el.dataset.row)][el.dataset.key] = el.value;
    else if (el.matches('[data-cost]')) {state.model.costs[scenario][el.dataset.cost] = el.value;updateCosts();}
    else if (el.matches('[data-model-field]')) {state.model[el.dataset.modelField] = el.value;updateCosts();}
    else if (el.matches('[data-mix]')) {state.model.mix[scenario][el.dataset.mix] = el.value;updateCosts();}
    else if (el.matches('[data-yield]')) {state.model.yieldAssumptions[scenario][el.dataset.yield] = el.value;updateCosts();}
    else if (el.matches('[data-retail]')) {state.model.retail[Number(el.dataset.retail)] = el.value;updateCosts();}
    else return;
    save();
  });
  document.addEventListener('change', event => {
    if (event.target.id !== 'cost-currency') return;
    state.model.currency = event.target.value; save(); renderCosts(); toast('Currency label changed. Amounts were not converted.');
  });
  document.addEventListener('click', async event => {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.dataset.add) {
      const type = button.dataset.add;
      if (state[type].length >= 500) {toast('500-row limit reached. Export this workspace before starting another.');return;}
      state[type].push(freshRow(type)); renderTable(type);save();
      $(`[data-table="${type}"][data-row="${state[type].length-1}"]`).focus();
      toast('Blank row added.');
    } else if (button.dataset.csv) exportCSV(button.dataset.csv);
    else if (button.dataset.scenario) {scenario = Number(button.dataset.scenario);renderCosts();$(`[data-scenario="${scenario}"]`).focus();}
    else if (button.dataset.finish) {finish = button.dataset.finish;renderCosts();$(`[data-finish="${finish}"]`).focus();}
    else if (button.dataset.copy) {
      const target = document.getElementById(button.dataset.copy);
      if (!target) return;
      try {await navigator.clipboard.writeText(target.innerText);toast('Copied. Ready to paste into your supplier email.');}
      catch {const range = document.createRange();range.selectNodeContents(target);const selection = window.getSelection();selection.removeAllRanges();selection.addRange(range);toast('Text selected. Press ⌘C or Ctrl+C to copy.');}
    }
  });
  $('#export-workspace').addEventListener('click', () => {
    download(`halo-manufacture-${new Date().toISOString().slice(0,10)}.json`,JSON.stringify(state,null,2)+'\n','application/json');
    toast('Workspace backup exported. Keep it somewhere safe.');
  });
  $('#import-workspace').addEventListener('click', () => $('#import-file').click());
  $('#import-file').addEventListener('change', async event => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      const next = normalize(JSON.parse(await file.text()));
      state = next;writesBlocked = false;$('#storage-notice').hidden = true;render();save();toast('Backup imported. This workspace now contains the imported values.');
    } catch (error) {toast('Import rejected: ' + error.message);}
    event.target.value = '';
  });
  window.addEventListener('storage', event => {
    if (event.key !== D.storageKey && event.key !== null) return;
    writesBlocked = true; $('#save-status').textContent = 'Another tab changed data';
    notice('Another tab changed this workspace. Saving here is paused to prevent overwriting it. Export any edits in this tab, then reload to load the latest saved version.');
  });
  const links = [...document.querySelectorAll('#section-nav a')];
  const sections = links.map(link => document.querySelector(link.getAttribute('href')));
  let scheduled = false;
  function updateActive() {
    scheduled = false;
    const offset = innerWidth <= 800 ? 155 : 120;
    let active = sections[0];
    sections.forEach(section => {if (section.getBoundingClientRect().top <= offset) active = section;});
    links.forEach(link => {
      const selected = link.hash === '#' + active.id;
      if (selected) link.setAttribute('aria-current','true'); else link.removeAttribute('aria-current');
    });
  }
  window.addEventListener('scroll', () => {if (!scheduled) {scheduled = true;requestAnimationFrame(updateActive);}}, {passive:true});
  updateActive();
  let printDetails = [];
  window.addEventListener('beforeprint', () => {printDetails = [...document.querySelectorAll('details:not([open])')];printDetails.forEach(item => {item.open = true;});});
  window.addEventListener('afterprint', () => {printDetails.forEach(item => {item.open = false;});});
  $('#print-workspace').addEventListener('click', () => window.print());
})();
