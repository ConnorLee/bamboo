const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {sample, duration, frameCount} = require('../website/year-finale.js');

test('the year arrives, closes, and reveals its message in that order', () => {
  assert.equal(sample(0).arrival, 0);
  assert.equal(sample(.55).closure, 0);
  assert.equal(sample(.9).arrival, 1);
  assert.equal(sample(2.05).reveal, 0);
  assert.equal(sample(2.35).closure, 1);
  assert.equal(sample(2.65).reveal, 1);
  assert.equal(sample(duration).frame, frameCount - 1);
});

test('out-of-range and invalid scroll samples stay bounded', () => {
  assert.deepEqual(sample(-100), sample(0));
  assert.deepEqual(sample(100), sample(duration));
  for (const position of [NaN, Infinity, -Infinity, undefined]) {
    assert.deepEqual(sample(position), sample(0));
  }
  for (let position = 0; position <= duration; position += .007) {
    const state = sample(position);
    for (const name of ['arrival', 'closure', 'reveal']) {
      assert.ok(state[name] >= 0 && state[name] <= 1, `${name} at ${position}`);
    }
    assert.ok(Number.isInteger(state.frame));
    assert.ok(state.frame >= 0 && state.frame < frameCount);
  }
});

test('reverse scrolling, large jumps and repeated positions reproduce identical states', () => {
  const positions = [0, .2, .55, .9, 1.2, 2.05, 2.35, 2.65, duration];
  const forward = positions.map(position => sample(position));
  assert.deepEqual([...positions].reverse().map(position => sample(position)).reverse(), forward);
  for (const position of [2.65, .2, duration, 0, 1.2, 0, 2.65]) {
    assert.deepEqual(sample(position), forward[positions.indexOf(position)]);
  }
});

test('reduced motion uses the completed bracelet and visible message throughout the finale', () => {
  for (const position of [0, .4, 1.3, 2.4, duration]) {
    assert.deepEqual(sample(position, true), {
      time: position, arrival: 1, closure: 1, reveal: 1, frame: frameCount - 1
    });
  }
});

function viewer() {
  class Element {
    constructor() { this.style = {}; this.dataset = {}; this.attributes = {}; this.nodes = new Map(); }
    querySelector(selector) {
      if (!this.nodes.has(selector)) this.nodes.set(selector, new Element());
      return this.nodes.get(selector);
    }
    querySelectorAll() { return this.images || []; }
    setAttribute(name, value) { this.attributes[name] = value; }
    getBoundingClientRect() { return this.bounds || {left: 0, top: 0, width: 1200, height: 900}; }
    focus() {}
  }
  const loads = new Map(), observers = [];
  class DeferredImage {
    set src(url) { this.url = url; loads.set(url, this); }
    get src() { return this.url; }
    async decode() {}
  }
  const document = {documentElement: {dataset: {theme: 'light'}}};
  const context = {
    document, Image: DeferredImage,
    MutationObserver: class {
      constructor(callback) { observers.push(callback); }
      observe() {}
    }
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../website/year-finale.js'), 'utf8'), context);
  const journey = new Element(), source = new Element();
  source.bounds = {left: 160, top: 300, width: 720, height: 630};
  const root = journey.querySelector('.year-finale');
  const product = root.querySelector('.year-finale-product');
  product.images = [new Element(), new Element()];
  const renderer = context.HaloYearFinale.create(journey, source);
  renderer.setActive(true);
  return {
    renderer, root, product, images: product.images,
    monthly: journey.querySelector('.journey-inner'),
    copy: root.querySelector('.year-finale-copy'),
    foot: root.querySelector('.year-finale-foot'),
    async loaded(finish, ...indices) {
      for (const index of indices) {
        const url = `assets/bracelet-year/finale/${finish}-${String(index).padStart(2, '0')}.webp`;
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

test('a late intermediate frame cannot overwrite the completed bracelet after a fast scroll', async () => {
  const view = viewer();
  const mid = Math.floor(sample(1.3).closure * (frameCount - 1));
  view.renderer.render(1.3);
  view.renderer.render(duration);
  await view.loaded('light', frameCount - 1);
  const complete = view.images[0].src;
  await view.loaded('light', mid, mid + 1);
  assert.equal(view.images[0].src, complete);
  assert.match(complete, /light-23\.webp$/);
  assert.equal(view.product.dataset.frame, String(frameCount - 1));
});

test('reverse scrolling keeps the latest opening state when later frames finish loading', async () => {
  const view = viewer();
  view.renderer.render(duration);
  view.renderer.render(0);
  await view.loaded('light', 0, 1);
  await view.loaded('light', frameCount - 1);
  assert.match(view.images[0].src, /light-00\.webp$/);
  assert.equal(view.images[1].style.opacity, '0');
  assert.equal(view.product.dataset.frame, '0');
});

test('theme changes reject stale-finish frames while keeping the same geometry and progress', async () => {
  const view = viewer();
  view.renderer.render(duration);
  await view.loaded('light', frameCount - 1);
  const transform = view.product.style.transform;
  view.theme('dark');
  assert.equal(view.product.style.opacity, '0');
  await view.loaded('light', 0, 1);
  assert.equal(view.product.style.opacity, '0');
  await view.loaded('dark', frameCount - 1);
  assert.match(view.images[0].src, /dark-23\.webp$/);
  assert.equal(view.product.dataset.frame, String(frameCount - 1));
  assert.equal(view.product.style.transform, transform);
  assert.equal(view.root.dataset.finish, 'dark');
});

test('leaving the finale hides it and late loads cannot dim the restored monthly scene', async () => {
  const view = viewer();
  view.renderer.render(duration);
  view.renderer.setActive(false);
  await view.loaded('light', frameCount - 1);
  assert.equal(view.root.hidden, true);
  assert.equal(view.root.inert, true);
  assert.equal(view.product.style.opacity, '0');
  assert.equal(view.monthly.style.opacity, '');
});

test('slow-loading finale imagery keeps the monthly fallback clear and celebration controls unavailable', async () => {
  const view = viewer();
  view.renderer.render(duration);
  assert.equal(view.monthly.style.opacity, '1');
  assert.equal(view.product.style.opacity, '0');
  assert.equal(view.copy.style.opacity, '0');
  assert.equal(view.copy.attributes['aria-hidden'], 'true');
  assert.equal(view.foot.inert, true);
  await view.loaded('light', frameCount - 1);
  assert.equal(view.monthly.style.opacity, '0');
  assert.equal(view.copy.style.opacity, '1');
  assert.equal(view.foot.inert, false);
});

test('the reduced-motion render seats the closed bracelet centrally with accessible celebration controls', async () => {
  const view = viewer();
  view.renderer.render(.4, true);
  await view.loaded('light', frameCount - 1);
  assert.match(view.images[0].src, /light-23\.webp$/);
  assert.equal(view.images[1].style.opacity, '0');
  assert.equal(view.product.style.transform, 'translate(-50%,-50%) translate3d(0px,0px,0) scale(1)');
  assert.equal(view.copy.style.opacity, '1');
  assert.equal(view.copy.attributes['aria-hidden'], 'false');
  assert.equal(view.foot.inert, false);
});
