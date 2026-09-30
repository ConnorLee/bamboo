// Compatibility adapter: all monthly materials and messages come from the shared catalog.
window.HALO_YEAR_COLLECTION = Object.freeze({
  product: 'Halo I',
  status: 'Development concept; materials and secure activation require qualification.',
  scope: 'A local preview only. The authenticated Halo app owns earned progress.',
  stones: Object.freeze(window.HALO_I_CATALOG.map(stage => Object.freeze({
    month: stage.month,
    compartment: stage.compartment,
    milestoneID: `halo-i-${stage.compartment}`,
    name: stage.stone,
    chapter: stage.chapter,
    color: stage.color,
    story: stage.firstReveal,
    openingMessage: stage.firstReveal,
    beneathMessage: stage.beneathStone,
    texture: `${stage.stone} · Proposed natural stone. Color study only.`
  })))
});
