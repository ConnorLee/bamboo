/* Stone Module: a deterministic chapter of the existing journey, never an NFC API.
   Scroll position is the only state. No accounts, awards, or progress are written. */
(() => {
  'use strict';
  const duration=11.4;
  const scriptUrl=typeof document!=='undefined'?document.currentScript?.src:null;
  const clamp=v=>Math.min(1,Math.max(0,v));
  const smooth=v=>{v=clamp(v);return v*v*(3-2*v);};
  const between=(t,a,b)=>smooth((t-a)/(b-a));
  const mix=(a,b,t)=>a+(b-a)*t;
  const boundaries=[.7,1.4,2.1,2.8,3.7,5,7.2,9.4];
  const endpoints=[.45,1.05,1.75,2.45,3.2,4.65,6.55,8.12,10.8];
  function sample(position,instant=false){
    const time=Math.min(duration,Math.max(0,Number.isFinite(position)?position:0));
    let copy=boundaries.findIndex(end=>time<end);
    if(copy<0) copy=8;
    const t=instant?endpoints[copy]:time;
    const assembly=between(t,3.7,4.6);
    const approach=between(t,5.25,6.05);
    const transfer=between(t,7.25,8.05);
    const seat=between(t,8.25,8.7);
    const pelletLift=between(t,7.48,7.85);
    const pelletAway=between(t,7.85,8.1);
    const turn=between(t,8.72,9.15);
    const shield=between(t,9.65,10.55);
    return {
      time,copy,chapter:Math.max(0,copy-4),
      spread:between(t,0,.65)*(1-assembly),
      x:mix(mix(350,252,approach),350,transfer),
      y:mix(mix(260,92,approach),245,transfer)+100*seat,
      scale:mix(mix(1,.56,approach),.65,transfer),
      rotation:-16*transfer*(1-turn),
      cameraX:mix(mix(350,260,approach),350,transfer),
      cameraY:mix(260,320,seat),
      cameraZoom:mix(mix(mix(1.12,1.05,approach),1.3,seat),1.6,shield),
      phone:between(t,5,5.4)*(1-between(t,7.2,7.65)),
      recognition:between(t,6.1,6.45),
      bracelet:between(t,7.2,7.45),
      pelletLift,pelletAway,
      pellet:1-pelletAway,
      engraving:between(t,7.55,7.85)*(1-between(t,8.25,8.6)),
      rim:between(t,8.55,8.75),
      shield,seat,turn,
    };
  }
  function create(journey){
    const root=document.getElementById('stone-module');
    const art=document.getElementById('module-art');
    if(!root||!art) return null;
    const articles=[...root.querySelectorAll('[data-module-copy]')];
    const chapterButtons=[...root.querySelectorAll('[data-module-jump]')];
    const captions=['Natural gemstone','Protective seal','NFC · Exploratory option','Isolation layer · NFC study only','Stainless steel carrier','One stone. One earned milestone.','Optional tap interaction · Screen concept','Retention mechanism · Under evaluation','Inside the setting · Concept study'];
    const caption=document.getElementById('module-caption');
    const bar=document.getElementById('module-progress');
    let svg, parts, lastCopy=-1, lastState=sample(0), failed=false, loading;
    const ids=['module','gem','seal','nfc','ferrite','carrier','phone','recognition','bracelet','pellet','engraving','rim','cutaway'];
    const layerNames=['gem','seal','nfc','ferrite','carrier'];
    const offsets=[-130,-62,5,67,129];
    function draw(state){
      if(!parts) return;
      const alpha=(name,value)=>{if(parts[name]) parts[name].style.opacity=String(value);};
      parts.camera.setAttribute('transform',`translate(350 260) scale(${state.cameraZoom}) translate(${-state.cameraX} ${-state.cameraY})`);
      parts.module.setAttribute('transform',`translate(${state.x} ${state.y}) scale(${state.scale}) rotate(${state.rotation}) translate(-350 -260)`);
      layerNames.forEach((name,index)=>{
        parts[name].setAttribute('transform',`translate(0 ${offsets[index]*state.spread})`);
        const emphasis=(state.copy<5&&index!==state.copy) ? .68 : 1;
        // The installed stone stays seated. A local cutaway reveals the assembly;
        // no lifted stone or animated RF field implies proven shielding.
        alpha(name,emphasis*(1-state.shield*(name==='gem' ? .58 : .8)));
      });
      alpha('phone',state.phone);
      alpha('recognition',state.recognition);
      alpha('bracelet',state.bracelet);
      parts.pellet.setAttribute('transform',`translate(${-78*state.pelletAway} ${-92*state.pelletLift})`);
      alpha('pellet',state.pellet);
      alpha('engraving',state.engraving);
      alpha('rim',state.rim);
      alpha('cutaway',state.shield);
    }
    async function prepare(){
      if(loading) return loading;
      loading=(async()=>{
        try{
          const response=await fetch('assets/stone-module-scene.svg?v=solid-band-2');
          if(!response.ok) throw new Error('Module illustration unavailable');
          const source=await response.text();
          // This is a bundled, same-origin illustration, never user-supplied markup.
          const documentSvg=new DOMParser().parseFromString(source,'image/svg+xml');
          if(documentSvg.querySelector('parsererror')) throw new Error('Invalid module illustration');
          const element=documentSvg.documentElement;
          if(element.localName!=='svg'||ids.some(id=>!element.querySelector('#sm-'+id))) throw new Error('Incomplete module illustration');
          element.querySelectorAll('image').forEach(image=>{
            const href=image.getAttribute('href');
            if(href&&scriptUrl) image.setAttribute('href',new URL(href,scriptUrl).href);
          });
          svg=document.importNode(element,true);
          const camera=document.createElementNS('http://www.w3.org/2000/svg','g');
          [...svg.children].filter(node=>node.localName!=='defs').forEach(node=>camera.append(node));
          svg.append(camera);
          art.replaceChildren(svg);
          parts=Object.fromEntries(ids.map(id=>[id,svg.querySelector('#sm-'+id)]));
          parts.camera=camera;
          // This construction study uses Opal; its private mark comes from the
          // same chapter record as the stone details, never the geometric seat.
          const engraving=window.HALO_I_CATALOG?.find(stone=>stone.key==='opal')?.engraving;
          if(engraving) parts.engraving.querySelectorAll('path').forEach(path=>path.setAttribute('d',engraving.path));
          draw(lastState);
          root.dataset.illustration='ready';
        }catch(error){
          failed=true;
          root.dataset.illustration='fallback';
          caption.textContent='Illustration unavailable. Follow the stone’s story above.';
        }
      })();
      return loading;
    }
    function render(position,instant=false){
      lastState=sample(position,instant);
      if(lastState.copy!==lastCopy){
        lastCopy=lastState.copy;
        articles.forEach((article,index)=>article.hidden=index!==lastCopy);
        chapterButtons.forEach((button,index)=>{
          if(index===lastState.chapter) button.setAttribute('aria-current','step');
          else button.removeAttribute('aria-current');
        });
        root.dataset.phase=['layers','one-stone','tap','lock','wear'][lastState.chapter];
        if(!failed) caption.textContent=captions[lastCopy];
      }
      if(lastState.copy===6&&!failed) {
        caption.textContent=lastState.recognition>.9?'Optional stone recognition · Concept':captions[6];
      }
      if(lastState.copy===7&&!failed) {
        caption.textContent=lastState.seat>=1?'Metal becomes stone · Retention study':lastState.seat>0?'The stone covers the chapter mark':lastState.pelletLift>=1?'A private chapter mark · Engraved in the seat':lastState.pelletLift>0?'Lift the brushed-steel pellet':'The year begins in metal';
      }
      bar.style.transform='scaleX('+lastState.time/duration+')';
      draw(lastState);
    }
    return {duration,root,render,prepare,focus(){
      const heading=articles[lastCopy<0?0:lastCopy].querySelector('h4');
      heading.tabIndex=-1;heading.focus({preventScroll:true});
    }};
  }
  if(typeof module!=='undefined'&&module.exports) module.exports={sample,duration};
  else window.HaloStoneModule={create};
})();
