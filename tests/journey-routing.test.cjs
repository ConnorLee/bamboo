const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Run the existing journey controller with fixed layout and controllable scroll.
// This checks the real routing between months, the year finale, and the module.
function journey() {
  const elements = new Map(), frames = [], listeners = new Map();
  const calls = {bracelet: [], finale: [], module: []};
  let scrollY = 0;
  class Element {
    constructor() {
      this.dataset = {}; this.attributes = {}; this.children = [];
      this.events = new Map(); this.offsetHeight = 10000;
      this.clientWidth = 1000; this.clientHeight = 800;
      this.offsetLeft = 0; this.offsetWidth = 40; this.scrollLeft = 0;
      this.style = {setProperty(name, value) { this[name] = value; }, removeProperty(name) { delete this[name]; }};
      this.classList = {add() {}, remove() {}, toggle() {}};
    }
    append(...children) { children.forEach(child => { child.parentElement = this; }); this.children.push(...children); }
    replaceChildren(...children) { this.children = children; }
    setAttribute(name, value) { this.attributes[name] = value; }
    removeAttribute(name) { delete this.attributes[name]; }
    addEventListener(name, fn) { this.events.set(name, fn); }
    querySelector(selector) { return element(selector); }
    querySelectorAll() { return []; }
    getBoundingClientRect() { return {top: 1000 - scrollY, left: 0, width: 1000, height: 800}; }
    contains() { return false; }
    focus() {}
    scrollTo({left}) { this.scrollLeft = left; }
  }
  function element(id) {
    if (!elements.has(id)) elements.set(id, new Element());
    return elements.get(id);
  }
  const stageButtons = Array.from({length: 12}, (_, index) => {
    const button = new Element(); button.dataset.stage = String(index);
    button.parentElement = element('.timeline'); button.offsetLeft = index * 50;
    return button;
  });
  const document = {
    documentElement: element('document'),
    getElementById: element,
    createElement() { return new Element(); },
    querySelector: element,
    querySelectorAll(selector) { return selector === '[data-stage]' ? stageButtons : []; },
    addEventListener() {},
    fonts: {ready: {then() {}}}
  };
  const bracelet = {render(...args) { calls.bracelet.push(args); }, prepare() {}};
  const finale = {
    duration: 3.4, root: element('year-finale'),
    render(...args) { calls.finale.push(args); }, prepare() {}, measure() {}, focus() {},
    setActive(active) { this.root.hidden = !active; this.root.inert = !active; }, reset() {}
  };
  const moduleStory = {
    duration: 11.4, root: element('stone-module'),
    render(...args) { calls.module.push(args); }, prepare() {}, focus() {}
  };
  const window = {
    HALO_MILESTONES: Array.from({length: 12}, (_, index) => ({
      month: index + 1, key: `stone-${index + 1}`, stone: `Stone ${index + 1}`, compartment: String(index + 1).padStart(2, '0'),
      timeLabel: index === 0 ? 'Day 1' : `Month ${index + 1}`,
      chapter: 'Chapter', firstReveal: 'Milestone', color: '#888888', environment: {}
    })),
    HaloStoneModule: {create() { return moduleStory; }},
    HaloYearFinale: {duration: 3.4, create() { return finale; }},
    innerHeight: 1000, innerWidth: 1440,
    get scrollY() { return scrollY; },
    scrollTo({top}) { scrollY = top; listeners.get('scroll')?.(); },
    matchMedia() { return {matches: false, addEventListener() {}}; },
    addEventListener(name, fn) { listeners.set(name, fn); },
    dispatchEvent(event) { listeners.get(event.type)?.(event); }
  };
  const context = {
    window, document, location: {hash: ''},
    HaloBracelet: {create() { return bracelet; }},
    HaloYearFinale: window.HaloYearFinale,
    CustomEvent: class { constructor(type, {detail}) { this.type = type; this.detail = detail; } },
    Image: class { async decode() {} },
    IntersectionObserver: class { observe() {} disconnect() {} },
    requestAnimationFrame(fn) { frames.push(fn); },
    getComputedStyle() { return {getPropertyValue(name) { return name === '--nav-height' ? '80' : ''; }}; }
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../website/app.js'), 'utf8'), context);
  function flush() { for (let count = 0; frames.length && count < 20; count++) frames.shift()(); }
  flush();
  return {
    calls, element, finale, moduleStory,
    at(position) {
      window.scrollTo({top: 920 + 9080 * position / 21.6});
      flush();
      return element('journey').dataset.story;
    },
    selectMonth(month) {
      stageButtons[month].events.get('click')({detail: 0}); flush();
      return (scrollY - 920) / 9080 * 21.6;
    }
  };
}

test('the complete monthly story retains its six-unit scroll span before the finale', () => {
  const view = journey();
  assert.equal(view.at(3), 'stones');
  assert.ok(Math.abs(view.calls.bracelet.at(-1)[0] - 5.5) < 1e-10);
  assert.equal(view.at(6.7), 'stones');
  assert.equal(view.calls.bracelet.at(-1)[0], 11);
  assert.equal(view.calls.finale.length, 0);
  assert.equal(view.calls.module.length, 0);
});

test('the finale follows Month 12 and the existing module follows the completed finale', () => {
  const view = journey();
  assert.equal(view.at(6.801), 'finale');
  assert.ok(Math.abs(view.calls.finale.at(-1)[0] - .001) < 1e-10);
  assert.equal(view.calls.module.length, 0);
  assert.equal(view.at(10.199), 'finale');
  assert.equal(view.at(10.201), 'module');
  assert.ok(Math.abs(view.calls.module.at(-1)[0] - .001) < 1e-10);
});

test('reverse scrolling returns to monthly controls and keyboard month selection keeps its destination', () => {
  const view = journey();
  view.at(11); view.at(8);
  assert.equal(view.at(4), 'stones');
  assert.equal(view.element('.journey-inner').inert, false);
  assert.equal(view.finale.root.hidden, true);
  assert.equal(view.moduleStory.root.hidden, true);
  assert.ok(Math.abs(view.selectMonth(6) - 36 / 11) < 1e-10);
  assert.equal(view.element('document').dataset.motionInput, 'keyboard');
  assert.ok(Math.abs(view.calls.bracelet.at(-1)[0] - 6) < 1e-10);
});
