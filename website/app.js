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
  const buttons=[...document.querySelectorAll('[data-stage]')];
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  let active=-1, pair=-1, start=0, travel=1, pending=false, observer;
  const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
  const smooth=t=>{t=clamp(t);return t*t*(3-2*t);};
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
      $('stage-screen').src=assetRoot+s.preview;
      $('stage-screen').alt=s.stone+' digital material study';
      $('preview-day').textContent=monthLabel(s);
      $('preview-mineral').textContent=s.stone;
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
    requestRender();
  }
  function render(){
    pending=false;
    const position=clamp((window.scrollY-start)/travel)*lastStage;
    const from=Math.min(lastStage-1,Math.floor(position)), t=position-from;
    const selected=Math.min(lastStage,Math.floor(position+.5));
    setStage(selected);
    $('timeline-fill').style.width=(position/lastStage*100)+'%';
    if(reduced.matches){
      current.src=assetRoot+'stone-'+stages[selected].key+'-circular.webp';
      current.style.transform='none';current.style.opacity='1';next.style.opacity='0';pair=-1;
      return;
    }
    if(pair!==from){
      pair=from;current.src=assetRoot+'stone-'+stages[from].key+'-circular.webp';next.src=assetRoot+'stone-'+stages[from+1].key+'-circular.webp';
    }
    // Lift, reveal the next mineral, then settle into the same receiver.
    const lift=smooth(t/.30)*(1-smooth((t-.70)/.30));
    const blend=smooth((t-.38)/.24);
    const liftPx=scene.clientHeight*.16*lift;
    const scale=1+.60*lift;
    current.style.transform=`translate3d(${blend*-10}px,${-liftPx}px,0) scale(${scale})`;
    next.style.transform=`translate3d(${(1-blend)*10}px,${-liftPx}px,0) scale(${scale})`;
    current.style.opacity=String(1-blend);next.style.opacity=String(blend);
  }
  function requestRender(){if(!pending){pending=true;requestAnimationFrame(render);}}
  function jump(index){
    measure();
    buttons[index].focus({preventScroll:true});
    window.scrollTo({top:start+travel*index/lastStage,behavior:reduced.matches?'instant':'smooth'});
    $('stage-announcement').textContent=monthLabel(stages[index])+': '+stages[index].stone+'.';
  }
  buttons.forEach(b=>b.addEventListener('click',()=>jump(Number(b.dataset.stage))));
  document.querySelectorAll('[data-jump]').forEach(b=>b.addEventListener('click',()=>jump(Number(b.dataset.jump))));
  window.addEventListener('scroll',requestRender,{passive:true});
  window.addEventListener('resize',measure,{passive:true});
  reduced.addEventListener('change',requestRender);
  // Keep camera-locked stone layers ready before the scroll sequence starts.
  stages.forEach(s=>{const image=new Image();image.src=assetRoot+'stone-'+s.key+'-circular.webp';});
  observer=new IntersectionObserver(entries=>{
    if(entries.some(e=>e.isIntersecting)){
      stages.forEach(s=>{const image=new Image();image.src=assetRoot+s.preview;});observer.disconnect();
    }
  },{rootMargin:'500px'});
  observer.observe(journey);
  measure();
  document.fonts.ready.then(measure);
  window.addEventListener('pageshow', measure);
})();
