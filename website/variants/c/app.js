(() => {
  'use strict';
  const stones = window.HALO_YEAR_COLLECTION.stones;
  const stages = window.HALO_EVOLUTION.stages;
  const $ = id => document.getElementById(id);
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
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
    $('case-progress-grid').setAttribute('aria-label', `${revealed} chapters revealed. ${12 - revealed} stones still waiting.`);
    $('case-progress-label').textContent = revealed === 0 ? 'The beginning · Twelve stones waiting' : `${revealed} chapters revealed · ${12 - revealed} still to come`;
    $('case-companion').innerHTML = window.HaloEvolutionArt.svg(stage, 'case');
    $('case-companion-label').textContent = revealed === 0 ? 'Luna · A beginning together' : `Luna · Month ${revealed} · ${stage.name}`;
    document.querySelectorAll('[data-case-stage]').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.caseStage) === revealed)));
    if (announce) $('case-announcement').textContent = `${revealed} chapters revealed in the case. Luna, ${stage.name}.`;
  }
  document.querySelectorAll('[data-case-stage]').forEach(button => button.addEventListener('click', () => showCase(Number(button.dataset.caseStage))));
  showCase(0, false);
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
    $('stone-name').textContent = stone.name;
    $('stone-story').textContent = stone.story;
    $('stone-texture').textContent = stone.texture;
    const image = $('active-stone');
    image.style.setProperty('--x', `${[0.7,33.7,66.5,99.4][month % 4]}%`);
    image.style.setProperty('--y', `${[3.2,49.1,94.8][Math.floor(month / 4)]}%`);
    image.setAttribute('aria-label', `${stone.name}, proposed month ${stone.month} natural stone`);
    $('stone-field').style.setProperty('--mineral', stone.color);
    monthButtons.forEach((button, i) => button.setAttribute('aria-pressed', String(i === month)));
    $('previous-month').disabled = month === 0;
    $('next-month').disabled = month === stones.length - 1;
    if (announce) {
      $('month-announcement').textContent = `Luna, month ${stone.month}: ${stage.name}. ${stone.name}. ${stage.minimumVisibleChange}`;
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
  function chooseFinish(finish) {
    const dark = finish === 'dark';
    document.querySelectorAll('[data-finish]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.finish === finish)));
    const image = $('finish-image');
    image.src = dark ? 'assets/hero-amethyst-dark-pvd.png' : 'assets/hero-amethyst-solid.png';
    image.alt = `Halo bracelet in ${dark ? 'Dark black PVD' : 'Light natural'} stainless steel with a solid amethyst stone. Design concept.`;
    $('finish-name').textContent = dark ? 'Dark — Black PVD stainless steel' : 'Light — Natural stainless steel';
    $('selected-finish').textContent = `${dark ? 'Dark' : 'Light'} finish · Twelve-stone design study`;
    $('finish-announcement').textContent = `${dark ? 'Dark' : 'Light'} selected. Design preview only. Pricing and availability to be announced.`;
  }
  document.querySelectorAll('[data-finish]').forEach(button => button.addEventListener('click', () => chooseFinish(button.dataset.finish)));
  reduced.addEventListener('change', () => {
    if (reduced.matches) $('active-stone').getAnimations().forEach(animation => animation.cancel());
  });
  showMonth(5, false);
})();
