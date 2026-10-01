/* Shared reservation flow. Only the server's webhook-backed record can confirm a place. */
(() => {
  'use strict';
  const triggers = [...document.querySelectorAll('[data-reserve]')];
  if (!triggers.length) return;
  const source = location.pathname.startsWith('/how-it-works') ? 'how-it-works' : 'home';
  const root = document.documentElement;
  const makeId = () => crypto.randomUUID();
  const storedId = (storageName, key) => {
    try {
      const storage = window[storageName];
      const value = storage.getItem(key);
      if (value && /^[0-9a-f-]{36}$/i.test(value)) return value;
      const id = makeId(); storage.setItem(key, id); return id;
    } catch (_) { return makeId(); }
  };
  const visitorId = storedId('sessionStorage', 'halo-reservation-visitor');
  const attemptId = storedId('localStorage', 'halo-reservation-attempt');
  let stripe, config, cardElements, paymentElement, cardReady = false;
  let busy = false, awaitingConfirmation = false, current, opener, polling = false, phase = 'checkout';
  let checkoutStarted = false;
  const wallets = [];
  let analyticsReady = false;
  const queuedEvents = [];
  const errorMessages = {
    reservations_paused:'Reservations are temporarily paused. Your existing reservation is safe.',
    reservation_cancelled:'This payment was cancelled. Contact hello@habithalo.com if you would like help reserving again.',
    reservation_needs_reconciliation:'We need to check your earlier payment attempt. Please contact hello@habithalo.com before paying again.',
    attempt_unavailable:'Your earlier attempt needs to be checked. Contact hello@habithalo.com before paying again.',
    too_many_requests:'Please wait a few minutes before trying again.',
    session_missing:'Your reservation session has expired. Reload this page to try again.',
    invalid_request:'Please check the details and try again.',
  };

  function track(event) {
    // No email, card data, URL query strings or progress data enters analytics.
    if (navigator.doNotTrack === '1' || navigator.globalPrivacyControl) return;
    if (!analyticsReady) { queuedEvents.push(event); return; }
    fetch('/api/reservations/events', {
      method: 'POST', headers: {'Content-Type': 'application/json'},
      credentials: 'same-origin', keepalive: true,
      body: JSON.stringify({event, source, visitorId, attemptId}),
    }).catch(() => {});
  }
  window.HaloReservation = Object.freeze({track, visitorId, attemptId});
  track('landing_view');
  const wearable = document.getElementById(source === 'home' ? 'journey' : 'wearable');
  if (wearable && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { track('wearable_section_view'); observer.disconnect(); }
    }, {threshold: 0});
    observer.observe(wearable);
  }

  const dialog = document.createElement('dialog');
  dialog.id = 'reservation-dialog';
  dialog.className = 'reservation-dialog';
  dialog.setAttribute('aria-labelledby', 'reservation-title');
  dialog.setAttribute('aria-describedby', 'reservation-explanation');
  dialog.innerHTML = `
    <button class="reservation-close" type="button" aria-label="Close reservation">×</button>
    <p class="eyebrow">Halo — First Year Collection</p>
    <h2 id="reservation-title" tabindex="-1">A place for your beginning.</h2>
    <p id="reservation-explanation">$25 today. Applied to your $189 Halo. Fully refundable.</p>
    <div data-checkout-panel>
      <div class="reservation-wallet" data-wallet="dialog" aria-label="Express reservation payment"></div>
      <p class="reservation-card-label" hidden>Or reserve with a card</p>
      <form id="reservation-payment"><div id="reservation-card-element"></div><button class="reservation-button" type="submit" disabled>Reserve Halo — $25</button></form>
      <p class="reservation-disclosure">Halo is in pre-production. No shipping date is promised. The remaining $164 will require your confirmation before payment.</p>
      <p class="reservation-legal"><a href="/reservation-terms">Reservation terms</a> · <a href="/reservation-terms#privacy">Privacy</a></p>
    </div>
    <p class="reservation-payment-status" id="reservation-payment-status" role="status" aria-live="polite" aria-atomic="true"></p>
    <button class="reservation-text-link" type="button" data-check-status hidden>Check payment status</button>
    <div data-help-panel hidden><p><a href="mailto:hello@habithalo.com">Contact Halo for help with this reservation</a></p></div>
    <div data-unavailable-panel hidden><p>No payment has been taken here. You can leave your email for an update when reservations open.</p><button class="reservation-button" type="button" data-reservation-updates>Just keep me updated</button></div>
    <div data-paid-panel hidden>
      <div class="reservation-receipt"><p><strong>$25 reservation confirmed</strong></p><p>$164 remains toward your $189 Halo.</p><p class="reservation-id" data-reservation-id></p><p><a data-receipt-link hidden target="_blank" rel="noopener noreferrer">View your payment receipt ↗</a></p><p class="reservation-form-status" data-receipt-note></p></div>
      <details data-optional-details><summary>Make it yours <span>— optional</span></summary>
        <form class="reservation-details" id="reservation-details">
          <div data-email-field><label class="reservation-detail-label" for="reservation-email">Email for your receipt and reservation</label><input id="reservation-email" name="email" type="email" autocomplete="email" inputmode="email" maxlength="254"></div>
          <label class="reservation-detail-label" for="reservation-wrist">Wrist size, if you know it</label><input id="reservation-wrist" name="wristSize" type="text" placeholder="e.g. 16 cm / 6.3 in" maxlength="40">
          <label class="reservation-detail-label" for="reservation-country">Shipping country</label><select id="reservation-country" name="shippingCountry"><option value="">Decide later</option></select>
          <label class="reservation-opt-in"><input name="marketingConsent" type="checkbox">Keep me updated with Halo news.</label>
          <button class="reservation-button" type="submit">Save optional details</button><p class="reservation-form-status" data-details-status role="status" aria-live="polite"></p>
        </form>
      </details>
      <p class="reservation-disclosure">No account needed. Keep your receipt and reservation reference. You can return to this browser to manage your reservation.</p>
      <p class="reservation-form-status"><a href="mailto:hello@habithalo.com">Need help with your reservation?</a></p>
      <details class="reservation-refund"><summary>Request a refund</summary><p data-refund-explanation>Your full $25 can be returned to your original payment method. This cancels your founding reservation.</p><button class="reservation-text-link" type="button" data-refund>Refund my $25 reservation</button><p data-refund-status role="status" aria-live="polite"></p></details>
    </div>`;
  document.body.append(dialog);
  const $ = selector => dialog.querySelector(selector);
  const title = $('#reservation-title'), status = $('#reservation-payment-status');
  const paymentForm = $('#reservation-payment'), payButton = paymentForm.querySelector('button');
  const detailForm = $('#reservation-details');
  const regionCodes = 'AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW'.split(' ');
  const regionNames = typeof Intl.DisplayNames === 'function' ? new Intl.DisplayNames(['en'], {type:'region'}) : null;
  regionCodes.map(code => ({code, name:regionNames ? regionNames.of(code) : code})).sort((a,b) => a.name.localeCompare(b.name)).forEach(region => {
    const option = document.createElement('option'); option.value = region.code; option.textContent = region.name; $('#reservation-country').append(option);
  });

  async function api(path, options = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch(`/api/reservations${path}`, {
        credentials: 'same-origin', cache: 'no-store', ...options,
        headers: {Accept: 'application/json', ...(options.body ? {'Content-Type':'application/json'} : {}), ...options.headers},
        signal: controller.signal,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const error = new Error(errorMessages[data.error] || 'We couldn’t complete this request. Please try again.');
        error.status = response.status; error.code = data.error; throw error;
      }
      return data;
    } finally { clearTimeout(timer); }
  }
  function message(text, error = false) { status.textContent = text; status.dataset.error = String(error); }
  function setPhase(next) {
    phase = next;
    $('[data-checkout-panel]').hidden = next !== 'checkout';
    $('[data-paid-panel]').hidden = next !== 'paid';
    $('[data-unavailable-panel]').hidden = next !== 'disabled';
    $('[data-help-panel]').hidden = next !== 'support';
    $('[data-check-status]').hidden = next !== 'processing';
  }
  function showDialog() {
    if (!dialog.open) { opener = document.activeElement; dialog.showModal(); root.classList.add('reservation-open'); title.focus({preventScroll:true}); }
  }
  function setBusy(value) {
    busy = value;
    payButton.disabled = value || awaitingConfirmation || !cardReady;
    payButton.textContent = value ? 'Confirming…' : 'Reserve Halo — $25';
    paymentForm.setAttribute('aria-busy', String(value));
    wallets.forEach(({host}) => { host.inert = value || awaitingConfirmation || Boolean(current?.paymentStatus === 'paid'); });
  }
  function noteCheckout() { if (!checkoutStarted) { checkoutStarted = true; track('checkout_started'); } }
  function updateTriggers() {
    const paid = current?.paymentStatus === 'paid';
    triggers.forEach(trigger => { trigger.textContent = paid ? 'View your reservation' : 'Reserve Halo — $25'; });
    wallets.forEach(({host}) => { host.hidden = paid; });
  }
  function safeReceipt(value) {
    try { const url = new URL(value); return url.protocol === 'https:' && /(^|\.)stripe\.com$/.test(url.hostname) ? url.href : ''; } catch (_) { return ''; }
  }
  function showPaid(record) {
    current = record; awaitingConfirmation = false; setBusy(false); updateTriggers();
    setPhase('paid');
    const refunded = record.refundStatus === 'refunded';
    const returnedCents = Number.isInteger(record.refundedAmount) ? Math.min(2500, Math.max(0, record.refundedAmount)) : refunded ? 2500 : 0;
    const partial = !refunded && (returnedCents > 0 || record.refundStatus === 'partial');
    const knownPartialAmount = !partial || Number.isInteger(record.refundedAmount);
    const credit = new Intl.NumberFormat('en-US', {style:'currency',currency:'USD',maximumFractionDigits:2,minimumFractionDigits:0}).format((2500 - returnedCents) / 100);
    const remaining = new Intl.NumberFormat('en-US', {style:'currency',currency:'USD',maximumFractionDigits:2,minimumFractionDigits:0}).format((18900 - 2500 + returnedCents) / 100);
    title.textContent = refunded ? 'Your reservation is refunded.' : partial ? 'Your reservation.' : 'You’re in.';
    $('#reservation-explanation').textContent = refunded
      ? 'Your $25 has been refunded to your original payment method. Bank processing times vary.'
      : partial ? knownPartialAmount ? `Your reservation has ${credit} remaining toward the $189 purchase price. You can request a refund of this remaining credit.` : 'A partial refund has been recorded. Contact Halo for your remaining reservation balance.'
      : 'Your $25 reservation is fully refundable and will be applied toward the $189 purchase price when Halo enters production.';
    message('');
    $('[data-reservation-id]').textContent = `Reservation ${record.id}`;
    const link = $('[data-receipt-link]'), receipt = safeReceipt(record.receiptUrl);
    link.hidden = !receipt; if (receipt) link.href = receipt;
    $('[data-receipt-note]').textContent = record.email ? `Receipt email: ${record.email}` : 'Add an email below if you’d like an emailed receipt. Your reservation is already confirmed.';
    $('[data-email-field]').hidden = Boolean(record.email);
    if (!detailForm.dataset.edited) {
      detailForm.elements.email.value = record.email || '';
      detailForm.elements.wristSize.value = record.wristSize || '';
      detailForm.elements.shippingCountry.value = record.shippingCountry || '';
      detailForm.elements.marketingConsent.checked = Boolean(record.marketingConsent);
    }
    const refundStatus = $('[data-refund-status]');
    refundStatus.textContent = record.refundStatus === 'pending' ? 'Your refund is being processed. We’ll confirm it here once Stripe confirms.'
      : refunded ? 'Full refund confirmed.'
      : record.refundStatus === 'partial' ? 'A partial refund has been recorded. You can request the remaining refundable balance.'
      : record.refundStatus === 'failed' ? 'The refund could not be completed. Email hello@habithalo.com for help.' : '';
    $('[data-refund]').disabled = refunded || record.refundStatus === 'pending' || record.refundStatus === 'failed' || !knownPartialAmount;
    $('.reservation-receipt strong').textContent = refunded ? '$25 reservation refunded' : partial ? knownPartialAmount ? `${credit} reservation credit remaining` : 'Partial refund recorded' : '$25 reservation confirmed';
    $('.reservation-receipt p:nth-child(2)').hidden = refunded || !knownPartialAmount;
    $('.reservation-receipt p:nth-child(2)').textContent = `${remaining} remains toward your $189 Halo.`;
    $('[data-refund-explanation]').textContent = knownPartialAmount ? `Your ${credit} remaining reservation credit can be returned to your original payment method. This cancels your founding reservation.` : 'Contact hello@habithalo.com to confirm and refund your remaining reservation balance.';
    $('[data-refund]').textContent = !knownPartialAmount ? 'Contact Halo for your balance' : partial ? `Refund my remaining ${credit}` : 'Refund my $25 reservation';
    $('[data-optional-details]').hidden = refunded;
  }
  async function readCurrent() {
    try { return await api('/current'); } catch (error) { if (error.status === 404) return null; throw error; }
  }
  async function pollConfirmation() {
    if (polling) return;
    polling = true; awaitingConfirmation = true;
    setPhase('processing'); title.textContent = 'Confirming your place.';
    $('#reservation-explanation').textContent = 'Your payment is being checked securely. Please don’t submit another payment.';
    message('Waiting for payment confirmation…');
    try {
      for (let count = 0; count < 25; count++) {
        const record = await readCurrent();
        if (record?.paymentStatus === 'paid') { showPaid(record); return; }
        if (record && ['failed', 'cancelled'].includes(record.paymentStatus)) {
          current = record; awaitingConfirmation = false; setPhase(record.paymentStatus === 'cancelled' ? 'support' : 'checkout'); title.textContent = record.paymentStatus === 'cancelled' ? 'Reservation cancelled.' : 'Payment not completed.';
          $('#reservation-explanation').textContent = '$25 today. Applied to your $189 Halo. Fully refundable.';
          message(record.paymentStatus === 'cancelled' ? 'This payment was cancelled. No reservation is confirmed. Contact Halo if you would like to reserve again.' : 'Your payment did not complete. Check your payment method and try again.', true);
          return;
        }
        await new Promise(resolve => setTimeout(resolve, 1800));
      }
      message('Confirmation is taking longer than usual. Your reservation is not yet confirmed. Check again here; please don’t pay a second time.');
    } catch (_) {
      message('We couldn’t check your payment yet. Your bank may still be processing it. Check the status again before trying another payment.', true);
    } finally { polling = false; setBusy(false); }
  }
  function disabled(text) {
    setPhase('disabled'); title.textContent = 'Reservations are not open yet.';
    $('#reservation-explanation').textContent = '$189 for the First Year Collection. A fully refundable $25 reservation when checkout opens.';
    document.querySelectorAll('[data-reservation-availability]').forEach(node => { node.textContent = text; });
    message(text);
  }

  const elementOptions = () => ({
    mode:'payment', amount:config.amount, currency:config.currency, paymentMethodTypes:['card'],
    appearance: {theme:root.dataset.theme === 'dark' ? 'night' : 'stripe', variables:{borderRadius:'10px',fontFamily:'Arial, sans-serif',colorPrimary:'#5c744b'}},
  });
  function mountWallet(host) {
    const elements = stripe.elements(elementOptions());
    const express = elements.create('expressCheckout', {
      buttonHeight:50,
      buttonType:{applePay:'plain',googlePay:'pay'},
      buttonTheme:{applePay:host.closest('.support-hero') ? 'white' : 'black',googlePay:'black'},
      paymentMethodOrder:['applePay','googlePay'],
      paymentMethods:{applePay:'always',googlePay:'auto',link:'never',amazonPay:'never',paypal:'never',klarna:'never'},
      billingAddressRequired:false, shippingAddressRequired:false, emailRequired:false, phoneNumberRequired:false,
      business:{name:'Halo'}, lineItems:[{name:'Halo — refundable founding reservation',amount:2500}],
      layout:{maxColumns:1,maxRows:2},
    });
    const showAvailable = methods => {
      const available = Boolean(methods && Object.values(methods).some(Boolean));
      host.dataset.ready = String(available);
      if (host.dataset.wallet === 'dialog') $('.reservation-card-label').hidden = !available;
    };
    express.on('ready', event => showAvailable(event.availablePaymentMethods));
    express.on('availablepaymentmethodschange', event => showAvailable(event.paymentMethods || event.availablePaymentMethods));
    express.on('loaderror', () => { host.dataset.ready = 'false'; });
    express.on('click', event => {
      track('reserve_click'); noteCheckout();
      // Resolve synchronously so the wallet stays inside the user's tap gesture.
      event.resolve({billingAddressRequired:false,shippingAddressRequired:false,emailRequired:false,phoneNumberRequired:false});
    });
    express.on('cancel', () => {
      if (awaitingConfirmation) return;
      track('reservation_abandoned'); checkoutStarted = false;
      message('Payment cancelled. No reservation has been confirmed.');
      document.querySelectorAll('[data-reservation-availability]').forEach(node => { node.textContent = 'Payment cancelled. You can reserve whenever you’re ready.'; });
      setBusy(false);
    });
    express.on('confirm', event => confirmPayment(elements, event));
    express.mount(host);
    wallets.push({host, elements});
  }
  function prepareCard() {
    if (cardElements || !stripe) return;
    cardElements = stripe.elements(elementOptions());
    paymentElement = cardElements.create('payment', {
      layout:'tabs', wallets:{applePay:'never',googlePay:'never',link:'never'},
      // Leave optional billing fields on Stripe's default auto policy. Using
      // never would require supplying those omitted details at confirmation.
      fields:{billingDetails:{address:'if_required'}},
    });
    paymentElement.on('ready', () => { cardReady = true; payButton.disabled = busy || awaitingConfirmation; });
    paymentElement.on('loaderror', () => { message('The secure card form could not load. Reload the page or use the wallet button.', true); });
    paymentElement.mount('#reservation-card-element');
  }
  async function confirmPayment(elements, walletEvent) {
    if (busy || awaitingConfirmation || current?.paymentStatus === 'paid') return;
    setBusy(true); noteCheckout(); message('');
    try {
      const {error:validationError} = await elements.submit();
      if (validationError) {
        message(validationError.message || 'Check your payment details.', true);
        walletEvent?.paymentFailed?.({reason:'fail'});
        return;
      }
      let intent;
      try { intent = await api('', {method:'POST',body:JSON.stringify({attemptId,visitorId})}); }
      catch (error) {
        if (error.code !== 'session_missing' && error.status !== 401) throw error;
        await api('/config');
        intent = await api('', {method:'POST',body:JSON.stringify({attemptId,visitorId})});
      }
      if (!intent.clientSecret) throw new Error('Your payment could not be started. Please try again.');
      awaitingConfirmation = true;
      const {error} = await stripe.confirmPayment({
        elements, clientSecret:intent.clientSecret,
        confirmParams:{return_url:`${location.origin}/?reservation=return#reserve`},
        redirect:'if_required',
      });
      if (error) {
        awaitingConfirmation = false;
        // A network/API error may happen after processing. Check the webhook state before any retry.
        if (error.type === 'api_connection_error' || error.type === 'api_error') { showDialog(); await pollConfirmation(); return; }
        setPhase('checkout'); title.textContent = 'Payment not completed.';
        message(error.message || 'Your payment did not complete. Please try another payment method.', true);
        if (walletEvent) showDialog();
        return;
      }
      showDialog(); await pollConfirmation();
    } catch (error) {
      if (walletEvent?.paymentFailed) walletEvent.paymentFailed({reason:'fail'});
      if (error.code === 'reservation_already_paid') { showDialog(); await pollConfirmation(); return; }
      if (['reservation_cancelled','reservation_needs_reconciliation','attempt_unavailable'].includes(error.code)) {
        setPhase('support'); title.textContent = 'Let’s check your reservation.';
        $('#reservation-explanation').textContent = 'Please contact Halo before making another payment.';
      }
      if (awaitingConfirmation) { showDialog(); await pollConfirmation(); return; }
      message(error.name === 'AbortError' ? 'The connection timed out. Check payment status before trying again.' : error.message || 'We couldn’t connect. Please try again.', true);
      if (walletEvent) showDialog();
    } finally { setBusy(false); }
  }

  paymentForm.addEventListener('submit', event => { event.preventDefault(); if (cardReady) confirmPayment(cardElements); });
  triggers.forEach(trigger => trigger.addEventListener('click', async () => {
    track('reserve_click'); showDialog();
    await ready;
    if (current?.paymentStatus === 'paid') {
      try { const record = await readCurrent(); if (record) showPaid(record); }
      catch (_) { message('We couldn’t refresh your reservation. Please try again.', true); }
      return;
    }
    if (awaitingConfirmation) { pollConfirmation(); return; }
    if (phase === 'support') return;
    if (!stripe) return;
    noteCheckout(); prepareCard();
  }));
  window.addEventListener('pagehide', () => {
    if (checkoutStarted && phase === 'checkout' && !awaitingConfirmation && !busy) track('reservation_abandoned');
  });
  $('.reservation-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    root.classList.remove('reservation-open');
    if (checkoutStarted && phase === 'checkout' && !awaitingConfirmation && !busy) { track('reservation_abandoned'); checkoutStarted = false; }
    opener?.focus({preventScroll:true});
  });
  $('[data-check-status]').addEventListener('click', () => pollConfirmation());
  $('[data-reservation-updates]').addEventListener('click', () => {
    dialog.close(); document.querySelector('[data-open-waitlist]')?.click();
  });
  detailForm.addEventListener('input', () => { detailForm.dataset.edited = 'true'; });
  detailForm.addEventListener('submit', async event => {
    event.preventDefault();
    if (!detailForm.reportValidity()) return;
    const button = detailForm.querySelector('button'), detailStatus = $('[data-details-status]');
    button.disabled = true; detailStatus.textContent = 'Saving…';
    try {
      const body = {wristSize:detailForm.elements.wristSize.value.trim(),marketingConsent:detailForm.elements.marketingConsent.checked};
      if (detailForm.elements.shippingCountry.value) body.shippingCountry = detailForm.elements.shippingCountry.value;
      if (!current?.email && detailForm.elements.email.value.trim()) body.email = detailForm.elements.email.value.trim();
      current = await api('/current', {method:'PATCH',body:JSON.stringify(body)});
      delete detailForm.dataset.edited; showPaid(current);
      detailStatus.textContent = 'Saved. Your reservation is all set.';
    } catch (_) { detailStatus.textContent = 'We couldn’t save those details. Your paid reservation is safe. Please try again.'; }
    finally { button.disabled = false; }
  });
  $('[data-refund]').addEventListener('click', async () => {
    const button = $('[data-refund]'), refundStatus = $('[data-refund-status]');
    button.disabled = true; refundStatus.textContent = 'Requesting your refund…';
    try {
      await api('/refund', {method:'POST',body:JSON.stringify({})});
      refundStatus.textContent = 'Your refund is processing. Waiting for confirmation…';
      for (let count = 0; count < 20; count++) {
        const record = await readCurrent();
        if (record) {
          current = record;
          if (['refunded','failed','partial'].includes(record.refundStatus)) { showPaid(record); return; }
        }
        await new Promise(resolve => setTimeout(resolve, 1800));
      }
      refundStatus.textContent = 'Your refund is still processing. Return to your reservation here to check its status.';
    } catch (_) {
      refundStatus.textContent = 'We couldn’t confirm the refund yet. Return to your reservation to check its status, or email hello@habithalo.com for help.';
      button.disabled = false;
    }
  });

  function loadStripe() {
    if (typeof window.Stripe === 'function') return Promise.resolve();
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://js.stripe.com/v3/'; script.async = true;
      const timer = setTimeout(() => reject(new Error('Secure payment loading timed out.')), 15000);
      script.onload = () => { clearTimeout(timer); resolve(); };
      script.onerror = () => { clearTimeout(timer); reject(new Error('Secure payments could not load.')); };
      document.head.append(script);
    });
  }
  const returning = new URLSearchParams(location.search).has('reservation');
  // Redirect query values are never confirmation. Remove Stripe secrets from the visible URL.
  if (returning || new URLSearchParams(location.search).has('payment_intent_client_secret')) {
    const clean = new URL(location.href);
    ['reservation','payment_intent','payment_intent_client_secret','redirect_status'].forEach(key => clean.searchParams.delete(key));
    history.replaceState(null, '', clean.pathname + clean.search + clean.hash);
  }
  const ready = (async () => {
    try {
      config = await api('/config');
      analyticsReady = Boolean(config.manageable || config.enabled);
      if (analyticsReady) queuedEvents.splice(0).forEach(track);
      if (config.manageable || config.enabled) {
        try { current = await readCurrent(); } catch (_) { if (returning) throw new Error('Your reservation status is temporarily unavailable.'); }
      }
      if (current?.paymentStatus === 'paid') { showPaid(current); if (returning) showDialog(); return; }
      if (!config.enabled || !config.publishableKey || config.amount !== 2500 || config.currency !== 'usd' || config.retail !== 18900) {
        if (config.manageable && (returning || current?.paymentStatus === 'processing')) {
          showDialog(); await pollConfirmation(); return;
        }
        if (returning) {
          showDialog(); setPhase('processing'); awaitingConfirmation = true; title.textContent = 'Check your reservation.';
          message('Payment status is temporarily unavailable. Check again before making another payment.', true); return;
        }
        disabled('Reservations will open soon. Leave your email to hear when they do.'); return;
      }
      await loadStripe(); stripe = window.Stripe(config.publishableKey);
      document.querySelectorAll('[data-wallet]').forEach(mountWallet);
      prepareCard();
      if (returning || current?.paymentStatus === 'processing') { showDialog(); await pollConfirmation(); }
    } catch (_) {
      if (returning) { showDialog(); setPhase('processing'); awaitingConfirmation = true; title.textContent = 'Check your reservation.'; message('Payment status is temporarily unavailable. Check again before making another payment.', true); }
      else disabled('Secure reservations are temporarily unavailable. You can still ask for Halo updates.');
    }
  })();
})();
