(() => {
  'use strict';

  function enhanceHaloI() {
    const root = document.querySelector('[data-halo-i-story]');
    const stages = window.HALO_I_CATALOG;
    if (!root || root.dataset.enhanced === 'true' || !Array.isArray(stages) || stages.length !== 12) return;
    root.dataset.enhanced = 'true';

    const find = selector => root.querySelector(selector);
    const progressOptions = new Set([0, 1, 3, 6, 9, 12]);
    const captions = {
      0: 'Room for your story.',
      1: 'A beginning you can hold.',
      3: 'A rhythm is becoming yours.',
      6: 'Half a year, held in your hands.',
      9: 'More of your story, made visible.',
      12: 'A year, made whole.',
    };
    const productFrames = [...root.querySelectorAll('[data-halo-i-state]')];
    const progressSlots = find('[data-halo-i-slots="progress"]');
    const slotElements = [...progressSlots.children];
    const beneathButton = find('[data-halo-i-beneath]');
    const beneathCopy = find('[data-halo-i-beneath-copy]');
    let drawerStage = stages[0];
    let beneathIsOpen = false;

    // Exploration is entirely local. It never awards progress, scans NFC,
    // changes a Halo account, or stores a visitor's choices.
    function setProgress(count) {
      if (!progressOptions.has(count)) return;
      productFrames.forEach(frame => {
        const isActive = Number(frame.dataset.haloIState) === count;
        frame.classList.toggle('haloI-activeProductFrame', isActive);
        frame.setAttribute('aria-hidden', String(!isActive));
      });
      find('[data-halo-i-caption]').textContent = captions[count];
      find('[data-halo-i-count]').textContent = String(count).padStart(2, '0');
      progressSlots.setAttribute('aria-label', `${count} of 12 stones installed in this preview`);
      slotElements.forEach((slot, index) => slot.classList.toggle('haloI-filledSlot', index < count));
    }

    function renderBeneath() {
      beneathButton.setAttribute('aria-expanded', String(beneathIsOpen));
      find('[data-halo-i-beneath-label]').textContent = beneathIsOpen
        ? 'Place the stone back'
        : 'Discover the message beneath';
      find('[data-halo-i-beneath-icon]').textContent = beneathIsOpen ? '−' : '+';
      beneathCopy.classList.toggle('haloI-unrevealedMessage', !beneathIsOpen);
      beneathCopy.textContent = beneathIsOpen
        ? `“${drawerStage.beneathStone}”`
        : 'A second thought, waiting underneath.';
    }

    function setDrawer(month) {
      const stage = stages.find(item => item.month === month);
      if (!stage) return;
      drawerStage = stage;
      beneathIsOpen = false;
      find('[data-halo-i-drawer-title]').textContent = `Month ${stage.compartment} · ${stage.chapter}`;
      find('[data-halo-i-reveal]').textContent = `“${stage.firstReveal}”`;
      find('[data-halo-i-stone-name]').textContent = stage.stone;
      find('[data-halo-i-stone-color]').style.backgroundColor = stage.color;
      renderBeneath();
    }

    function setEvolution(month) {
      const stage = stages.find(item => item.month === month);
      if (!stage) return;
      find('[data-halo-i-evolution-number]').textContent = `Month ${stage.compartment}`;
      find('[data-halo-i-evolution-chapter]').textContent = stage.chapter;
      find('[data-halo-i-companion]').textContent = stage.companion;
      find('[data-halo-i-world]').textContent = stage.world;
    }

    root.addEventListener('change', event => {
      const input = event.target;
      if (!(input instanceof HTMLInputElement) || !input.checked) return;
      const value = Number(input.value);
      if (input.hasAttribute('data-halo-i-progress')) setProgress(value);
      if (input.hasAttribute('data-halo-i-drawer')) setDrawer(value);
      if (input.hasAttribute('data-halo-i-evolution')) setEvolution(value);
    });

    beneathButton.addEventListener('click', () => {
      beneathIsOpen = !beneathIsOpen;
      renderBeneath();
    });

    // Respect native form-state restoration when a visitor returns to this page.
    function syncRestoredControls() {
      setProgress(Number(find('[data-halo-i-progress]:checked').value));
      setDrawer(Number(find('[data-halo-i-drawer]:checked').value));
      setEvolution(Number(find('[data-halo-i-evolution]:checked').value));
    }
    syncRestoredControls();
    addEventListener('pageshow', syncRestoredControls);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', enhanceHaloI, { once: true });
  } else {
    enhanceHaloI();
  }
})();
