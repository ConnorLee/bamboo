// The catalog owns all twelve chapters, starting with Moonstone on Day 1.
// Explorer indices are 0–11; catalog months and packaging labels remain 01–12.
// Local previews never award or change earned progress.
(() => {
  'use strict';
  window.HALO_MILESTONES = Object.freeze(window.HALO_I_CATALOG.map((stage, index) => Object.freeze({
    ...stage,
    index,
    preview: 'assets/stone-year/' + stage.key + '.webp',
    mineral: 'assets/stone-year/' + stage.key + '.webp',
    environment: Object.freeze({
      position: '50% 50%',
      glow: stage.color,
      edge: '#deddd7',
      base: '#f2f1ee'
    })
  })));
})();
