/* A native scrolling carousel with repeated visual buffers. Only the original
   twelve stones participate in keyboard and screen-reader navigation. */
(() => {
  'use strict';
  window.HaloMineralCarousel = {
    create(row) {
      if (!row) return;
      const compact = matchMedia('(max-width: 1180px), (hover: none) and (pointer: coarse)');
      const reduced = matchMedia('(prefers-reduced-motion: reduce)');
      const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
      const originals = [...row.children];
      const templates = originals.map(button => button.cloneNode(true));
      const shell = document.createElement('div');
      shell.className = 'mineral-carousel';
      row.before(shell); shell.append(row);
      const controls = document.createElement('div');
      controls.className = 'mineral-carousel-controls';
      const toggle = document.createElement('button');
      toggle.type = 'button'; toggle.className = 'mineral-carousel-toggle';
      toggle.innerHTML = '<svg aria-hidden="true" viewBox="0 0 16 16"><path class="carousel-pause-icon" d="M5 4v8M11 4v8"/><path class="carousel-play-icon" d="m5 3 7 5-7 5Z"/></svg><span>Pause</span>';
      controls.append(toggle); shell.append(controls);
      let copies = [], enabled = false, visible = false, userPaused = false;
      let touching = false, hovering = false, focused = false, windowFocused = true, suspended = false;
      let cycle = 0, position = 0, expectedScroll = -1, frame = 0, lastTime = 0;
      let resumeAt = 0, resumeTimer = 0, settleTimer = 0;
      const modulo = (value, size) => ((value % size) + size) % size;

      function writePosition(value) {
        position = value; expectedScroll = value;
        row.scrollLeft = value;
      }
      function stop() {
        cancelAnimationFrame(frame); frame = 0; lastTime = 0;
        position = row.scrollLeft;
      }
      function canPlay() {
        return enabled && !suspended && cycle > 0 && visible && windowFocused && !document.hidden && !reduced.matches &&
          !userPaused && !touching && !hovering && !focused && performance.now() >= resumeAt;
      }
      function tick(time) {
        frame = 0;
        if (!canPlay()) { lastTime = 0; return; }
        const dt = lastTime ? Math.min((time - lastTime) / 1000, .05) : 0;
        lastTime = time;
        // Accumulate fractional pixels independently of scrollLeft rounding.
        writePosition(cycle + modulo(position - cycle + dt * 22, cycle));
        frame = requestAnimationFrame(tick);
      }
      function updatePlayback() {
        clearTimeout(resumeTimer);
        if (canPlay()) {
          if (!frame) { position = row.scrollLeft; frame = requestAnimationFrame(tick); }
        } else {
          stop();
          if (enabled && resumeAt > performance.now()) {
            resumeTimer = setTimeout(updatePlayback, resumeAt - performance.now() + 20);
          }
        }
      }
      function restFor(milliseconds = 2400) {
        resumeAt = performance.now() + milliseconds;
        updatePlayback();
      }
      function settle() {
        clearTimeout(settleTimer);
        // Rebasing during an active swipe interrupts native iOS momentum.
        if (!enabled || touching || focused || !cycle) return;
        writePosition(cycle + modulo(row.scrollLeft - cycle, cycle));
        updatePlayback();
      }
      function measure() {
        if (!enabled) return;
        const progress = cycle ? modulo(row.scrollLeft - cycle, cycle) / cycle : 0;
        cycle = originals[0].offsetLeft - copies[0].offsetLeft;
        if (cycle > 0) writePosition(cycle * (1 + progress));
        updatePlayback();
      }
      function sync() {
        stop();
        if (compact.matches !== enabled) {
          enabled = compact.matches;
          shell.classList.toggle('is-looping', enabled);
          if (enabled) {
            const copy = () => templates.map(template => {
              const button = template.cloneNode(true);
              button.dataset.carouselCopy = '';
              button.setAttribute('aria-hidden', 'true'); button.tabIndex = -1;
              return button;
            });
            const before = copy(), after = copy();
            row.prepend(...before); row.append(...after); copies = [...before, ...after];
            shell.setAttribute('role', 'region');
            shell.setAttribute('aria-label', 'Monthly stones');
            shell.setAttribute('aria-roledescription', 'carousel');
          } else {
            copies.forEach(button => button.remove()); copies = []; cycle = 0;
            writePosition(0);
            shell.removeAttribute('role'); shell.removeAttribute('aria-label');
            shell.removeAttribute('aria-roledescription');
          }
        }
        controls.hidden = !enabled || reduced.matches;
        if (enabled) measure();
      }
      toggle.addEventListener('click', () => {
        userPaused = !userPaused;
        toggle.setAttribute('aria-label', userPaused ? 'Play stone carousel' : 'Pause stone carousel');
        toggle.setAttribute('aria-pressed', String(userPaused));
        toggle.querySelector('span').textContent = userPaused ? 'Play' : 'Pause';
        updatePlayback();
      });
      toggle.setAttribute('aria-label', 'Pause stone carousel');
      toggle.setAttribute('aria-pressed', 'false');
      row.addEventListener('pointerdown', () => { touching = true; stop(); }, {passive:true});
      const release = () => {
        if (!touching) return;
        touching = false; restFor();
        settleTimer = setTimeout(settle, 160);
      };
      window.addEventListener('pointerup', release, {passive:true});
      window.addEventListener('pointercancel', release, {passive:true});
      row.addEventListener('pointerenter', event => {
        if (finePointer.matches && event.pointerType !== 'touch') { hovering = true; updatePlayback(); }
      });
      row.addEventListener('pointerleave', () => { hovering = false; updatePlayback(); });
      row.addEventListener('wheel', () => restFor(), {passive:true});
      row.addEventListener('scroll', () => {
        if (!enabled || Math.abs(row.scrollLeft - expectedScroll) < 1.5) return;
        restFor();
        clearTimeout(settleTimer); settleTimer = setTimeout(settle, 160);
      }, {passive:true});
      row.addEventListener('scrollend', () => { if (!frame) settle(); }, {passive:true});
      row.addEventListener('focusin', event => {
        if (!event.target.matches(':focus-visible')) return;
        focused = true; stop();
        if (enabled) {
          const item = event.target.getBoundingClientRect(), viewport = row.getBoundingClientRect();
          writePosition(row.scrollLeft + item.left + item.width / 2 - viewport.left - viewport.width / 2);
        }
      });
      row.addEventListener('focusout', () => queueMicrotask(() => {
        focused = row.contains(document.activeElement) && document.activeElement.matches(':focus-visible');
        updatePlayback();
      }));
      document.addEventListener('visibilitychange', updatePlayback);
      window.addEventListener('blur', () => { touching = false; windowFocused = false; stop(); });
      window.addEventListener('focus', () => { windowFocused = true; updatePlayback(); });
      compact.addEventListener('change', sync);
      reduced.addEventListener('change', sync);
      finePointer.addEventListener('change', () => {
        hovering = finePointer.matches && row.matches(':hover'); updatePlayback();
      });
      new ResizeObserver(measure).observe(row);
      new IntersectionObserver(entries => {
        visible = entries[0].isIntersecting; updatePlayback();
      }).observe(row);
      sync();
      return {setSuspended(value) { suspended = value; updatePlayback(); }};
    }
  };
})();
