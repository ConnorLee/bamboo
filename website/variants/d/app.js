/* Review-only state. No NFC API, persisted awards, account, or native data writes. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const stories = {0:'Twelve places for what comes next.',1:'A beginning, made visible.',3:'The spaces begin to hold a story.',6:'Half of the circle. All of your effort.',9:'Your history is becoming a whole.',12:'HALO I COMPLETE. Yours to keep.'};
  document.querySelectorAll('[data-count]').forEach(button => button.addEventListener('click', () => {
    const count = Number(button.dataset.count);
    document.querySelectorAll('[data-count]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
    $('bracelet-preview').src = `assets/bracelet-${String(count).padStart(2,'0')}.svg`;
    $('bracelet-preview').alt = `Halo I with ${count} of exactly twelve stones installed`;
    $('progress-story').textContent = stories[count];
    $('bracelet-announcement').textContent = `${count} of twelve stones installed. ${stories[count]}`;
  }));
  let catalog, messages;
  let state = {earned:6, streak:36, milestone:7, phase:0, eligible:true};
  const dots = count => Array.from({length:12},(_,i)=>`<i class="${i<count?'earned':''}" aria-hidden="true"></i>`).join('');
  function project() {
    if(!catalog)return;
    ['earned-dots','profile-dots'].forEach(id=>{
      $(id).innerHTML=dots(state.earned);
      $(id).setAttribute('role','img');
      $(id).setAttribute('aria-label',`${state.earned} of twelve milestones earned`);
    });
    $('profile-earned').textContent=state.earned;
    $('profile-streak').textContent=state.streak;
    const stage=catalog.stages[Math.max(0,state.earned-1)];
    $('companion-art').innerHTML=window.HaloEvolutionArt.svg(stage,'halo-i-recognition');
    $('companion-art').dataset.worldChapter=String(state.earned);
    // One receipt projects both visible companion history and accumulated world markings.
    $('companion-art').style.background=`radial-gradient(ellipse at 50% 80%, ${stage.visual.color}66, transparent 68%)`;
    let world=document.createElement('span');world.className='world-history';
    world.textContent=`WORLD · ${String(state.earned).padStart(2,'0')} CHAPTERS HELD`;
    $('companion-art').appendChild(world);
  }
  function reset(final=false) {
    if(!catalog)return;
    state={earned:final?11:6,streak:final?365:36,milestone:final?12:7,phase:0,eligible:true};
    $('scan-scenario').value='eligible';
    $('app-phase').textContent='A NEW STONE IS READY';
    $('app-title').textContent=final?'One place remains.':'Chapter seven awaits.';
    $('app-description').textContent=`Open drawer ${String(state.milestone).padStart(2,'0')}. Bring your iPhone near the stone.`;
    $('activate-button').textContent='Preview packaging scan';
    $('activate-button').disabled=false;
    $('unlock-heading').textContent=final?'The last chapter of Year One.':'An invitation, never a demand.';
    $('unlock-detail').textContent='The app has marked this chapter eligible. The physical drawer can be opened at any time; only the earned digital state can unlock an evolution.';
    $('scan-status').textContent='Preview is ready. No app account or NFC reader is connected.';
    $('setback-status').textContent='Illustrative earned history, not a live profile.';
    document.querySelector('.profile-days').innerHTML=(final?'365':'250')+' <span>days in your journey</span>';
    project();
  }
  function readyView() {
    state.phase=0;
    $('activate-button').disabled=false;
    $('activate-button').textContent='Preview packaging scan';
    $('app-phase').textContent='RECOGNITION PREVIEW';
    $('app-title').textContent=`Drawer ${String($('scan-scenario').value==='duplicate'?state.earned:state.milestone).padStart(2,'0')}`;
    $('app-description').textContent='Review how Halo responds before awarding a new milestone.';
  }
  $('activate-button').addEventListener('click',()=>{
    if(!catalog)return;
    if(state.phase===1){
      state.phase=2;
      $('app-phase').textContent='THIS STONE IS YOURS TO KEEP';
      $('app-title').textContent=state.milestone===12?'The year stays with you.':'Carry this chapter.';
      $('app-description').textContent=messages.milestones[state.milestone-1].under;
      $('activate-button').textContent='Preview placing the stone';
      $('unlock-heading').textContent='One more place is filled.';
      $('unlock-detail').textContent='Lift the stone to reveal its second message. Install it off wrist, holding the metal carrier: align, push, turn and seat the mechanical lock.';
      $('scan-status').textContent='Earned state is already saved in this preview. Physical placement is a personal action, not a sensor reading.';
      return;
    }
    if(state.phase===2){
      state.phase=3;
      $('app-phase').textContent=state.milestone===12?'HALO I COMPLETE':'A PART OF YOUR YEAR';
      $('app-title').textContent=state.milestone===12?'A year, held.':'A little more complete.';
      $('app-description').textContent=state.milestone===12?'The box is empty. Your bracelet is complete. This history stays with you.':'Your bracelet carries another chapter. Your companion keeps everything you have shared.';
      $('activate-button').textContent='Moment complete';$('activate-button').disabled=true;
      $('scan-status').textContent='Sequence complete. No additional receipt was awarded for physical placement.';
      return;
    }
    const scenario=$('scan-scenario').value;
    if(scenario==='wrong-kit'){
      $('scan-status').textContent='This belongs to a different Halo set. No award or kit reassignment. Check the bound kit in Halo.';return;
    }
    if(scenario==='duplicate'||state.earned>=state.milestone){
      $('scan-status').textContent=`Part of your year. Drawer ${scenario==='duplicate'?state.earned:state.milestone} returns its existing receipt; earned count and companion history stay unchanged.`;
      $('app-phase').textContent='ALREADY PART OF YOUR YEAR';return;
    }
    if(scenario==='early'||!state.eligible){
      $('scan-status').textContent='This stone is waiting for a later part of your year. No new milestone is awarded; everything already earned stays.';return;
    }
    if(scenario==='offline'){
      $('scan-status').textContent='Preview: a production app would save this scan as pending and finish verification when connected. This browser stores nothing and awards no milestone.';return;
    }
    state.earned=state.milestone;state.phase=1;project();
    const phone=document.querySelector('.phone-prototype');
    phone.classList.remove('is-revealed');void phone.offsetWidth;phone.classList.add('is-revealed');
    $('app-phase').textContent=state.milestone===12?'YEAR ONE RECOGNIZED':'MILESTONE RECOGNIZED';
    $('app-title').textContent=state.milestone===12?'HALO I COMPLETE':'More of your story.';
    $('app-description').textContent='Same companion. One more earned chapter. Your world and profile carry it together.';
    $('activate-button').textContent='Lift your stone';
    $('unlock-heading').textContent='A saved moment. A visible change.';
    $('unlock-detail').textContent='The correct kit, correct milestone, eligibility and prior activation have passed in this fixture. One receipt updates the companion, world and profile. A new look preserves the same name, memories and identity.';
    $('scan-status').textContent=`Preview recognized milestone ${state.milestone} exactly once. Native NFC, receipt service and finished 3D reveal are not connected.`;
  });
  $('scan-scenario').addEventListener('change',()=>{readyView();$('scan-status').textContent='Selected recognition case. Preview a scan to review its outcome.';});
  $('reset-demo').addEventListener('click',()=>reset());
  $('missed-day').addEventListener('click',()=>{
    $('setback-status').textContent=`A missed check-in is not a reported lapse. ${state.earned} earned milestones and the ${state.streak}-day current streak stay unchanged.`;
  });
  $('reported-lapse').addEventListener('click',()=>{
    if(!catalog)return;
    state.streak=0;state.eligible=false;project();
    $('setback-status').textContent=`Current streak can restart. All ${state.earned} earned milestones remain; only future eligibility changes. This preview changes no real history.`;
  });
  $('view-final').addEventListener('click',()=>{
    if(!catalog)return;
    reset(true);
    document.querySelector('.profile-days').innerHTML='365 <span>days in your journey</span>';
    $('digital').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
    $('activate-button').focus({preventScroll:true});
  });
  function showDrawer(){
    const row=messages.milestones[Number($('drawer-select').value)-1];
    $('drawer-heading').textContent=`${String(row.ordinal).padStart(2,'0')} / ${row.opening}`;
    $('drawer-under').textContent=row.under;
  }
  // Required fixture data is versioned on disk and never fetched from a live account.
  Promise.all([fetch('/halo-site/variants/d/evolution-catalog.json').then(r=>{if(!r.ok)throw Error();return r.json();}),fetch('/halo-site/variants/d/review-data.json').then(r=>{if(!r.ok)throw Error();return r.json();})]).then(([c,m])=>{
    catalog=c;messages=m;
    $('drawer-select').innerHTML=messages.milestones.map(x=>`<option value="${x.ordinal}">${String(x.ordinal).padStart(2,'0')} / ${x.stone.split(';')[0]}</option>`).join('');
    $('drawer-select').addEventListener('change',showDrawer);showDrawer();project();
  }).catch(()=>{$('scan-status').textContent='Preview data could not load. Please refresh to try again.';$('activate-button').disabled=true;});
})();
