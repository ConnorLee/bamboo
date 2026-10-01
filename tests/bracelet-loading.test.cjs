const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Control only image completion order. Exercise the public renderer against
// the same month/theme changes that can race on a slow mobile connection.
function viewer() {
  class Element {
    constructor() {
      this.dataset = {}; this.attributes = {}; this.children = [];
      this.style = {}; this.clientHeight = 500;
    }
    replaceChildren(...children) { this.children = children; }
    setAttribute(name, value) { this.attributes[name] = value; }
  }
  const loads = new Map();
  class DeferredImage {
    set src(url) { this.url = url; loads.set(url, this); }
    get src() { return this.url; }
    async decode() {}
  }
  const observers = [];
  const document = {
    documentElement: {dataset: {theme: 'light'}},
    createElement() { return new Element(); }
  };
  const context = {
    document, Image: DeferredImage,
    matchMedia() { return {matches: false}; },
    MutationObserver: class {
      constructor(callback) { observers.push(callback); }
      observe() {}
    }
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../website/bracelet.js'), 'utf8'), context);
  const host = new Element();
  const catalog = Array.from({length: 12}, (_, month) => ({month, key: `stone-${month}`}));
  const renderer = context.HaloBracelet.create(host, catalog);
  return {
    host, renderer,
    async loaded(...files) {
      for (const file of files) {
        const url = `assets/bracelet-year/${file}.webp`;
        assert.ok(loads.has(url), `${url} was requested`);
        await loads.get(url).onload();
      }
      await Promise.resolve();
    },
    theme(finish) {
      document.documentElement.dataset.theme = finish;
      observers.forEach(callback => callback());
    }
  };
}

test('slow initial layers cannot replace the latest month or its accessible description', async () => {
  const view = viewer();
  const latest = view.renderer.render(11);
  await view.loaded('base-light-11', 'stone-10', 'stone-11');
  await latest;
  await view.loaded('base-light-00', 'stone-00', 'stone-01');
  assert.equal(view.host.children[0].src, 'assets/bracelet-year/base-light-11.webp');
  assert.equal(view.host.dataset.month, 12);
  assert.match(view.host.attributes['aria-label'], /Month 12 centered/);
  const positions = view.host.children[3].children;
  assert.equal(positions.length, 12);
  assert.equal(positions[6].dataset.stone, 'stone-11');
});

test('reversing to the displayed month cancels a slower forward selection', async () => {
  const view = viewer();
  await view.loaded('base-light-00', 'stone-00', 'stone-01');
  const skipped = view.renderer.render(6);
  await view.renderer.render(0);
  await view.loaded('base-light-06', 'stone-06', 'stone-07');
  await skipped;
  assert.equal(view.host.children[0].src, 'assets/bracelet-year/base-light-00.webp');
  assert.equal(view.host.dataset.month, 1);
  assert.match(view.host.attributes['aria-label'], /Month 1 centered/);
});

test('a theme switch keeps the selected month while rejecting a stale finish load', async () => {
  const view = viewer();
  const oldFinish = view.renderer.render(6);
  view.theme('dark');
  await view.loaded('base-dark-06', 'stone-06', 'stone-07');
  await view.loaded('base-light-06');
  await oldFinish;
  await view.loaded('base-light-00', 'stone-00', 'stone-01');
  assert.equal(view.host.children[0].src, 'assets/bracelet-year/base-dark-06.webp');
  assert.equal(view.host.dataset.month, 7);
  assert.equal(view.host.dataset.finish, 'dark');
  assert.match(view.host.attributes['aria-label'], /brushed black PVD stainless steel/);
  assert.match(view.host.attributes['aria-label'], /Month 7 centered/);
});

test('month endpoints seat the visible current stone with no translation or scaling', async () => {
  const view = viewer();
  for (const [month, layers] of [
    [0, ['base-light-00', 'stone-00', 'stone-01']],
    [1, ['base-light-01', 'stone-01', 'stone-02']],
    [6, ['base-light-06', 'stone-06', 'stone-07']],
    [11, ['base-light-11', 'stone-10', 'stone-11']]
  ]) {
    const rendering = view.renderer.render(month);
    await view.loaded(...layers);
    await rendering;
    const visible = view.host.children.slice(1, 3).filter(image => image.style.opacity === '1');
    assert.equal(visible.length, 1, `month ${month}`);
    assert.equal(visible[0].src, `assets/bracelet-year/stone-${String(month).padStart(2, '0')}.webp`);
    assert.equal(visible[0].style.transform, 'translate3d(0px,0px,0) scale(1)');
  }
});

test('the reveal lifts between months and reduced motion immediately seats only the selected stone', async () => {
  const view = viewer();
  const midpoint = view.renderer.render(.5);
  await view.loaded('base-light-01', 'stone-00', 'stone-01');
  await midpoint;
  const [current, next] = view.host.children.slice(1, 3);
  assert.ok(Number(current.style.opacity) > .45 && Number(current.style.opacity) < .55);
  assert.ok(Number(next.style.opacity) > .45 && Number(next.style.opacity) < .55);
  assert.match(current.style.transform, /,-80px,0\) scale\(1\.6\)/);
  assert.match(next.style.transform, /,-80px,0\) scale\(1\.6\)/);
  await view.renderer.render(.5, true);
  assert.equal(current.src, 'assets/bracelet-year/stone-01.webp');
  assert.equal(current.style.opacity, '1');
  assert.equal(next.style.opacity, '0');
  assert.equal(current.style.transform, 'translate3d(0px,0px,0) scale(1)');
  assert.equal(view.host.dataset.month, 2);
});
