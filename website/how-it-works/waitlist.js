(() => {
  'use strict';

  const form = document.getElementById('halo-waitlist');
  if (!form) return;
  const emailInput = document.getElementById('waitlist-email');
  const button = form.querySelector('button[type="submit"]');
  const buttonLabel = document.getElementById('waitlist-submit-label');
  const status = document.getElementById('waitlist-status');
  let pending = false;
  let joined = false;

  // Inline validation keeps errors beside the field and remains keyboard accessible.
  form.noValidate = true;
  button.disabled = false;

  function showError(message, invalidEmail = false) {
    form.dataset.state = 'error';
    status.textContent = message;
    emailInput.setAttribute('aria-invalid', String(invalidEmail));
  }

  emailInput.addEventListener('input', () => {
    if (form.dataset.state !== 'error') return;
    delete form.dataset.state;
    status.textContent = '';
    emailInput.removeAttribute('aria-invalid');
  });

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (pending || joined) return;

    emailInput.value = emailInput.value.trim();
    if (!emailInput.checkValidity()) {
      showError(emailInput.validity.valueMissing ? 'Enter your email address.' : 'Enter a valid email address.', true);
      emailInput.focus();
      return;
    }

    pending = true;
    form.dataset.state = 'pending';
    form.setAttribute('aria-busy', 'true');
    emailInput.removeAttribute('aria-invalid');
    emailInput.disabled = true;
    button.disabled = true;
    buttonLabel.textContent = 'Joining…';
    status.textContent = 'Adding you to the Halo waitlist…';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ email: emailInput.value }),
        signal: controller.signal,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.success !== true) {
        showError(typeof data.error === 'string' && data.error.trim()
          ? data.error
          : 'We couldn’t add you just now. Please try again.');
        return;
      }

      joined = true;
      form.dataset.state = 'success';
      buttonLabel.textContent = 'You’re on the list';
      status.textContent = 'You’re on the Halo waitlist. We’ll email you when there’s news.';
      emailInput.readOnly = true;
    } catch (error) {
      showError(error.name === 'AbortError'
        ? 'This is taking longer than expected. Please try again.'
        : 'We couldn’t connect. Please try again.');
    } finally {
      clearTimeout(timeout);
      pending = false;
      form.removeAttribute('aria-busy');
      emailInput.disabled = false;
      button.disabled = joined;
      if (!joined) {
        buttonLabel.textContent = 'Join the Halo waitlist';
        emailInput.focus({ preventScroll: true });
      }
    }
  });
})();
