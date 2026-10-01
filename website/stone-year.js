/* Shared material details for the journey and the restored loose-stone collection. */
(() => {
  'use strict';
  const stones=window.HALO_MILESTONES;
  const $=id=>document.getElementById(id);
  let selected=0;
  window.addEventListener('halo:stone-change',event=>{selected=event.detail.index;});
  const dialog=$('stone-detail-dialog');
  function open(){
    delete dialog.dataset.presentation;
    const s=stones[selected];
    $('stone-detail-image').src=s.mineral;$('stone-detail-image').alt=s.stone+' material visualization';
    $('stone-detail-month').textContent=s.timeLabel;
    $('stone-detail-name').textContent=s.stone;$('stone-detail-theme').textContent=s.chapter+' / '+s.firstReveal;
    $('stone-detail-meaning').textContent=s.meaning||s.symbolism||s.haloMeaning;
    $('stone-detail-material').textContent=s.material;
    $('stone-detail-variation').textContent=Array.isArray(s.variation)?s.variation.join(' · '):s.variation;
    const position=$('stone-detail-position');
    position.textContent='In Halo: '+s.haloMeaning;
    if(s.engraving){
      const ns='http://www.w3.org/2000/svg';
      const mark=document.createElementNS(ns,'svg');
      for(const [name,value] of Object.entries({viewBox:'0 0 24 24',width:'20',height:'20',fill:'none',stroke:'currentColor','stroke-width':'1.2','stroke-linecap':'round','stroke-linejoin':'round','aria-hidden':'true',focusable:'false'})) mark.setAttribute(name,value);
      mark.style.verticalAlign='middle';
      const path=document.createElementNS(ns,'path');path.setAttribute('d',s.engraving.path);mark.append(path);
      position.append(document.createElement('br'),mark,document.createTextNode(' '+s.engraving.name+' · Hidden in the seat beneath the steel pellet. Revealed at your milestone, then covered by your earned stone.'));
    }
    const source=$('stone-detail-source');source.href=s.sourceURLs?.[0]||s.sources?.[0]?.url||'https://www.gia.edu/gem-encyclopedia';
    dialog.showModal();
  }
  window.HaloStoneDetails = {
    openCollection(stone) {
      dialog.dataset.presentation = 'collection';
      $('stone-detail-image').src = stone.mineral;
      $('stone-detail-image').alt = stone.stone + ' loose gemstone';
      $('stone-detail-month').textContent = 'Month ' + String(stone.month).padStart(2, '0') + ' / ' + stone.chapter;
      $('stone-detail-name').textContent = stone.stone;
      $('stone-detail-theme').textContent = stone.firstReveal;
      $('stone-detail-meaning').textContent = stone.beneathStone;
      dialog.showModal();
    }
  };
  document.querySelectorAll('[data-stone-detail]').forEach(button=>button.addEventListener('click',open));
  dialog.querySelector('.stone-detail-close').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
})();
