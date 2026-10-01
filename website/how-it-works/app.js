(() => {
  'use strict';
  const stones = window.HALO_YEAR_COLLECTION.stones;
  const stages = window.HALO_EVOLUTION.stages;
  const $ = id => document.getElementById(id);
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const count = stones.length;
  const braceletPath = installed => installed === 0
    ? '../assets/bracelet-year/empty.webp'
    : `../assets/bracelet-year/progress-${String(installed).padStart(2, '0')}.webp`;
  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }
  // Material names, colors, drawer messages and controls all share one catalog.
  stones.forEach((stone, index) => {
    const button = element('button', '', stone.compartment);
    button.type = 'button';
    button.dataset.month = index;
    button.setAttribute('aria-label', `${stone.timeLabel}: ${stone.name}, ${stone.chapter}`);
    button.setAttribute('aria-pressed', 'false');
    $('month-controls').append(button);

    const drawer = element('div', 'case-position');
    drawer.dataset.casePosition = index;
    const interior = element('div', 'drawer-interior');
    interior.append(element('span', '', `Chapter ${stone.compartment}`), element('p', '', stone.beneathMessage));
    const face = element('div', 'drawer-face');
    const handle = element('i');
    handle.setAttribute('aria-hidden', 'true');
    face.append(element('span', '', stone.compartment), handle);
    drawer.append(interior, face);
    $('case-progress-grid').append(drawer);

    const figure = element('figure', 'case-mineral');
    const choice = element('button', 'collection-stone');
    choice.type = 'button';
    choice.dataset.collectionMonth = index;
    choice.setAttribute('aria-label', `Explore ${stone.timeLabel.toLowerCase()}: ${stone.name}, ${stone.chapter}`);
    const swatch = element('img', 'year-stone');
    swatch.src = stone.image;
    swatch.alt = '';
    swatch.width = 362;
    swatch.height = 362;
    swatch.loading = 'lazy';
    swatch.decoding = 'async';
    choice.append(swatch, element('small', '', stone.compartment), element('strong', '', stone.name));
    figure.append(choice);
    $('case-minerals').append(figure);
  });
  document.querySelectorAll('[data-stone-month]').forEach(node => {
    const stone = stones.find(item => item.month === Number(node.dataset.stoneMonth));
    if (stone) {
      node.src = stone.image;
      node.alt = `${stone.name} material visualization`;
    }
  });
  const monthButtons = [...document.querySelectorAll('button[data-month]')];
  let month = 0;
  [0, 2, 5, 8, 11].forEach(index => {
    const stage = stages[index], figure = document.createElement('figure');
    figure.innerHTML = window.HaloEvolutionArt.svg(stage, 'key-sequence') + `<figcaption><span>${String(stage.month).padStart(2, '0')}</span><strong>${stage.name}</strong></figcaption>`;
    $('evolution-key-sequence').append(figure);
  });
  function showCase(revealed, announce = true) {
    const stage = stages[Math.max(0, revealed - 1)];
    document.querySelectorAll('[data-case-position]').forEach((cell, i) => cell.classList.toggle('is-revealed', i < revealed));
    $('case-progress-grid').setAttribute('aria-label', `${revealed} drawers emptied. ${count - revealed} stones still concealed.`);
    $('case-bracelet').src = braceletPath(revealed);
    $('case-bracelet').alt = `Halo I with ${revealed} installed stones and ${count - revealed} brushed-steel pellets. Design study.`;
    $('case-bracelet-label').textContent = revealed === count ? 'HALO I COMPLETE · Your year stays with you' : revealed === 1 ? 'Day 1 · Moonstone · Eleven steel pellets' : `${revealed} of ${count} stones installed`;
    $('case-progress-label').textContent = revealed === 0 ? 'Before the first stone · Twelve steel pellets' : revealed === 1 ? 'Day 1 · Your first chapter is open' : revealed === count ? 'The case is empty · The year is yours' : `${revealed} drawers emptied · ${count - revealed} still to reveal`;
    $('case-companion').innerHTML = window.HaloEvolutionArt.svg(stage, 'case');
    $('case-companion-label').textContent = revealed === 0 ? 'Luna · A beginning together' : revealed === count ? 'Luna · Year One evolution' : `Luna · Milestone ${revealed} · ${stage.name}`;
    document.querySelectorAll('[data-case-stage]').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.caseStage) === revealed)));
    if (announce) $('case-announcement').textContent = `${revealed} chapters revealed in the case. Luna, ${stage.name}.`;
  }
  document.querySelectorAll('[data-case-stage]').forEach(button => button.addEventListener('click', () => showCase(Number(button.dataset.caseStage))));
  showCase(1, false);
  function showMonth(index, announce = true, animate = true) {
    month = Math.max(0, Math.min(stones.length - 1, index));
    const stone = stones[month], stage = stages[month];
    const before = stages[Math.max(0, month - 1)];
    $('luna-before').innerHTML = window.HaloEvolutionArt.svg(before, 'before');
    $('luna-after').innerHTML = window.HaloEvolutionArt.svg(stage, 'after');
    $('luna-before-label').textContent = `${String(before.month).padStart(2, '0')} / ${before.name}`;
    $('luna-after-label').textContent = `${String(stage.month).padStart(2, '0')} / ${stage.name}`;
    $('luna-before').closest('figure').hidden = month === 0;
    document.querySelector('.monthly-arrow').hidden = month === 0;
    document.querySelector('.monthly-evolution').classList.toggle('is-arrival', month === 0);
    $('evolution-name').textContent = month === 0 ? 'The one you meet.' : `${stage.name} · Still Luna.`;
    $('evolution-change').textContent = stage.minimumVisibleChange;
    $('month-number').textContent = String(stone.month).padStart(2, '0');
    $('month-label').textContent = stone.timeLabel;
    $('stone-name').textContent = stone.name;
    $('stone-theme').textContent = stone.chapter;
    $('journey-bracelet').src = braceletPath(stone.month);
    $('journey-bracelet').alt = `Halo I with ${stone.month} installed stones and ${count - stone.month} brushed-steel pellets. Design study.`;
    $('journey-bracelet-label').textContent = stone.month === count ? 'HALO I COMPLETE · Every stone stays' : stone.month === 1 ? 'Day 1 · Moonstone · Eleven steel pellets' : `${stone.month} stones installed · ${count - stone.month} steel pellets for time ahead`;
    $('stone-story').textContent = stone.story;
    $('stone-texture').textContent = stone.texture;
    const image = $('active-stone');
    image.src = stone.image;
    image.alt = `${stone.name}, chapter ${stone.compartment}: ${stone.chapter}. Natural material visualization.`;
    $('stone-field').style.setProperty('--mineral', stone.color);
    $('drawer-study-label').textContent = `${stone.compartment} / ${stone.name} / ${stone.chapter}`;
    $('drawer-opening-message').textContent = stone.openingMessage;
    $('drawer-beneath-message').textContent = `“${stone.beneathMessage}”`;
    $('drawer-study-stone').src = stone.image;
    monthButtons.forEach((button, i) => button.setAttribute('aria-pressed', String(i === month)));
    $('previous-month').disabled = month === 0;
    $('next-month').disabled = month === stones.length - 1;
    if (announce) {
      $('month-announcement').textContent = `${stone.timeLabel}: ${stone.name}, ${stone.chapter}. Luna: ${stage.minimumVisibleChange}`;
      if (!reduced.matches && animate) { image.getAnimations().forEach(animation => animation.cancel()); image.animate([{opacity:.2, transform:'translateY(5px)'},{opacity:1, transform:'translateY(0)'}], {duration:220, easing:'cubic-bezier(.23,1,.32,1)'}); }
    }
  }
  monthButtons.forEach(button => button.addEventListener('click', event => showMonth(Number(button.dataset.month), true, event.detail !== 0)));
  $('previous-month').addEventListener('click', event => showMonth(month - 1, true, event.detail !== 0));
  $('next-month').addEventListener('click', event => showMonth(month + 1, true, event.detail !== 0));
  // Arrow keys are an optional shortcut; every month remains a normal keyboard button.
  $('month-controls').addEventListener('keydown', event => {
    if (!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
    event.preventDefault();
    const focusedMonth = Number(event.target.closest('[data-month]')?.dataset.month ?? month);
    showMonth(event.key === 'Home' ? 0 : event.key === 'End' ? stones.length - 1 : focusedMonth + (event.key === 'ArrowLeft' ? -1 : 1), true, false);
    monthButtons[month].focus();
  });
  document.querySelectorAll('[data-collection-month]').forEach(button => button.addEventListener('click', () => {
    showMonth(Number(button.dataset.collectionMonth));
    $('journey').scrollIntoView({behavior:reduced.matches ? 'instant' : 'smooth',block:'start'});
    monthButtons[month].focus({preventScroll:true});
  }));
  reduced.addEventListener('change', () => {
    if (reduced.matches) $('active-stone').getAnimations().forEach(animation => animation.cancel());
  });
  showMonth(0, false);
})();
