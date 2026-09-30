(() => {
  'use strict';
  const stages = window.HALO_MILESTONES;
  const $ = id => document.getElementById(id);
  const collection=$('mineral-collection');
  stages.forEach((s,index)=>{
    const button=document.createElement('button');
    button.className='mineral';button.type='button';button.dataset.jump=index;
    button.setAttribute('aria-label',s.gem+', '+s.day+(s.day===1?' day':' days')+'. Explore milestone');
    const window=document.createElement('span');window.className='mineral-window';
    const img=document.createElement('img');img.src='assets/mineral-'+s.key+'-circular.webp';
    img.alt='';img.width=720;img.height=540;img.loading='lazy';window.append(img);
    const name=document.createElement('strong');name.textContent=s.gem;
    const label=document.createElement('span');label.textContent=String(s.day).padStart(2,'0')+' / '+s.chapter;
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
      $('stage-chapter').textContent=String(index+1).padStart(2,'0')+' / '+s.chapter;
      $('day-number').textContent=s.day;
      $('day-unit').textContent=s.day===1?'day':'days';
      $('gem-name').textContent=s.gem;
      $('gem-story').textContent=s.story;
      $('gem-material').textContent=s.material;
      $('stage-count').textContent=String(index+1).padStart(2,'0')+' — 07';
      $('stage-screen').src='assets/native-'+s.day+'-circular.webp';
      $('stage-screen').alt=s.gem+' rendered by Halo’s native milestone component';
      $('preview-day').textContent=s.day===1?'1 day':s.day+' days';
      $('preview-mineral').textContent=s.gem;
      scene.setAttribute('aria-label','Halo bracelet with '+s.gem.toLowerCase()+' milestone stone');
      journey.style.setProperty('--accent',s.color);
      buttons.forEach((b,i)=>b.setAttribute('aria-pressed',String(i===index)));
    }
    if(announce) $('stage-announcement').textContent=s.day+' '+(s.day===1?'day':'days')+': '+s.gem+'. '+s.story;
  }
  function measure(){
    const navHeight=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-height'));
    start=journey.getBoundingClientRect().top+window.scrollY-navHeight;
    travel=Math.max(1,journey.offsetHeight-(window.innerHeight-navHeight));
    requestRender();
  }
  function render(){
    pending=false;
    const position=clamp((window.scrollY-start)/travel)*6;
    const from=Math.min(5,Math.floor(position)), t=position-from;
    const selected=Math.min(6,Math.floor(position+.5));
    setStage(selected);
    $('timeline-fill').style.width=(position/6*100)+'%';
    if(reduced.matches){
      current.src='assets/stone-'+stages[selected].key+'-circular.webp';
      current.style.transform='none';current.style.opacity='1';next.style.opacity='0';pair=-1;
      return;
    }
    if(pair!==from){
      pair=from;current.src='assets/stone-'+stages[from].key+'-circular.webp';next.src='assets/stone-'+stages[from+1].key+'-circular.webp';
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
    window.scrollTo({top:start+travel*index/6,behavior:reduced.matches?'instant':'smooth'});
    $('stage-announcement').textContent=stages[index].day+(stages[index].day===1?' day: ':' days: ')+stages[index].gem+'.';
  }
  buttons.forEach(b=>b.addEventListener('click',()=>jump(Number(b.dataset.stage))));
  document.querySelectorAll('[data-jump]').forEach(b=>b.addEventListener('click',()=>jump(Number(b.dataset.jump))));
  window.addEventListener('scroll',requestRender,{passive:true});
  window.addEventListener('resize',measure,{passive:true});
  reduced.addEventListener('change',requestRender);
  // Keep camera-locked stone layers ready before the scroll sequence starts.
  stages.forEach(s=>{const image=new Image();image.src='assets/stone-'+s.key+'-circular.webp';});
  observer=new IntersectionObserver(entries=>{
    if(entries.some(e=>e.isIntersecting)){
      stages.forEach(s=>{const image=new Image();image.src='assets/native-'+s.day+'-circular.webp';});observer.disconnect();
    }
  },{rootMargin:'500px'});
  observer.observe(journey);
  measure();
})();
