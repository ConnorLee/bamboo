/* Original vector art-direction study. No production mesh or animation is implied.
   One Luna construction is varied by the canonical stage recipe; never 12 characters. */
(() => {
  'use strict';
  window.HaloEvolutionArt = {
    svg(stage, instance = 'study') {
      const c = stage.concept, m = stage.month;
      const id = `${instance}-${m}`.replace(/[^a-z0-9-]/gi, '');
      const mature = stage.form !== 'I', final = stage.form === 'III';
      const bodyH = 140 * c.bodyScale, headY = 345 - bodyH - 18;
      const faceW = final ? 75 : mature ? 67 : 64;
      const leg = c.wideStance ? 34 : 24;
      const accent = stage.visual.color;
      const path = (d, fill, extra = '') => `<path d="${d}" fill="${fill}" ${extra}/>`;
      const ear = (side) => {
        const x = 200 + side * 43, tipX = 200 + side * (mature ? 67 : 58);
        const tipY = headY - (final ? 120 : c.earPlumes ? 114 : c.earTufts ? 96 : 61);
        return path(`M${x-side*24} ${headY-13} Q${x+side*17} ${headY-38} ${tipX} ${tipY} Q${x+side*40} ${headY-17} ${x+side*17} ${headY+26}Z`, `url(#coat-${id})`, 'stroke="#7f9096" stroke-width="1.4"') +
          path(`M${x} ${headY-15} L${tipX} ${tipY+19} L${x+side*16} ${headY+4}Z`, c.earPlumes ? '#d2ddd8' : '#687a81');
      };
      let svg = `<svg class="luna-study" data-month="${m}" viewBox="0 0 400 420" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Concept of Luna, month ${m}: ${stage.name}. ${stage.minimumVisibleChange}"><title>Luna · Month ${m} · ${stage.name} — 2D concept only</title><defs><linearGradient id="coat-${id}" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#acaeaa"/><stop offset=".4" stop-color="#7d8789"/><stop offset="1" stop-color="#465762"/></linearGradient><linearGradient id="pale-${id}" x2=".6" y2="1"><stop stop-color="#e5ebe3"/><stop offset="1" stop-color="#b3c4c6"/></linearGradient></defs><ellipse cx="203" cy="370" rx="${final?137:107}" ry="12" fill="#121a21" opacity=".10"/>`;
      // The crescent tail, pale muzzle and eye geometry persist through all forms.
      svg += path(final ? 'M241 318 Q322 286 344 244 Q374 335 315 362 Q275 387 220 359Z' : mature ? 'M240 324 Q309 303 313 271 Q353 342 296 362 Q266 377 222 358Z' : 'M228 329 Q281 321 293 300 Q322 356 263 367 Q244 373 214 356Z',`url(#coat-${id})`);
      svg += path(`M158 ${345-bodyH} Q120 ${330-bodyH/2} ${c.wideStance?119:136} 343 Q148 367 202 363 Q257 369 ${c.wideStance?281:266} 343 Q278 ${320-bodyH/2} 242 ${345-bodyH}Z`,`url(#coat-${id})`);
      if(c.mantle) svg += path(`M145 ${350-bodyH} Q200 ${395-bodyH} 255 ${350-bodyH} L251 ${383-bodyH} Q200 ${435-bodyH} 149 ${383-bodyH}Z`,accent,'opacity=".86"');
      if(c.faceMask) svg += path(`M129 285 Q147 293 164 281 L163 299 Q145 314 128 305Z M271 285 Q253 293 236 281 L237 299 Q255 314 272 305Z`,accent);
      svg += path(`M${200-leg-16} ${310-bodyH/3} Q${200-leg-24} 326 ${200-leg-20} 355 Q${200-leg-5} 369 ${200-leg+10} 356 L${200-leg+16} ${314-bodyH/3}Z`,`url(#coat-${id})`);
      svg += path(`M${200+leg+16} ${310-bodyH/3} Q${200+leg+24} 326 ${200+leg+20} 355 Q${200+leg+5} 369 ${200+leg-10} 356 L${200+leg-16} ${314-bodyH/3}Z`,`url(#coat-${id})`);
      if(c.blaze) svg += path(`M167 ${headY+54} Q200 ${headY+79} 233 ${headY+54} L219 ${headY+126} Q200 ${headY+143} 181 ${headY+126}Z`, `url(#pale-${id})`);
      // Month 05's mantle must occupy a broad, visible part of the body, not a hidden edge.
      if(c.mantle && !c.ruff) svg += path(`M146 ${headY+67} L174 ${headY+74} L200 ${headY+98} L226 ${headY+74} L254 ${headY+67} L244 ${headY+106} L200 ${headY+143} L156 ${headY+106}Z`, accent, 'opacity=".94"');
      if(c.ruff) {
        const width = c.ruff===3?107:c.ruff===2?99:84;
        svg += path(`M163 ${headY+22} L${200-width} ${headY+58} L${217-width} ${headY+68} L${206-width} ${headY+90} L${238-width} ${headY+91} L151 ${headY+125} L180 ${headY+116} L200 ${headY+(c.ruff>1?164:138)} L220 ${headY+116} L249 ${headY+125} L${162+width} ${headY+91} L${194+width} ${headY+90} L${183+width} ${headY+68} L${200+width} ${headY+58} L237 ${headY+22}Z`, final?'url(#pale-'+id+')':'url(#coat-'+id+')');
        svg += path(`M162 ${headY+56} L200 ${headY+99} L238 ${headY+56} L224 ${headY+97} L200 ${headY+121} L176 ${headY+97}Z`, final ? '#657b89' : accent,'opacity=".9"');
      }
      if(c.cheekFan) svg += path(`M152 ${headY+20} L91 ${headY+22} L114 ${headY+42} L85 ${headY+56} L116 ${headY+68} L139 ${headY+87} L164 ${headY+43}Z M248 ${headY+20} L309 ${headY+22} L286 ${headY+42} L315 ${headY+56} L284 ${headY+68} L261 ${headY+87} L236 ${headY+43}Z`, c.ruff>1?'#afbfbf':'#879c94');
      svg += ear(-1)+ear(1);
      svg += path(`M200 ${headY-35} Q${200-faceW} ${headY-40} ${200-faceW} ${headY+13} L${190-faceW} ${headY+36} L${222-faceW} ${headY+58} Q200 ${headY+91} ${178+faceW} ${headY+58} L${210+faceW} ${headY+36} L${200+faceW} ${headY+13} Q${200+faceW} ${headY-40} 200 ${headY-35}Z`,`url(#coat-${id})`);
      if(c.faceMask) svg += path(`M134 ${headY-4} Q161 ${headY-26} 185 ${headY-3} L200 ${headY+26} L215 ${headY-3} Q239 ${headY-26} 266 ${headY-4} L262 ${headY+24} L229 ${headY+42} L200 ${headY+30} L171 ${headY+42} L138 ${headY+24}Z`, accent, 'opacity=".8"');
      if(c.blaze) svg += path(`M200 ${headY-30} L218 ${headY-7} L208 ${headY+28} L200 ${headY+41} L192 ${headY+28} L182 ${headY-7}Z`, `url(#pale-${id})`);
      if(c.earTufts) svg += path(`M134 ${headY+20} L166 ${headY+26} L184 ${headY+49} L146 ${headY+48}Z M266 ${headY+20} L234 ${headY+26} L216 ${headY+49} L254 ${headY+48}Z`, '#bdcccd');
      if(c.earPlumes) svg += path(`M141 ${headY-12} Q162 ${headY-29} 177 ${headY-14} L184 ${headY-3} Q160 ${headY-12} 141 ${headY-1}Z M259 ${headY-12} Q238 ${headY-29} 223 ${headY-14} L216 ${headY-3} Q240 ${headY-12} 259 ${headY-1}Z`, '#e1e4d5');
      svg += path(`M175 ${headY+26} Q186 ${headY+18} 200 ${headY+32} Q214 ${headY+18} 225 ${headY+26} L225 ${headY+53} Q200 ${headY+80} 175 ${headY+53}Z`, `url(#pale-${id})`);
      [-1,1].forEach(side=>{
        const x=200+side*35;
        svg+=`<ellipse cx="${x}" cy="${headY+13}" rx="12" ry="${m>1?8:6}" fill="#233442"/><ellipse cx="${x}" cy="${headY+13}" rx="${m>1?7:4}" ry="${m>1?6:4}" fill="#d6b36e"/><ellipse cx="${x}" cy="${headY+13}" rx="2.7" ry="5" fill="#293c48"/><circle cx="${x-2}" cy="${headY+11}" r="1.5" fill="#fff"/>`;
      });
      svg += path(`M188 ${headY+38} Q200 ${headY+31} 212 ${headY+38} L204 ${headY+48} Q200 ${headY+51} 196 ${headY+48}Z`, '#293d4b');
      svg += path(`M200 ${headY+50} L200 ${headY+57} M188 ${headY+58} Q200 ${headY+63} 212 ${headY+58}`, 'none', 'stroke="#788e96" stroke-width="1.7" stroke-linecap="round"');
      svg += '</svg>';
      return svg;
    }
  };
})();
