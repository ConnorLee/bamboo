const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {stateForIndex} = require('../website/bracelet.js');

const assetDirectory = path.join(__dirname, '../website/assets/bracelet-year');
const manifest = JSON.parse(fs.readFileSync(path.join(assetDirectory, 'render-manifest.json'), 'utf8'));
const context = {window: {}};
for (const file of ['halo-i-catalog.js', 'milestones.js']) {
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../website', file), 'utf8'), context);
}
const catalog = JSON.parse(JSON.stringify(context.window.HALO_MILESTONES));
const ranks = Array.from({length: 12}, (_, index) => index - 6);
const sortedPositions = state => [...state.positions].sort((a, b) => a.rank - b.rank);

test('all Blender render states match the runtime physical stone arrangement', () => {
  assert.equal(manifest.source, 'HALO_Bracelet_Master.blend');
  assert.equal(manifest.positions, 12);
  assert.equal(manifest.receiverCount, 12);
  assert.equal(manifest.blindPocketCount, 12);
  assert.equal(manifest.removedIntentionReceiver, true);
  assert.match(manifest.sourceSha256, /^[a-f0-9]{64}$/);
  assert.equal(manifest.states.length, 24);
  assert.equal(new Set(manifest.states.map(state => `${state.finish}:${state.month}`)).size, 24);
  for (const finish of ['Light', 'Dark']) {
    for (let month = 0; month < 12; month++) {
      const rendered = manifest.states.find(state => state.finish === finish && state.month === month);
      assert.ok(rendered, `${finish} month ${month} was rendered`);
      const positions = sortedPositions(rendered);
      assert.deepEqual(positions.map(position => position.rank), ranks);
      assert.equal(new Set(positions.map(position => position.socket)).size, 12);
      assert.equal(positions.filter(position => position.rank < 0).length, 6);
      assert.equal(positions.filter(position => position.rank > 0).length, 5);
      assert.deepEqual(positions.map(position => ({
        index: position.rank + 6,
        role: position.role,
        stone: position.month,
        side: position.rank < 0 ? 'left' : position.rank > 0 ? 'right' : 'center'
      })), stateForIndex(month), `${finish} index ${month} agrees with the scene description`);
      assert.equal(rendered.current, catalog[month].key);
      assert.equal(rendered.installed, month + 1);
      assert.equal(rendered.blanks, 11 - month);
      assert.equal(positions.filter(position => position.installed).length, month + 1);
      for (const position of positions) {
        assert.equal(position.installed, position.month !== null);
        assert.equal(position.mineral, position.month === null ? null : catalog[position.month].key);
        assert.doesNotMatch(position.socket, /clasp|hinge|closure|intention/i);
      }
    }
  }
});

test('both finishes share the same camera and physical seat positions across every month', () => {
  assert.equal(manifest.width, 1000);
  assert.equal(manifest.height, 875);
  const reference = sortedPositions(manifest.states[0]).map(({rank, socket, projected}) => ({rank, socket, projected}));
  for (const state of manifest.states) {
    const positions = sortedPositions(state);
    assert.deepEqual(positions.map(({rank, socket, projected}) => ({rank, socket, projected})), reference);
    const current = positions.find(position => position.role === 'current');
    assert.equal(current.rank, 0);
    assert.equal(current.projected[0], .5, 'current seat is horizontally centered');
    assert.equal(current.projected[1], Math.min(...positions.map(position => position.projected[1])),
      'current seat remains at the top of the stone arc');
    for (const position of positions) {
      assert.equal(position.projected.length, 2);
      assert.ok(position.projected.every(value => Number.isFinite(value) && value >= 0 && value <= 1));
    }
  }
  // Projected centers validate camera consistency, not visibility through the band.
});

test('all native layers, twelve material cards and year progression composites are packed', () => {
  const required = [];
  for (const finish of ['light', 'dark']) {
    for (let month = 0; month < 12; month++) required.push(`base-${finish}-${String(month).padStart(2, '0')}.webp`);
    for (let count = 0; count <= 12; count++) required.push(`progress-${finish}-${String(count).padStart(2, '0')}.webp`);
    required.push(`empty-${finish}.webp`);
  }
  for (const kind of ['stone', 'gem']) {
    for (let month = 0; month < 12; month++) required.push(`${kind}-${String(month).padStart(2, '0')}.webp`);
  }
  for (let count = 0; count <= 12; count++) required.push(`progress-${String(count).padStart(2, '0')}.webp`);
  required.push('empty.webp');
  assert.equal(manifest.assets.length, 90);
  assert.deepEqual(manifest.assets.map(asset => asset.file).sort(), required.sort());
  let totalBytes = 0;
  for (const asset of manifest.assets) {
    const bytes = fs.readFileSync(path.join(assetDirectory, asset.file));
    assert.equal(bytes.toString('ascii', 0, 4), 'RIFF', asset.file);
    assert.equal(bytes.toString('ascii', 8, 12), 'WEBP', asset.file);
    assert.equal(bytes.length, asset.bytes, `${asset.file} recorded size`);
    assert.ok(bytes.length > 100, `${asset.file} contains image data`);
    assert.equal(bytes.toString('ascii', 12, 16), 'VP8X', asset.file);
    assert.ok(bytes[20] & 0x10, `${asset.file} retains transparency`);
    assert.equal(bytes.readUIntLE(24, 3) + 1, asset.file.startsWith('gem-') ? 900 : 1000);
    assert.equal(bytes.readUIntLE(27, 3) + 1, asset.file.startsWith('gem-') ? 750 : 875);
    totalBytes += bytes.length;
  }
  assert.equal(manifest.totalWebBytes, totalBytes);
  for (const state of manifest.states) {
    const suffix = String(state.month).padStart(2, '0');
    assert.equal(state.base, `base-${state.finish.toLowerCase()}-${suffix}.webp`);
    assert.equal(state.stone, `stone-${suffix}.webp`);
    assert.ok(required.includes(state.base) && required.includes(state.stone));
  }
});

test('default progression aliases are exact Light copies and include a genuine empty state', () => {
  for (let count = 0; count <= 12; count++) {
    const suffix = String(count).padStart(2, '0');
    assert.deepEqual(fs.readFileSync(path.join(assetDirectory, `progress-${suffix}.webp`)),
      fs.readFileSync(path.join(assetDirectory, `progress-light-${suffix}.webp`)));
  }
  assert.deepEqual(fs.readFileSync(path.join(assetDirectory, 'empty.webp')),
    fs.readFileSync(path.join(assetDirectory, 'progress-00.webp')));
  assert.notDeepEqual(fs.readFileSync(path.join(assetDirectory, 'progress-00.webp')),
    fs.readFileSync(path.join(assetDirectory, 'progress-01.webp')));
});
