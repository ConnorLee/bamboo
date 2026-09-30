(() => {
  'use strict';
  const hero = document.getElementById('introduction');
  const nav = document.querySelector('.nav');
  if (!hero || !nav) return;
  const copy = hero.querySelector('.support-copy');
  const devices = [...hero.querySelectorAll('[data-hero-depth]')];
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let start = 0, height = 1, navHeight = 0, pending = false, lastProgress = -1;
  const clamp = n => Math.max(0, Math.min(1, n));
  function render() {
    pending = false;
    const offset = window.scrollY - start + navHeight;
    nav.classList.toggle('over-intro', offset < height - 1);
    const progress = reduced.matches ? 0 : clamp(offset / height);
    if (progress === lastProgress) return;
    lastProgress = progress;
    // Images drift with normal scrolling; reversing scroll reverses the same path.
    devices.forEach(device => {
      device.style.transform = `translate3d(0,${progress * Number(device.dataset.heroDepth)}px,0)`;
    });
    copy.style.transform = `translate3d(0,${progress * 35}px,0)`;
    copy.style.opacity = String(1 - clamp((progress - .25) / .65));
  }
  function requestRender() {
    if (!pending) { pending = true; requestAnimationFrame(render); }
  }
  function measure() {
    start = hero.getBoundingClientRect().top + window.scrollY;
    height = hero.offsetHeight;
    navHeight = nav.offsetHeight;
    requestRender();
  }
  window.addEventListener('scroll', requestRender, { passive:true });
  window.addEventListener('resize', measure, { passive:true });
  window.addEventListener('pageshow', measure);
  reduced.addEventListener('change', () => { lastProgress = -1; requestRender(); });
  document.fonts.ready.then(measure);
  measure();
})();
