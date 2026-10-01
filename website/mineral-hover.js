/* Directional artifact motion for the existing rendered stone collection.
   Shallow image layers provide edge depth; this is not a full mesh viewer. */
(() => {
  'use strict';
  window.HaloMineralHover = {
    create(collection) {
      if (!collection) return;
      const pointer = matchMedia('(hover: hover) and (pointer: fine)');
      const reduced = matchMedia('(prefers-reduced-motion: reduce)');
      const stones = new Map();
      let frame = 0, previousTime = 0;
      const clamp = value => Math.max(-1, Math.min(1, value));

      function prepare(button) {
        if (stones.has(button)) return stones.get(button);
        const window = button.querySelector('.mineral-window');
        const image = window.querySelector('img');
        image.draggable = false;
        const object = document.createElement('span');
        object.className = 'mineral-object';
        object.setAttribute('aria-hidden', 'true');
        for (let i = 4; i > 0; i--) {
          const edge = image.cloneNode(false);
          edge.className = 'mineral-edge';
          edge.style.setProperty('--edge-z', `${-i * 1.2}px`);
          object.append(edge);
        }
        const surface = document.createElement('span');
        surface.className = 'mineral-surface';
        surface.append(image);
        const sheen = document.createElement('span');
        sheen.className = 'mineral-sheen';
        sheen.style.maskImage = `url(${JSON.stringify(image.src)})`;
        const glint = document.createElement('span');
        glint.className = 'mineral-glint';
        sheen.append(glint);
        surface.append(sheen);
        object.append(surface);
        window.append(object);
        const state = {button, window, image, object, sheen, glint, active:false,
          phase:0, x:0, y:0, targetX:0, targetY:0, bounds:null};
        stones.set(button, state);
        return state;
      }

      function tick(time) {
        frame = 0;
        const dt = previousTime ? Math.min((time - previousTime) / 1000, .04) : 1 / 60;
        previousTime = time;
        const ease = 1 - Math.exp(-dt * 12);
        let moving = false;
        for (const state of stones.values()) {
          if (!state.active && state.phase === 0) continue;
          state.phase += ((state.active ? 1 : 0) - state.phase) * ease;
          state.x += (state.targetX - state.x) * ease;
          state.y += (state.targetY - state.y) * ease;
          if (!state.active && state.phase < .002) {
            restore(state);
            continue;
          }
          const p = state.phase, x = state.x, y = state.y;
          const drift = Math.sin(time / 1300);
          const lift = (-16 + Math.sin(time / 850) * 1.8) * p;
          state.object.style.transform = `perspective(480px) translate3d(${x * 3 * p}px,${lift}px,0) rotateX(${(10 - y * 16) * p}deg) rotateY(${(x * 30 + drift * 4) * p}deg) rotateZ(${(-90 + x * 5) * p}deg) scale(${1 + .08 * p})`;
          state.sheen.style.opacity = String(p * .6);
          state.glint.style.transform = `translate3d(${x * 40 + drift * 16}%,${y * 20}%,0) rotate(${x * 12}deg)`;
          moving = true;
        }
        if (moving) frame = requestAnimationFrame(tick);
        else previousTime = 0;
      }
      function wake() {
        if (!frame) frame = requestAnimationFrame(tick);
      }
      function restore(state) {
        state.active = false; state.phase = 0;
        state.x = state.y = state.targetX = state.targetY = 0;
        state.object.style.removeProperty('transform');
        state.sheen.style.removeProperty('opacity');
        state.glint.style.removeProperty('transform');
        state.button.classList.remove('mineral-awake');
      }
      function reset() {
        cancelAnimationFrame(frame); frame = 0; previousTime = 0;
        stones.forEach((state, button) => {
          restore(state);
          if (!collection.contains(button)) stones.delete(button);
        });
      }
      function aim(state, event) {
        const b = state.bounds;
        state.targetX = clamp((event.clientX - b.left) / b.width * 2 - 1);
        state.targetY = clamp((event.clientY - b.top) / b.height * 2 - 1);
      }
      const enter = (button, event) => {
        if (!pointer.matches || reduced.matches || event.pointerType === 'touch') return;
        const state = prepare(button);
        state.bounds = state.window.getBoundingClientRect();
        // The mask follows the catalog framing, including either sprite family.
        const framing = getComputedStyle(state.image);
        state.sheen.style.width = framing.width;
        state.sheen.style.height = framing.height;
        state.sheen.style.transformOrigin = framing.transformOrigin;
        state.sheen.style.transform = framing.transform + ' translateZ(1px)';
        state.active = true;
        button.classList.add('mineral-awake');
        aim(state, event); wake();
      };
      const leave = button => {
        const state = stones.get(button);
        if (!state?.active) return;
        if (state.phase === 0) { restore(state); return; }
        state.active = false; state.targetX = state.targetY = 0;
        wake();
      };
      // Delegation also covers carousel copies created after a breakpoint change.
      collection.addEventListener('pointerover', event => {
        const button = event.target.closest('.mineral');
        if (button && !button.contains(event.relatedTarget)) enter(button, event);
      });
      collection.addEventListener('pointermove', event => {
        const button = event.target.closest('.mineral');
        if (!button) return;
        const state = stones.get(button);
        if (state?.active) aim(state, event);
        else enter(button, event);
      }, {passive:true});
      collection.addEventListener('pointerout', event => {
        const button = event.target.closest('.mineral');
        if (button && !button.contains(event.relatedTarget)) leave(button);
      });
      collection.addEventListener('pointercancel', reset);
      // Nothing runs offscreen, on touch, or after the pointer loses its context.
      window.addEventListener('blur', reset);
      window.addEventListener('resize', reset, {passive:true});
      window.addEventListener('scroll', reset, {passive:true});
      collection.addEventListener('scroll', reset, {passive:true});
      window.addEventListener('keydown', reset);
      document.addEventListener('visibilitychange', () => { if (document.hidden) reset(); });
      reduced.addEventListener('change', reset);
      pointer.addEventListener('change', reset);
    }
  };
})();
