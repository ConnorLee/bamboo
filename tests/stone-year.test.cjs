const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const website = path.join(__dirname, '../website');
const source = name => fs.readFileSync(path.join(website, name), 'utf8');
const window = {};
const context = vm.createContext({window});
for (const file of ['halo-i-catalog.js', 'milestones.js', 'how-it-works/evolution.js']) {
  vm.runInContext(source(file), context, {filename: file});
}
const plain = value => JSON.parse(JSON.stringify(value));
const catalog = plain(window.HALO_I_CATALOG);
const stages = plain(window.HALO_MILESTONES);
const expected = [
  ['moonstone', 'Moonstone', 'Beginning'],
  ['amethyst', 'Amethyst', 'Stillness'],
  ['turquoise', 'Turquoise', 'Protection'],
  ['rose-quartz', 'Rose Quartz', 'Compassion'],
  ['carnelian', 'Carnelian', 'Courage'],
  ['lapis-lazuli', 'Lapis Lazuli', 'Truth'],
  ['aventurine', 'Green Aventurine', 'Renewal'],
  ['tigers-eye', 'Tiger’s Eye', 'Resolve'],
  ['black-tourmaline', 'Black Tourmaline', 'Grounding'],
  ['citrine', 'Citrine', 'Light'],
  ['quartz', 'Clear Quartz', 'Clarity'],
  ['opal', 'Opal', 'Becoming']
];

test('the canonical first year has twelve distinct chapters, beginning with Moonstone on Day 1', () => {
  assert.equal(catalog.length, 12);
  assert.deepEqual(catalog.map(s => [s.key, s.stone, s.chapter]), expected);
  assert.deepEqual(catalog.map(s => s.month), Array.from({length: 12}, (_, i) => i + 1));
  assert.deepEqual(catalog.map(s => s.compartment), Array.from({length: 12}, (_, i) => String(i + 1).padStart(2, '0')));
  assert.equal(catalog[0].timeLabel, 'Day 1');
  assert.equal(catalog[11].timeLabel, 'Month 12');
  assert.equal(new Set(catalog.map(s => s.key)).size, 12);
  assert.ok(Object.isFrozen(window.HALO_I_CATALOG));
  assert.ok(window.HALO_I_CATALOG.every(Object.isFrozen));
});

test('the explorer adapter preserves catalog data and uses the correct natural-stone image for every chapter', () => {
  assert.equal(stages.length, 12);
  for (const [index, stage] of stages.entries()) {
    assert.equal(stage.index, index);
    for (const [field, value] of Object.entries(catalog[index])) {
      assert.deepEqual(stage[field], value, `${stage.key} preserves ${field}`);
    }
    assert.equal(stage.mineral, `assets/stone-year/${stage.key}.webp`);
    assert.equal(stage.preview, stage.mineral);
    assert.ok(fs.statSync(path.join(website, stage.mineral)).size > 1000);
    assert.ok(stage.environment && stage.environment.glow);
  }
  assert.equal(stages.some(s => s.month === 0 || s.key === 'intention'), false);
});

test('every material detail has readable content and attributed sources with explicit support', () => {
  for (const stone of catalog) {
    for (const field of ['firstReveal', 'meaning', 'material', 'symbolism', 'haloMeaning', 'companion']) {
      assert.ok(typeof stone[field] === 'string' && stone[field].trim().length > 8, `${stone.key}: ${field}`);
    }
    assert.ok(stone.variation.length >= 2, stone.key);
    assert.ok(stone.sources.length >= 1, stone.key);
    for (const reference of stone.sources) {
      const url = new URL(reference.url);
      assert.equal(url.protocol, 'https:');
      assert.ok(reference.label && reference.supports, stone.key);
    }
    assert.deepEqual(stone.sourceURLs, stone.sources.map(s => s.url));
  }
});

test('the same twelve catalog chapters drive companion progression', () => {
  const companion = plain(window.HALO_EVOLUTION.stages);
  assert.equal(companion.length, 12);
  assert.deepEqual(companion.map(s => s.month), catalog.map(s => s.month));
  assert.deepEqual(companion.map(s => s.stone.name), catalog.map(s => s.stone));
  assert.deepEqual(companion.map(s => s.name), catalog.map(s => s.chapter));
});

test('root-page integration loads the detail and collection controllers in dependency order', () => {
  const html = source('index.html');
  const scripts = [...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/g)].map(match => match[1].split('?')[0]);
  const before = (dependency, consumer) => {
    assert.ok(scripts.includes(dependency), `missing ${dependency}`);
    assert.ok(scripts.includes(consumer), `missing ${consumer}`);
    assert.ok(scripts.indexOf(dependency) < scripts.indexOf(consumer), `${dependency} must load before ${consumer}`);
  };
  before('halo-i-catalog.js', 'milestones.js');
  before('milestones.js', 'app.js');
  before('milestones.js', 'stone-year.js');
  before('stone-year.js', 'mineral-collection.js');
  before('mineral-collection.js', 'app.js');
  assert.deepEqual([...html.matchAll(/data-stage="(\d+)"/g)].map(match => Number(match[1])), Array.from({length: 12}, (_, i) => i));
  assert.match(html, /id="stone-detail-dialog"[^>]*aria-labelledby="stone-detail-name"/);
  assert.match(html, /aria-controls="stone-detail-dialog"/);
  assert.match(html, /id="stage-announcement"[^>]*role="status"/);
  assert.match(html, /Stone symbolism reflects traditional and cultural associations/);
});
