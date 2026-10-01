(() => {
  'use strict';
  const root = document.documentElement;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const running = new Set();
  const waiting = new Set();
  let observer;
  root.dataset.motionInput = 'pointer';
  const instant = () => reduced.matches || root.dataset.motionInput === 'keyboard';

  // Reuse the same quiet glyph field so both stone sections stay in sync.
  const symbols = document.querySelector('#milestones > .milestone-symbols');
  const collection = document.querySelector('.collection');
  if (symbols && collection && !collection.querySelector('.milestone-symbols')) {
    collection.prepend(symbols.cloneNode(true));
  }

  function animate(element, frames, options) {
    if (instant() || !element.animate) return;
    const animation = element.animate(frames, options);
    running.add(animation);
    const finish = () => running.delete(animation);
    animation.addEventListener('finish', finish, { once:true });
    animation.addEventListener('cancel', finish, { once:true });
  }
  function reveal(element, immediately = false) {
    if (!waiting.has(element)) return;
    if (immediately) element.dataset.revealInstant = '';
    element.dataset.reveal = 'visible';
    waiting.delete(element);
    observer?.unobserve(element);
  }
  function finishMotion() {
    running.forEach(animation => animation.cancel());
    running.clear();
    waiting.forEach(element => reveal(element, true));
  }

  // Keyboard navigation is immediate. Pointer scrolling always stays browser-native.
  document.addEventListener('keydown', event => {
    if (event.metaKey || event.ctrlKey || event.altKey || ['Shift','Control','Alt','Meta'].includes(event.key)) return;
    root.dataset.motionInput = 'keyboard';
    finishMotion();
  }, { capture:true });
  document.addEventListener('click', event => {
    // Assistive technology can activate a link without sending a keydown first.
    if (event.detail === 0 && !event.metaKey && !event.ctrlKey && !event.altKey && !event.shiftKey && event.target.closest?.('a[href]')) {
      root.dataset.motionInput = 'keyboard';
      finishMotion();
    }
  }, { capture:true });
  const usePointer = () => { root.dataset.motionInput = 'pointer'; };
  document.addEventListener('pointerdown', usePointer, { passive:true, capture:true });
  window.addEventListener('wheel', usePointer, { passive:true, capture:true });
  document.addEventListener('focusin', event => {
    const target = event.target.closest?.('[data-reveal="waiting"]');
    if (target) reveal(target, true);
    if (event.target.closest?.('.support-hero')) running.forEach(animation => animation.cancel());
  });
  reduced.addEventListener('change', () => { if (reduced.matches) finishMotion(); });
  window.addEventListener('pageshow', event => { if (event.persisted) finishMotion(); });
  window.addEventListener('beforeprint', finishMotion);

  // No loading gate: the headline and actions are available from the first frame.
  const navigation = performance.getEntriesByType('navigation')[0];
  if (!location.hash && window.scrollY < 40 && navigation?.type !== 'back_forward') {
    document.querySelectorAll('.support-mark, #support-title, .support-copy > p, .support-actions').forEach((element, index) => {
      animate(element, [
        { opacity:0, transform:'translate3d(0,12px,0)' },
        { opacity:1, transform:'translate3d(0,0,0)' },
      ], { duration:520, delay:index*45, easing:'cubic-bezier(.23,1,.32,1)', fill:'backwards' });
    });
  }

  // Only below-fold content is prepared for a reveal; no JS means no hidden content.
  if ('IntersectionObserver' in window && !instant()) {
    observer = new IntersectionObserver(entries => {
      entries.forEach(entry => { if (entry.isIntersecting) reveal(entry.target, instant()); });
    }, { threshold:0, rootMargin:'0px 0px -36px 0px' });
    const groups = [
      '#milestones > :not([aria-hidden="true"])', '.collection-heading > *', '#mineral-collection > .mineral',
      '.app-section > .eyebrow, .app-section > h2, .app-section > .app-intro',
      '.app-gallery > figure', '.closing > *',
    ];
    groups.forEach(selector => {
      document.querySelectorAll(selector).forEach((element, index) => {
        if (element.getBoundingClientRect().top < window.innerHeight) return;
        element.style.setProperty('--reveal-delay', `${Math.min(index*45,135)}ms`);
        element.dataset.reveal = 'waiting';
        waiting.add(element);
        observer.observe(element);
      });
    });
  }

  // Decode images into their reserved frame before fading them in. Errors never hide alt text.
  document.querySelectorAll('.support-phone img, .app-gallery img').forEach(image => {
    if (image.complete) return;
    image.dataset.mediaState = 'loading';
    const show = async () => {
      try { await image.decode(); } catch { /* Preserve the native image/alt fallback. */ }
      delete image.dataset.mediaState;
      if (image.naturalWidth) animate(image, [{opacity:0},{opacity:1}], {duration:240,easing:'ease-out'});
    };
    image.addEventListener('load', show, { once:true });
    image.addEventListener('error', () => { delete image.dataset.mediaState; }, { once:true });
    if (image.complete) show();
  });
})();
