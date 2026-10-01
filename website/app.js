(() => {
  'use strict';
  const stages = window.HALO_MILESTONES;
  const lastStage = stages.length - 1;
  const monthLabel = s => s.month === 1 ? 'Day 1' : 'Month ' + String(s.month).padStart(2, '0');
  const $ = id => document.getElementById(id);
  const collection=$('mineral-collection');
  window.HaloMineralCollection?.create(collection);
  // The restored Year One case shares the loose-stone collection’s order.
  const yearStones=$('year-stones');
  const yearCollection=window.HaloMineralCollection?.stones ?? stages;
  if(yearStones) yearCollection.forEach(stage=>{
    const item=document.createElement('li');
    const month=document.createElement('span');month.className='year-case-month';
    month.textContent='Month '+String(stage.month).padStart(2,'0');
    const stone=document.createElement('span');stone.className='year-case-stone';
    stone.textContent=stage.stone;
    item.append(month,stone);yearStones.append(item);
  });
  const journey=$('journey'), scene=$('wearable-scene');
  const bracelet=HaloBracelet.create(scene,stages);
  const moduleStory=window.HaloStoneModule?.create(journey);
  const finale=window.HaloYearFinale?.create(journey,scene);
  const monthlyView=journey.querySelector('.journey-inner');
  // Add the celebration after the existing Month 12 hold. Scale total travel
  // proportionally so each original monthly/module unit keeps the same pace.
  const monthlyDuration=6;
  const finaleStart=monthlyDuration+.8;
  const moduleStart=finaleStart+(finale?.duration||0);
  const previousUnits=moduleStory?finaleStart+moduleStory.duration:monthlyDuration;
  const totalUnits=moduleStory?moduleStart+moduleStory.duration:finale?moduleStart:monthlyDuration;
  if(moduleStory) journey.classList.add('has-module');
  if(finale){journey.classList.add('has-finale');journey.style.setProperty('--journey-duration-ratio',String(totalUnits/previousUnits));}
  let storyMode='';
  function setStoryMode(mode){
    if(storyMode===mode) return;
    storyMode=mode;journey.dataset.story=mode;
    const isModule=mode==='module';
    monthlyView.style.visibility=isModule?'hidden':'';
    monthlyView.inert=mode!=='stones';
    monthlyView.setAttribute('aria-hidden',String(mode!=='stones'));
    finale?.setActive(mode==='finale');
    if(moduleStory){moduleStory.root.hidden=!isModule;if(isModule) moduleStory.prepare();}
  }
  const preview=$('stage-screen'), timelineFill=$('timeline-fill');
  const buttons=[...document.querySelectorAll('[data-stage]')];
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  const worlds=$('journey-worlds');
  const worldLayers=stages.map(s=>{
    const layer=document.createElement('div');
    layer.className='journey-world';layer.dataset.world=s.key;
    Object.entries(s.environment).forEach(([key,value])=>layer.style.setProperty('--world-'+key,value));
    worlds.append(layer);
    return layer;
  });
  let visibleWorlds='';
  let active=-1, start=0, travel=1, pending=false, observer;
  let previewAnimation, previewRequest=0;
  const previews=new Map();
  const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
  const smooth=t=>{t=clamp(t);return t*t*(3-2*t);};
  const instantMotion=()=>reduced.matches||document.documentElement.dataset.motionInput==='keyboard';
  function renderWorld(from,to,blend){
    const visible=from+':'+to;
    if(visibleWorlds!==visible){
      visibleWorlds=visible;
      worldLayers.forEach((layer,index)=>{
        layer.style.visibility=index===from||index===to?'visible':'hidden';
      });
    }
    // The lower world stays opaque so the crossfade never dips to black.
    worldLayers[from].style.opacity='1';
    if(from!==to) worldLayers[to].style.opacity=String(blend);
  }
  function preparePreview(s){
    const url=s.preview||'assets/bracelet/gem-'+s.compartment+'.webp';
    if(!previews.has(url)) previews.set(url,new Promise(resolve=>{
      const image=new Image();
      image.onload=async()=>{try{await image.decode();resolve(image);}catch{previews.delete(url);resolve(null);}};
      image.onerror=()=>{previews.delete(url);resolve(null);};
      image.src=url;
    }));
    return previews.get(url);
  }
  async function updatePreview(index){
    const token=++previewRequest,s=stages[index];
    const decoded=await preparePreview(s);
    if(!decoded||token!==previewRequest) return;
    previewAnimation?.cancel();
    preview.src=decoded.src;
    preview.alt=s.stone+' natural material visualization';
    $('preview-day').textContent=monthLabel(s);
    $('preview-mineral').textContent=s.stone;
    if(!instantMotion()&&preview.animate){
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
      $('day-unit').textContent=s.month===1?'day':'months';
      $('gem-name').textContent=s.stone;
      $('gem-story').textContent=s.firstReveal;
      $('gem-material').textContent=index===0?'Your first stone. Eleven brushed-steel pellets for the time ahead.':index===lastStage?'Twelve chapters. Twelve earned stones.':s.month+' stones carried. '+(stages.length-s.month)+' brushed-steel pellets for the time ahead.';
      $('stage-count').textContent=String(index+1).padStart(2,'0')+' — '+String(stages.length).padStart(2,'0');
      updatePreview(index);
      journey.style.setProperty('--accent',s.color);
      journey.dataset.world=s.key;
      buttons.forEach((b,i)=>b.setAttribute('aria-pressed',String(i===index)));
      const selectedButton=buttons[index],rail=selectedButton.parentElement;
      if(selectedButton.offsetLeft<rail.scrollLeft||selectedButton.offsetLeft+selectedButton.offsetWidth>rail.scrollLeft+rail.clientWidth) rail.scrollTo({left:selectedButton.offsetLeft-rail.clientWidth/2+selectedButton.offsetWidth/2,behavior:'instant'});
      window.dispatchEvent(new CustomEvent('halo:stone-change',{detail:{index,stone:s}}));
      const completeYear=journey.querySelector('[data-year-finale]');
      if(completeYear) completeYear.hidden=index!==lastStage||!finale;
    }
    if(announce) $('stage-announcement').textContent=monthLabel(s)+': '+s.stone+'. '+s.firstReveal;
  }
  function measure(){
    const navHeight=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-height'));
    start=journey.getBoundingClientRect().top+window.scrollY-navHeight;
    travel=Math.max(1,journey.offsetHeight-(window.innerHeight-navHeight));
    finale?.measure();
    requestRender();
  }
  function render(){
    pending=false;
    const absolutePosition=clamp((window.scrollY-start)/travel)*totalUnits;
    const isModule=moduleStory&&absolutePosition>=moduleStart;
    const isFinale=finale&&!isModule&&absolutePosition>=finaleStart;
    setStoryMode(isModule?'module':isFinale?'finale':'stones');
    if(isModule){
      renderWorld(lastStage,lastStage,0);
      previewAnimation?.cancel();
      moduleStory.render(absolutePosition-moduleStart,instantMotion());
      return;
    }
    if(isFinale){
      bracelet.render(lastStage,true);setStage(lastStage);
      timelineFill.style.transform='scaleX(1)';
      renderWorld(lastStage,lastStage,0);previewAnimation?.cancel();
      finale.render(absolutePosition-finaleStart,instantMotion());
      return;
    }
    const position=Math.min(lastStage,absolutePosition/monthlyDuration*lastStage);
    const from=Math.min(lastStage-1,Math.floor(position)), t=position-from;
    const selected=Math.min(lastStage,Math.floor(position+.5));
    if(selected>=10) finale?.prepare(true);
    bracelet.render(position,instantMotion());
    setStage(selected);
    timelineFill.style.transform='scaleX('+position/lastStage+')';
    if(instantMotion()){
      renderWorld(selected,selected,0);
      previewAnimation?.cancel();
      return;
    }
    const blend=smooth((t-.38)/.24);
    renderWorld(from,from+1,blend);
  }
  function requestRender(){if(!pending){pending=true;requestAnimationFrame(render);}}
  function jump(index,keyboard=false){
    index=clamp(index,0,lastStage);
    document.documentElement.dataset.motionInput=keyboard?'keyboard':'pointer';
    measure();
    setStoryMode('stones');
    buttons[index].focus({preventScroll:true});
    window.scrollTo({top:start+travel*(index/lastStage*monthlyDuration)/totalUnits,behavior:instantMotion()?'instant':'smooth'});
    $('stage-announcement').textContent=monthLabel(stages[index])+': '+stages[index].stone+'.';
  }
  document.querySelectorAll('[data-module-jump]').forEach(button=>button.addEventListener('click',event=>{
    if(!moduleStory) return;
    document.documentElement.dataset.motionInput=event.detail===0?'keyboard':'pointer';
    measure();
    const position=Number(button.dataset.moduleJump);
    // Chapter selection is immediate; direct scrolling supplies the choreography.
    window.scrollTo({top:start+travel*(moduleStart+position+.001)/totalUnits,behavior:'instant'});
    render();
    if(event.detail===0||!moduleStory.root.contains(button)) moduleStory.focus();
  }));
  document.querySelectorAll('[data-return-stones]').forEach(button=>button.addEventListener('click',event=>jump(lastStage,event.detail===0)));
  function jumpFinale(keyboard){
    if(!finale) return;
    document.documentElement.dataset.motionInput=keyboard?'keyboard':'pointer';
    measure();
    window.scrollTo({top:start+travel*(finaleStart+finale.duration-.25)/totalUnits,behavior:'instant'});
    render();finale.focus();
  }
  document.querySelector('[data-year-finale]')?.addEventListener('click',event=>jumpFinale(event.detail===0));
  buttons.forEach(b=>b.addEventListener('click',event=>jump(Number(b.dataset.stage),event.detail===0)));
  document.addEventListener('click',event=>{
    const button=event.target.closest('[data-jump]');
    if(button) jump(Number(button.dataset.jump),event.detail===0);
  });
  // Horizontal input joins the same scroll-driven state; it never owns a second month.
  const timeline=journey.querySelector('.timeline');
  timeline.addEventListener('keydown',event=>{
    if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
    event.preventDefault();const focused=Number(event.target.closest('[data-stage]')?.dataset.stage ?? active);
    jump(event.key==='Home'?0:event.key==='End'?lastStage:focused+(event.key==='ArrowLeft'?-1:1),true);
  });
  let swipe=null;
  const surface=$('stone-swipe-surface');
  surface.addEventListener('pointerdown',event=>{if(event.pointerType!=='mouse'&&!event.target.closest('button,a')) swipe={x:event.clientX,y:event.clientY};},{passive:true});
  surface.addEventListener('pointerup',event=>{
    if(!swipe) return;const dx=event.clientX-swipe.x,dy=event.clientY-swipe.y;swipe=null;
    if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)*1.4) jump(active+(dx<0?1:-1),true);
  },{passive:true});
  surface.addEventListener('pointercancel',()=>{swipe=null;},{passive:true});
  window.addEventListener('scroll',requestRender,{passive:true});
  window.addEventListener('resize',measure,{passive:true});
  ['keydown','pointerdown','wheel'].forEach(type=>window.addEventListener(type,requestRender,{passive:true}));
  reduced.addEventListener('change',requestRender);
  observer=new IntersectionObserver(entries=>{
    if(entries.some(e=>e.isIntersecting)){
      stages.slice(0,2).forEach((s,index)=>{preparePreview(s);bracelet.prepare(index);});observer.disconnect();
    }
  },{rootMargin:'500px'});
  observer.observe(journey);
  if('ResizeObserver' in window){
    const layoutObserver=new ResizeObserver(measure);
    layoutObserver.observe(scene);layoutObserver.observe(journey);
  }
  measure();
  if(moduleStory&&location.hash==='#stone-module') {
    window.scrollTo({top:start+travel*(moduleStart+.001)/totalUnits,behavior:'instant'});
    render();
  }
  document.fonts.ready.then(measure);
  window.addEventListener('pageshow',()=>{
    measure();
    // Restore the deep link after the browser has restored its scroll position.
    if(finale&&location.hash==='#one-year-sober') document.fonts.ready.then(()=>requestAnimationFrame(()=>jumpFinale(true)));
  });
})();
