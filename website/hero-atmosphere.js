/* A little light in the dark. One composition per visit; no video or frame loop. */
(() => {
  'use strict';
  const hero = document.getElementById('introduction');
  if (!hero) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const field = document.createElement('div');
  field.className = 'hero-atmosphere';
  field.setAttribute('aria-hidden', 'true');
  // Variation belongs to the atmosphere only. Layout and content stay stable.
  const starlight = Math.random() < .4;
  field.dataset.sky = starlight ? 'starlight' : 'fireflies';
  const random = (min, max) => min + Math.random() * (max - min);
  for (let index = 0; index < 42; index++) {
    const light = document.createElement('span');
    light.className = 'hero-firefly';
    const side = index % 2;
    const x = random(7, 93);
    const values = {
      '--x': `${x}%`, '--y': `${random(8, 88)}%`,
      '--mobile-x': `${index % 3 ? x : side ? random(91, 97) : random(3, 9)}%`,
      '--mobile-y': `${index % 3 ? random(52, 87) : random(8, 77)}%`,
      '--size': `${random(starlight ? .9 : 1.5, index % 6 ? 2.8 : 4.5)}px`,
      '--drift-x': `${random(-28, 28)}px`, '--drift-y': `${random(-46, -16)}px`,
      '--drift-time': `${random(15, 29)}s`, '--glow-time': `${random(5, 10)}s`,
      '--drift-delay': `${random(-29, 0)}s`, '--glow-delay': `${random(-10, 0)}s`,
      '--glow': random(.45, .9).toFixed(2),
    };
    Object.entries(values).forEach(([name, value]) => light.style.setProperty(name, value));
    field.append(light);
  }
  const star = document.createElement('span');
  star.className = 'hero-shooting-star';
  star.style.setProperty('--star-x', `${random(52, 76)}%`);
  star.style.setProperty('--star-y', `${random(5, 14)}%`);
  star.style.setProperty('--star-time', `${random(24, 36)}s`);
  star.style.setProperty('--star-delay', `${random(4, 8)}s`);
  field.append(star);
  hero.prepend(field);
  const fields = [{ surface: hero, field, inView: true }];
  [document.getElementById('yearly-bracelets'), document.querySelector('footer.site-footer')]
    .filter(Boolean).forEach((surface) => {
      const copy = field.cloneNode(true);
      surface.prepend(copy);
      fields.push({ surface, field: copy, inView: false });
    });

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'hero-atmosphere-toggle';
  const pauseIcon = '<path d="M6 4v8M10 4v8"/>';
  const playIcon = '<path d="m6 4 6 4-6 4Z"/>';
  let paused = false;
  function sync() {
    fields.forEach((item) => {
      item.field.dataset.running = String(item.inView && !document.hidden && !paused && !reduced.matches);
    });
    toggle.hidden = reduced.matches;
    toggle.setAttribute('aria-label', paused ? 'Play background animation' : 'Pause background animation');
    toggle.title = paused ? 'Play atmosphere' : 'Pause atmosphere';
    toggle.innerHTML = `<svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paused ? playIcon : pauseIcon}</svg>`;
  }
  toggle.addEventListener('click', () => { paused = !paused; sync(); });
  const foot = hero.querySelector('.support-foot');
  foot?.insertBefore(toggle, foot.querySelector('a'));
  if ('IntersectionObserver' in window) {
    const visibility = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const item = fields.find(({ surface }) => surface === entry.target);
        if (item) item.inView = entry.isIntersecting;
      });
      sync();
    });
    fields.forEach(({ surface }) => visibility.observe(surface));
  } else {
    fields.forEach(item => { item.inView = true; });
  }
  document.addEventListener('visibilitychange', sync);
  window.addEventListener('pagehide', () => {
    fields.forEach(({ field }) => { field.dataset.running = 'false'; });
  });
  window.addEventListener('pageshow', sync);
  reduced.addEventListener('change', sync);
  sync();
})();
