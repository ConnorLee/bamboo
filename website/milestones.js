// Selected material studies from the full, canonical twelve-month collection.
// Asset numbers are historical render IDs, not earning thresholds.
(() => {
  // Art direction only: landscapes evoke the minerals, not their sourcing locations.
  // Atlas positions address the existing 4 × 3 Halo landscape study.
  const environments = {
    quartz: { position: '0% 0%', glow: '#34444f', edge: '#14252f', base: '#0a1119' },
    amethyst: { position: '100% 50%', glow: '#532875', edge: '#302048', base: '#130c20' },
    citrine: { position: '0% 50%', glow: '#69451b', edge: '#382b13', base: '#191208' },
    'green-tourmaline': { position: '33.333333% 50%', glow: '#1d5138', edge: '#152e27', base: '#081a13' },
    aquamarine: { position: '66.666667% 0%', glow: '#215467', edge: '#173c45', base: '#081922' },
    labradorite: { position: '100% 100%', glow: '#233a60', edge: '#154241', base: '#0a1121' },
    opal: { position: '33.333333% 0%', glow: '#264c58', edge: '#413354', base: '#0b1b25' }
  };
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
    return Object.freeze({ ...art, ...stage, environment: Object.freeze(environments[art.key]) });
  }));
})();
