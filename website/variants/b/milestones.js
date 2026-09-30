// Selected material studies from the full, canonical twelve-month collection.
// Asset numbers are historical render IDs, not earning thresholds.
(() => {
  const artwork = [
    { month: 1, key: 'quartz', preview: 'native-1-circular.webp' },
    { month: 2, key: 'amethyst', preview: 'native-7-circular.webp' },
    { month: 3, key: 'citrine', preview: 'native-30-circular.webp' },
    { month: 4, key: 'green-tourmaline', preview: 'native-60-circular.webp' },
    { month: 5, key: 'aquamarine', preview: 'native-90-circular.webp' },
    { month: 9, key: 'labradorite', preview: 'native-180-circular.webp' },
    { month: 12, key: 'opal', preview: 'native-365-circular.webp' }
  ];
  window.HALO_MILESTONES = Object.freeze(artwork.map(art => {
    const stage = window.HALO_I_CATALOG.find(item => item.month === art.month);
    return Object.freeze({ ...art, ...stage });
  }));
})();
