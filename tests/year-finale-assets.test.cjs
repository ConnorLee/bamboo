const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const directory = path.resolve(__dirname, '../website/assets/bracelet-year/finale');
const manifest = JSON.parse(fs.readFileSync(path.join(directory, 'manifest.json'), 'utf8'));
const frames = finish => manifest.frames.filter(frame => frame.finish === finish);

test('finale supplies 24 transparent product frames for each finish', () => {
  assert.equal(manifest.frameCount, 24);
  assert.equal(manifest.frames.length, 48);
  const expected = ['Light', 'Dark'].flatMap(finish => Array.from({ length: 24 }, (_, i) => `${finish.toLowerCase()}-${String(i).padStart(2, '0')}.webp`));
  assert.deepEqual(fs.readdirSync(directory).filter(name => name.endsWith('.webp')).sort(), expected.sort());
  assert.equal(new Set(manifest.frames.map(frame => frame.file)).size, 48);
  for (const frame of manifest.frames) {
    const data = fs.readFileSync(path.join(directory, frame.file));
    assert.equal(data.toString('ascii', 0, 4), 'RIFF', frame.file);
    assert.equal(data.toString('ascii', 8, 12), 'WEBP', frame.file);
    assert.equal(data.toString('ascii', 12, 16), 'VP8X', frame.file);
    assert.ok(data[20] & 0x10, `${frame.file} needs transparency`);
    assert.equal(data.readUIntLE(24, 3) + 1, 1000, frame.file);
    assert.equal(data.readUIntLE(27, 3) + 1, 875, frame.file);
  }
});

test('all frames retain the completed twelve-stone bracelet', () => {
  assert.equal(manifest.month, 12);
  assert.equal(manifest.currentMonth, 12);
  assert.equal(manifest.intentionRank, undefined);
  assert.equal(manifest.sourceUnchanged, true);
  assert.equal(manifest.sourceSha256Before, manifest.sourceSha256After);
  for (const frame of manifest.frames) {
    assert.equal(frame.installedStones, 12);
    assert.equal(frame.blankPositions, 0);
  }
});

test('both finishes use the same camera and native clasp geometry', () => {
  const light = frames('Light');
  const dark = frames('Dark');
  assert.deepEqual(light.map(frame => frame.index), Array.from({ length: 24 }, (_, i) => i));
  assert.deepEqual(dark.map(frame => frame.index), light.map(frame => frame.index));
  for (let i = 0; i < 24; i++) {
    for (const key of ['camera', 'target', 'orthoScale', 'claspOpenDegrees', 'claspLidWorld']) {
      assert.deepEqual(light[i][key], dark[i][key], `frame ${i} / ${key}`);
    }
  }
});

test('the actual hinged cover closes monotonically and locks before returning', () => {
  assert.equal(manifest.lockFrame, 16);
  for (const finish of ['Light', 'Dark']) {
    const sequence = frames(finish);
    assert.equal(sequence[6].claspOpenDegrees, 88);
    for (const frame of sequence) {
      assert.ok(Math.abs(frame.claspOpenDegrees - frame.lidAngleDegrees) < 0.001, `native driver at ${finish}/${frame.index}`);
    }
    for (let i = 8; i <= manifest.lockFrame; i++) {
      assert.ok(sequence[i].claspOpenDegrees < sequence[i - 1].claspOpenDegrees);
    }
    assert.notDeepEqual(sequence[6].claspLidWorld, sequence[16].claspLidWorld);
    for (const frame of sequence.slice(manifest.lockFrame)) assert.equal(frame.claspOpenDegrees, 0);
  }
});

test('entrance and final hold use matching closed hero poses', () => {
  assert.deepEqual(manifest.heroFrames, [0, 23]);
  for (const finish of ['Light', 'Dark']) {
    const sequence = frames(finish);
    const first = sequence[0];
    const last = sequence[23];
    for (const key of ['camera', 'target', 'orthoScale', 'claspOpenDegrees', 'claspLidWorld']) {
      assert.deepEqual(first[key], last[key], `${finish}/${key}`);
    }
    assert.equal(first.orbitDegrees, 0);
    assert.equal(last.orbitDegrees, 0);
    assert.deepEqual(fs.readFileSync(path.join(directory, first.file)),
      fs.readFileSync(path.join(directory, last.file)), 'the hold cannot flicker between equivalent renders');
  }
});
