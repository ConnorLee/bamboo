(() => {
  'use strict';
  const dialog = document.getElementById('waitlist-dialog');
  if (!dialog) return;
  const root = document.documentElement;
  const email = document.getElementById('waitlist-email');
  const close = dialog.querySelector('.waitlist-close');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let opener, entrance, backdropPress = false;

  document.querySelectorAll('[data-open-waitlist]').forEach(trigger => {
    trigger.addEventListener('click', event => {
      if (dialog.open) return;
      opener = trigger;
      root.classList.add('waitlist-open');
      dialog.showModal();
      (email.disabled ? close : email).focus({ preventScroll:true });
      if (event.detail !== 0 && !reduced.matches && root.dataset.motionInput !== 'keyboard') {
        entrance = dialog.animate([
          { opacity:0, transform:'translate3d(0,6px,0)' },
          { opacity:1, transform:'translate3d(0,0,0)' },
        ], { duration:180, easing:'cubic-bezier(.23,1,.32,1)' });
      }
    });
  });
  close.addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    entrance?.cancel();
    root.classList.remove('waitlist-open');
    opener?.focus({ preventScroll:true });
  });
  // Only a press that both begins and ends on the backdrop dismisses the form.
  const outside = event => {
    const rect = dialog.getBoundingClientRect();
    return event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom;
  };
  dialog.addEventListener('pointerdown', event => { backdropPress = event.target === dialog && outside(event); });
  dialog.addEventListener('click', event => {
    if (backdropPress && event.target === dialog && outside(event)) dialog.close();
    backdropPress = false;
  });
  document.addEventListener('keydown', () => entrance?.cancel(), { capture:true });
  reduced.addEventListener('change', () => { if (reduced.matches) entrance?.cancel(); });
})();
