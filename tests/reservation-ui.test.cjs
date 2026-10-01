const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const {randomUUID} = require('node:crypto');
const sourceCode = fs.readFileSync(require.resolve('../website/reservation.js'), 'utf8');

// A small DOM/Stripe boundary harness; no card data, browser or external requests.
class Element {
  constructor(name = '') {
    this.name = name; this.dataset = {}; this.hidden = false; this.disabled = false;
    this.value = ''; this.checked = false; this.listeners = {}; this.nodes = new Map();
    this.attributes = {}; this.textContent = ''; this.open = false; this.inert = false;
    this.classList = {add(){}, remove(){}};
  }
  querySelector(selector) {
    if (!this.nodes.has(selector)) this.nodes.set(selector, new Element(selector));
    return this.nodes.get(selector);
  }
  set innerHTML(value) { this.html = value; }
  get innerHTML() { return this.html; }
  setAttribute(key, value) { this.attributes[key] = value; }
  addEventListener(event, fn) { this.listeners[event] = fn; }
  append() {}
  focus() {}
  closest() { return null; }
  showModal() { this.open = true; }
  close() { this.open = false; this.listeners.close?.({}); }
  reportValidity() { return true; }
  fire(event, data = {}) { return this.listeners[event]?.({preventDefault(){}, ...data}); }
}
const paid = {id:'halo-reservation-1',paymentStatus:'paid',refundStatus:'none',email:null,receiptUrl:'https://pay.stripe.com/receipts/test',amount:2500,currency:'usd',marketingConsent:false};
const config = {enabled:true,manageable:true,publishableKey:'pk_test_fixture',amount:2500,currency:'usd',retail:18900};
const tick = () => new Promise(resolve => setImmediate(resolve));
async function settle(turns = 15) { for (let i = 0; i < turns; i++) await tick(); }
function harness(options = {}) {
  const dialog = new Element('dialog');
  const form = dialog.querySelector('#reservation-details');
  form.elements = Object.fromEntries(['email','wristSize','shippingCountry','marketingConsent'].map(name => [name, new Element(name)]));
  const trigger = new Element('reserve'), availability = new Element('availability');
  const walletHosts = ['hero','offer','dialog'].map(name => { const node = new Element(name); node.dataset.wallet = name; return node; });
  const document = {
    documentElement:new Element('html'),activeElement:trigger,
    body:{append(){}},head:{append(){}},
    getElementById(){return null;},
    createElement(tag){return tag === 'dialog' ? dialog : new Element(tag);},
    querySelectorAll(selector){return selector === '[data-reserve]' ? [trigger] : selector === '[data-wallet]' ? walletHosts : selector === '[data-reservation-availability]' ? [availability] : [];},
    querySelector(){return null;},
  };
  const calls = [], elementInstances = [], confirmations = [];
  let record = options.current || null, stripeCreations = 0, timerId = 0;
  const response = (data, status = 200) => ({ok:status < 400,status,json:async()=>data});
  const fetch = async (url, request = {}) => {
    const call = {url,method:request.method || 'GET',body:request.body ? JSON.parse(request.body) : undefined}; calls.push(call);
    if (options.fetch) { const result = await options.fetch(call, response); if (result) return result; }
    if (url.endsWith('/config')) return response({...config,...options.config});
    if (url.endsWith('/current') && call.method === 'PATCH') { record = {...record,...call.body}; return response(record); }
    if (url.endsWith('/current')) return record ? response(record) : response({error:'reservation_not_found'},404);
    if (url.endsWith('/events')) return response({ok:true});
    if (url.endsWith('/refund')) { record = {...record,refundStatus:'refunded'}; return response(record); }
    if (url === '/api/reservations') return response({id:paid.id,clientSecret:'pi_fixture_secret'});
    throw new Error(`Unexpected request ${url}`);
  };
  const Stripe = () => {
    stripeCreations++;
    return {
      elements(settings) {
        const instance = {settings,items:[],submit:async()=>options.submitError ? {error:options.submitError} : {}};
        instance.create = (kind, settings) => {
          const item = {kind,settings,handlers:{},on(event,fn){this.handlers[event]=fn;},mount(host){this.host=host;this.handlers.ready?.(kind === 'expressCheckout' ? {availablePaymentMethods:{applePay:true}} : {});}};
          instance.items.push(item); return item;
        };
        elementInstances.push(instance); return instance;
      },
      async confirmPayment(details){confirmations.push(details);if(options.onConfirm)options.onConfirm();return options.confirmError ? {error:options.confirmError} : {paymentIntent:{status:'succeeded'}};},
    };
  };
  const memoryStorage = () => {const values = new Map();return {getItem:key=>values.get(key),setItem:(key,value)=>values.set(key,value)};};
  const window = {addEventListener(){},Stripe,sessionStorage:memoryStorage(),localStorage:memoryStorage()};
  const location = new URL(options.url || 'https://halo.test/');
  const context = {document,window,location,history:{replaceState(){}},crypto:{randomUUID},navigator:{},fetch,URL,URLSearchParams,Intl,
    AbortController,setTimeout(fn, delay){if(delay < 2000)queueMicrotask(fn);return ++timerId;},clearTimeout(){},console};
  vm.runInNewContext(sourceCode, context, {filename:'reservation.js'});
  return {dialog,form,trigger,availability,walletHosts,calls,elementInstances,confirmations,window,
    setRecord(value){record=value;},get stripeCreations(){return stripeCreations;},
    wallet(){return elementInstances.flatMap(instance=>instance.items).find(item=>item.kind==='expressCheckout');}};
}

test('analytics wait for the session-setting config response', async () => {
  let release;
  const gate = new Promise(resolve=>{release=resolve;});
  const h = harness({fetch:async(call,response)=>call.url.endsWith('/config') ? (await gate,response(config)) : null});
  await settle(2);
  assert.equal(h.calls.some(call=>call.url.endsWith('/events')),false);
  release(); await settle();
  assert.ok(h.calls.find(call=>call.body?.event==='landing_view'));
});

test('native wallet resolves immediately without a prepayment form or payment creation', async () => {
  const h = harness(); await settle();
  const wallet = h.wallet(); let resolved = false;
  wallet.handlers.click({resolve(options){resolved=true;assert.equal(options.shippingAddressRequired,false);assert.equal(options.emailRequired,false);}});
  assert.equal(resolved,true);
  assert.equal(h.calls.filter(call=>call.url==='/api/reservations').length,0);
  assert.equal(wallet.settings.billingAddressRequired,false);
  assert.equal(wallet.settings.paymentMethods.applePay,'always');
  const card = h.elementInstances.flatMap(instance=>instance.items).find(item=>item.kind==='payment');
  assert.equal(card.settings.fields.billingDetails.address,'if_required');
  assert.equal(card.settings.fields.billingDetails.email,undefined);
  assert.equal(card.settings.fields.billingDetails.name,undefined);
  assert.equal(card.settings.fields.billingDetails.phone,undefined);
  assert.equal(card.settings.wallets.link,'never');
  assert.equal(h.elementInstances[0].settings.amount,2500);
});

test('client redirect and Stripe success cannot confirm a reservation without the paid ledger', async () => {
  const h = harness({url:'https://halo.test/?reservation=return&redirect_status=succeeded',current:{...paid,paymentStatus:'pending'}});
  await settle(60);
  assert.notEqual(h.dialog.querySelector('#reservation-title').textContent,'You’re in.');
  assert.equal(h.dialog.querySelector('[data-paid-panel]').hidden,true);
  assert.equal(h.dialog.querySelector('[data-check-status]').hidden,false);
  assert.ok(h.walletHosts.every(host=>host.inert));
  const before = h.calls.filter(call=>call.url==='/api/reservations').length;
  await h.wallet().handlers.confirm({});
  assert.equal(h.calls.filter(call=>call.url==='/api/reservations').length,before);
});

test('wallet confirmation creates the server payment once and waits for webhook-confirmed paid', async () => {
  let h;
  h = harness({onConfirm(){h.setRecord(paid);}}); await settle();
  await h.wallet().handlers.confirm({}); await settle();
  const creates = h.calls.filter(call=>call.url==='/api/reservations');
  assert.equal(creates.length,1);
  assert.match(creates[0].body.attemptId,/^[a-f0-9-]{36}$/);
  assert.ok(creates[0].body.visitorId);
  assert.equal(h.confirmations[0].clientSecret,'pi_fixture_secret');
  assert.equal(h.confirmations[0].redirect,'if_required');
  assert.equal(h.dialog.querySelector('#reservation-title').textContent,'You’re in.');
  assert.equal(h.dialog.querySelector('[data-paid-panel]').hidden,false);
  assert.ok(h.walletHosts.every(host=>host.hidden));
});

test('sales pause still lets an existing paid buyer save optional details and refund', async () => {
  const h = harness({config:{enabled:false,publishableKey:null},current:paid}); await settle();
  assert.equal(h.stripeCreations,0);
  await h.form.fire('submit');
  const update = h.calls.find(call=>call.method==='PATCH');
  assert.equal('email' in update.body,false);
  assert.equal('shippingCountry' in update.body,false);
  assert.equal(update.body.marketingConsent,false);
  await h.dialog.querySelector('[data-refund]').fire('click'); await settle();
  assert.equal(h.dialog.querySelector('#reservation-title').textContent,'Your reservation is refunded.');
  assert.equal(h.dialog.querySelector('[data-refund]').disabled,true);
});

test('unconfigured checkout never loads Stripe or fabricates a paid state', async () => {
  const h = harness({config:{enabled:false,manageable:false,publishableKey:null}}); await settle();
  await h.trigger.fire('click');
  assert.equal(h.stripeCreations,0);
  assert.equal(h.dialog.querySelector('[data-unavailable-panel]').hidden,false);
  assert.equal(h.dialog.querySelector('[data-paid-panel]').hidden,true);
  assert.match(h.availability.textContent,/Reservations will open soon/);
});

test('card failure is actionable without confirming payment or exposing server codes', async () => {
  const h = harness({fetch:async(call,response)=>call.url==='/api/reservations' ? response({error:'reservation_needs_reconciliation'},409) : null});
  await settle(); await h.wallet().handlers.confirm({paymentFailed(){}});
  assert.match(h.dialog.querySelector('#reservation-payment-status').textContent,/hello@habithalo.com/);
  assert.doesNotMatch(h.dialog.querySelector('#reservation-payment-status').textContent,/reservation_needs_reconciliation/);
  assert.equal(h.confirmations.length,0);
});

test('wallet cancellation remains unpaid and records an abandonment', async () => {
  const h = harness(); await settle();
  h.wallet().handlers.click({resolve(){}}); h.wallet().handlers.cancel();
  assert.match(h.availability.textContent,/Payment cancelled/);
  assert.ok(h.calls.find(call=>call.body?.event==='reservation_abandoned'));
  assert.equal(h.confirmations.length,0);
});

test('receipt links cannot execute injected scripts or leave Stripe domains', async () => {
  const h = harness({current:{...paid,receiptUrl:'javascript:alert(1)'}}); await settle();
  assert.equal(h.dialog.querySelector('[data-receipt-link]').hidden,true);
});


test('partial refund displays the remaining credit and balance without claiming the full deposit', async () => {
  const h = harness({current:{...paid,refundStatus:'partial',refundedAmount:1000}}); await settle();
  assert.equal(h.dialog.querySelector('#reservation-title').textContent,'Your reservation.');
  assert.equal(h.dialog.querySelector('.reservation-receipt strong').textContent,'$15 reservation credit remaining');
  assert.equal(h.dialog.querySelector('.reservation-receipt p:nth-child(2)').textContent,'$174 remains toward your $189 Halo.');
  assert.equal(h.dialog.querySelector('[data-refund]').textContent,'Refund my remaining $15');
});

test('a payment returning while sales are paused still checks the ledger without loading checkout', async () => {
  const h = harness({url:'https://halo.test/?reservation=return',config:{enabled:false},current:{...paid,paymentStatus:'pending'}});
  await settle(60);
  assert.equal(h.stripeCreations,0);
  assert.equal(h.dialog.querySelector('[data-unavailable-panel]').hidden,true);
  assert.equal(h.dialog.querySelector('[data-check-status]').hidden,false);
  assert.notEqual(h.dialog.querySelector('#reservation-title').textContent,'You’re in.');
});
