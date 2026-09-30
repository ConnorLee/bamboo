(() => {
  'use strict';
  const key = 'halo-theme';
  const root = document.documentElement;
  const system = window.matchMedia('(prefers-color-scheme: dark)');
  const valid = value => value === 'light' || value === 'dark';
  let preference;
  try { preference = localStorage.getItem(key); } catch { /* Storage can be unavailable. */ }
  if (!valid(preference)) preference = null;

  function apply() {
    const theme = preference || (system.matches ? 'dark' : 'light');
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
    document.querySelector('meta[name="theme-color"]').content = theme === 'dark' ? '#101114' : '#f7f7f5';
    const toggle = document.getElementById('theme-toggle');
    if (toggle) {
      const label = 'Switch to ' + (theme === 'dark' ? 'light' : 'dark') + ' mode';
      toggle.setAttribute('aria-label', label);
      toggle.title = label;
    }
  }

  // Runs in the head before the stylesheet to avoid an incorrect first frame.
  apply();
  system.addEventListener('change', () => { if (!preference) apply(); });
  window.addEventListener('storage', event => {
    if (event.key !== key && event.key !== null) return;
    preference = valid(event.newValue) ? event.newValue : null;
    apply();
  });
  document.addEventListener('DOMContentLoaded', () => {
    const toggle = document.getElementById('theme-toggle');
    toggle.hidden = false;
    apply();
    toggle.addEventListener('click', () => {
      preference = root.dataset.theme === 'dark' ? 'light' : 'dark';
      apply();
      try { localStorage.setItem(key, preference); } catch { /* Keep the current page usable. */ }
    });
  });
})();
