// Compatibility adapter: all monthly materials and messages come from the shared catalog.
window.HALO_YEAR_COLLECTION = Object.freeze({
  product: 'Halo I',
  status: 'Development concept; materials and secure activation require qualification.',
  scope: 'A local preview only. The authenticated Halo app owns earned progress.',
  stones: Object.freeze(window.HALO_I_CATALOG.map(stage => Object.freeze({
    month: stage.month,
    compartment: stage.compartment,
    key: stage.key,
    milestoneID: `halo-i-${stage.compartment}`,
    name: stage.stone,
    chapter: stage.chapter,
    color: stage.color,
    timeLabel: stage.timeLabel,
    image: `../assets/stone-year/${stage.key}.webp`,
    story: stage.firstReveal,
    meaning: stage.meaning,
    openingMessage: stage.firstReveal,
    beneathMessage: stage.beneathStone,
    texture: stage.material,
    variation: stage.variation,
    symbolism: stage.symbolism,
    sourceURLs: stage.sourceURLs
  })))
});
