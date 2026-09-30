(() => {
  'use strict';
  const stages = window.HALO_MILESTONES;
  const assetRoot = 'original/assets/';
  const lastStage = stages.length - 1;
  const monthLabel = s => 'Month ' + String(s.month).padStart(2, '0');
  const $ = id => document.getElementById(id);
  const collection=$('mineral-collection');
  stages.forEach((s,index)=>{
    const button=document.createElement('button');
    button.className='mineral';button.type='button';button.dataset.jump=index;
    button.setAttribute('aria-label',s.stone+', '+monthLabel(s)+'. Explore material study');
    const window=document.createElement('span');window.className='mineral-window';
    const img=document.createElement('img');img.src=assetRoot+'mineral-'+s.key+'-circular.webp';
    img.alt='';img.width=720;img.height=540;img.loading='lazy';window.append(img);
    const name=document.createElement('strong');name.textContent=s.stone;
    const label=document.createElement('span');label.textContent=monthLabel(s)+' / '+s.chapter;
    button.append(window,name,label);collection.append(button);
  });
  const journey=$('journey'), scene=$('wearable-scene');
  const current=$('stone-current'), next=$('stone-next');
  const preview=$('stage-screen'), timelineFill=$('timeline-fill');
  const buttons=[...document.querySelectorAll('[data-stage]')];
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  const previews=new Map();
  let active=-1, pair=-1, lockedStage=-1, start=0, travel=1, sceneHeight=0, pending=false, observer;
  let previewRequest=0, previewAnimation;
  const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
  const smooth=t=>{t=clamp(t);return t*t*(3-2*t);};
  const instantMotion=()=>reduced.matches||document.documentElement.dataset.motionInput==='keyboard';
  function preparePreview(s){
    if(!previews.has(s.preview)){
      const ready=new Promise((resolve,reject)=>{
        const image=new Image();
        image.onload=async()=>{
          try{
            if(image.decode) await image.decode();
            resolve(image);
          }catch(error){reject(error);}
        };
        image.onerror=reject;
        image.src=assetRoot+s.preview;
      }).catch(()=>{previews.delete(s.preview);return null;});
      previews.set(s.preview,ready);
    }
    return previews.get(s.preview);
  }
  async function updatePreview(index){
    const request=++previewRequest, s=stages[index];
    const image=await preparePreview(s);
    // A slow decode must never overwrite a newer selection. Keep the last good
    // image and its caption together if a request fails or is still loading.
    if(!image||request!==previewRequest) return;
    const changed=preview.src!==image.src;
    previewAnimation?.cancel();
    preview.src=image.src;
    preview.alt=s.stone+' digital material study';
    $('preview-day').textContent=monthLabel(s);
    $('preview-mineral').textContent=s.stone;
    if(changed&&!instantMotion()&&preview.animate){
      previewAnimation=preview.animate([{opacity:.65},{opacity:1}],{
        duration:180,easing:'cubic-bezier(0.23, 1, 0.32, 1)'
      });
    }
  }
  function setStage(index,announce=false){
    const s=stages[index];
    if(active!==index){
      active=index;
      $('stage-chapter').textContent=s.compartment+' / '+s.chapter;
      $('day-number').textContent=String(s.month).padStart(2,'0');
      $('day-unit').textContent=s.month===1?'month':'months';
      $('gem-name').textContent=s.stone;
      $('gem-story').textContent=s.firstReveal;
      $('gem-material').textContent=s.stone+' · Natural stone color study.';
      $('stage-count').textContent=String(index+1).padStart(2,'0')+' — '+String(stages.length).padStart(2,'0');
      updatePreview(index);
      scene.setAttribute('aria-label','Original single-stone Halo design study with '+s.stone.toLowerCase());
      journey.style.setProperty('--accent',s.color);
      buttons.forEach((b,i)=>b.setAttribute('aria-pressed',String(i===index)));
    }
    if(announce) $('stage-announcement').textContent=monthLabel(s)+': '+s.stone+'. '+s.firstReveal;
  }
  function measure(){
    const navHeight=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-height'));
    start=journey.getBoundingClientRect().top+window.scrollY-navHeight;
    travel=Math.max(1,journey.offsetHeight-(window.innerHeight-navHeight));
    sceneHeight=scene.clientHeight;
    requestRender();
  }
  function render(){
    pending=false;
    const position=clamp((window.scrollY-start)/travel)*lastStage;
    const from=Math.min(lastStage-1,Math.floor(position)), t=position-from;
    const selected=Math.min(lastStage,Math.floor(position+.5));
    setStage(selected);
    timelineFill.style.transform='scaleX('+position/lastStage+')';
    if(instantMotion()){
      previewAnimation?.cancel();
      if(lockedStage!==selected) current.src=assetRoot+'stone-'+stages[selected].key+'-circular.webp';
      current.style.transform='none';current.style.opacity='1';next.style.opacity='0';pair=-1;
      lockedStage=selected;
      return;
    }
    lockedStage=-1;
    if(pair!==from){
      pair=from;current.src=assetRoot+'stone-'+stages[from].key+'-circular.webp';next.src=assetRoot+'stone-'+stages[from+1].key+'-circular.webp';
    }
    // Lift, reveal the next mineral, then settle into the same receiver.
    const lift=smooth(t/.30)*(1-smooth((t-.70)/.30));
    const blend=smooth((t-.38)/.24);
    const liftPx=sceneHeight*.16*lift;
    const scale=1+.60*lift;
    current.style.transform=`translate3d(${blend*-10}px,${-liftPx}px,0) scale(${scale})`;
    next.style.transform=`translate3d(${(1-blend)*10}px,${-liftPx}px,0) scale(${scale})`;
    current.style.opacity=String(1-blend);next.style.opacity=String(blend);
  }
  function requestRender(){if(!pending){pending=true;requestAnimationFrame(render);}}
  function jump(index,keyboard=false){
    document.documentElement.dataset.motionInput=keyboard?'keyboard':'pointer';
    measure();
    buttons[index].focus({preventScroll:true});
    window.scrollTo({top:start+travel*index/lastStage,behavior:instantMotion()?'instant':'smooth'});
    $('stage-announcement').textContent=monthLabel(stages[index])+': '+stages[index].stone+'.';
  }
  buttons.forEach(b=>b.addEventListener('click',event=>jump(Number(b.dataset.stage),event.detail===0)));
  document.querySelectorAll('[data-jump]').forEach(b=>b.addEventListener('click',event=>jump(Number(b.dataset.jump),event.detail===0)));
  window.addEventListener('scroll',requestRender,{passive:true});
  window.addEventListener('resize',measure,{passive:true});
  ['keydown','pointerdown','wheel'].forEach(type=>window.addEventListener(type,requestRender,{passive:true}));
  reduced.addEventListener('change',requestRender);
  // Keep camera-locked stone layers ready before the scroll sequence starts.
  stages.forEach(s=>{const image=new Image();image.src=assetRoot+'stone-'+s.key+'-circular.webp';});
  observer=new IntersectionObserver(entries=>{
    if(entries.some(e=>e.isIntersecting)){
      stages.forEach(preparePreview);observer.disconnect();
    }
  },{rootMargin:'500px'});
  observer.observe(journey);
  if('ResizeObserver' in window){
    const layoutObserver=new ResizeObserver(measure);
    layoutObserver.observe(scene);layoutObserver.observe(journey);
  }
  measure();
  document.fonts.ready.then(measure);
  window.addEventListener('pageshow', measure);
})();
