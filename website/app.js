(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  // One catalog joins physical month and companion; recovery-day milestones remain separate.
  const stages = window.HALO_EVOLUTION.stages.map(stage => ({...stage, mineral: window.HALO_YEAR_COLLECTION.stones.find(s => s.month === stage.month)}));
  const last = stages.length - 1;
  const journey = $('journey'), sticky = journey.querySelector('.journey-stage'), scene = $('wearable-scene');
  const current = $('stone-current'), next = $('stone-next');
  const copy = $('stage-copy'), previewCopy = $('preview-copy');
  const companion = $('companion-current'), companionNext = $('companion-next');
  const controls = [...document.querySelectorAll('[data-stage]')];
  const timelineScroll = journey.querySelector('.timeline-scroll');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const art = stages.map(s => window.HaloEvolutionArt.svg(s, 'home'));
  const stonePath = index => `/halo-i/bracelet-${index + 1}-cutout.webp`;
  let active = -1, pair = -1, start = 0, travel = 1, sceneHeight = 0, pending = false, measuring = false;
  const clamp = x => Math.max(0, Math.min(1, x));
  const smooth = x => { x = clamp(x); return x * x * (3 - 2 * x); };
  function setStage(index) {
    if (active === index) return;
    active = index;
    const stage = stages[index], stone = stage.mineral, number = String(stage.month).padStart(2, '0');
    $('stage-chapter').textContent = `${number} / ${stage.name}`;
    $('day-number').textContent = number;
    $('day-unit').textContent = stage.month === 1 ? 'stone earned' : 'stones earned';
    $('gem-name').textContent = stone.name;
    $('gem-story').textContent = stone.story;
    $('gem-material').textContent = 'Natural stone. Individual character.';
    $('stage-count').textContent = `${number} — ${String(stages.length).padStart(2, '0')}`;
    $('preview-day').textContent = `${number} / ${stage.name}`;
    $('preview-mineral').textContent = index === 0 ? 'The one you meet.' : index === last ? 'A year together. Still Luna.' : 'Still your Luna.';
    scene.setAttribute('aria-label', `Halo I with ${stage.month} stones installed and ${12 - stage.month} empty receptacles. Latest stone: ${stone.name}. Concept preview.`);
    journey.dataset.month = stage.month;
    $('companion-layers').setAttribute('aria-label', `Luna, month ${number}: ${stage.name}. ${stage.minimumVisibleChange}`);
    journey.style.setProperty('--accent', stone.color);
    controls.forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
    // Follow the active month within the control strip without moving page or keyboard focus.
    const button = controls[index];
    const center = button.offsetLeft + button.offsetWidth / 2;
    timelineScroll.scrollLeft = Math.max(0, center - timelineScroll.clientWidth / 2);
  }
  function measure() {
    measuring = false;
    start = journey.getBoundingClientRect().top + scrollY - parseFloat(getComputedStyle(sticky).top);
    travel = Math.max(1, journey.offsetHeight - sticky.offsetHeight);
    sceneHeight = scene.clientHeight;
    requestRender();
  }
  function requestMeasure() { if (!measuring) { measuring = true; requestAnimationFrame(measure); } }
  function render() {
    pending = false;
    const position = clamp((scrollY - start) / travel) * last;
    const from = Math.min(last - 1, Math.floor(position));
    const t = position - from;
    const blend = smooth((t - .35) / .30);
    const selected = Math.min(last, Math.floor(position + .5));
    setStage(selected);
    $('timeline-fill').style.transform = `scaleX(${position / last})`;
    if (reduced.matches) {
      current.src = stonePath(selected); current.style.transform = 'none'; current.style.opacity = '1'; next.style.opacity = '0';
      if (pair !== selected) companion.innerHTML = art[selected];
      companion.style.opacity = '1'; companionNext.style.opacity = '0'; copy.style.opacity = '1'; previewCopy.style.opacity = '1';
      pair = selected; return;
    }
    if (pair !== from || companion.dataset.to !== String(from + 1)) {
      pair = from; companion.dataset.to = from + 1;
      current.src = stonePath(from); next.src = stonePath(from + 1);
      companion.innerHTML = art[from]; companionNext.innerHTML = art[from + 1];
    }
    const transform = 'none';
    current.style.transform = transform; next.style.transform = transform;
    current.style.opacity = String(1 - blend); next.style.opacity = String(blend);
    companion.style.opacity = String(1 - blend); companionNext.style.opacity = String(blend);
    // Labels change under a scroll-driven fade; reverse scrubbing has no timer or stale animation.
    const opacity = Math.abs(2 * blend - 1);
    copy.style.opacity = String(opacity); previewCopy.style.opacity = String(opacity);
  }
  function requestRender() { if (!pending) { pending = true; requestAnimationFrame(render); } }
  function jump(index, instant = false) {
    index = Math.max(0, Math.min(last, index)); measure();
    controls[index].focus({preventScroll: true});
    window.scrollTo({top: start + travel * index / last, behavior: reduced.matches || instant ? 'instant' : 'smooth'});
    const stage = stages[index];
    $('stage-announcement').textContent = `Month ${stage.month}: ${stage.mineral.name}. Luna, ${stage.name}. ${stage.mineral.story}`;
    requestRender();
  }
  controls.forEach((button, index) => button.addEventListener('click', event => jump(index, event.detail === 0)));
  journey.querySelector('.timeline').addEventListener('keydown', event => {
    if (!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
    const button = event.target.closest('[data-stage]'); if (!button) return;
    event.preventDefault();
    jump(event.key === 'Home' ? 0 : event.key === 'End' ? last : Number(button.dataset.stage) + (event.key === 'ArrowLeft' ? -1 : 1), true);
  });
  addEventListener('scroll', requestRender, {passive: true});
  addEventListener('resize', requestMeasure, {passive: true});
  addEventListener('pageshow', requestMeasure);
  reduced.addEventListener('change', () => { pair = -1; companion.dataset.to = ''; requestRender(); });
  new ResizeObserver(requestMeasure).observe(sticky);
  document.fonts.ready.then(requestMeasure);
  // Pre-rendered cumulative bracelet states keep scrolling deterministic without WebGL.
  stages.forEach((stage, index) => { const image = new Image(); image.src = stonePath(index); });
  measure();
})();
