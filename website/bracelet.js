/* Native 12-seat year study derived from HALO_Bracelet_Master.blend.
 * Public render/prepare indices are 0..11 (months 1..12); no extra Intention module. */
(function (root) {
  'use strict';
  const CENTER = 6;
  const HISTORY_SLOTS = Object.freeze([5, 7, 4, 8, 3, 2, 9, 1, 10, 0, 11]);
  const clampMonth = month => Math.max(0, Math.min(11, Math.round(Number(month) || 0)));
  function stateForMonth(value) {
    const month = clampMonth(value);
    return Array.from({length: 12}, (_, index) => {
      const role = index === CENTER ? 'current' : 'history';
      let stone = null;
      if (index === CENTER) stone = month;
      else {
        const historicalMonth = HISTORY_SLOTS.indexOf(index);
        if (historicalMonth >= 0 && historicalMonth < month) stone = historicalMonth;
      }
      return Object.freeze({index, role, stone, side: index < CENTER ? 'left' : index > CENTER ? 'right' : 'center'});
    });
  }
  const frameAsset = (month, finish) => 'assets/bracelet-year/base-'+finish+'-'+String(clampMonth(month)).padStart(2,'0')+'.webp';
  const stoneAsset = month => 'assets/bracelet-year/stone-'+String(clampMonth(month)).padStart(2,'0')+'.webp';
  const clamp = value => Math.min(1,Math.max(0,value));
  const smooth = value => {const t=clamp(value);return t*t*(3-2*t);};
  function create(host, catalog) {
    const frames=new Map();
    let position=0, request=0, requested='', shown='', loading=null, frozen=false;
    const images=['bracelet-render','bracelet-current','bracelet-next'].map(className=>{
      const image=document.createElement('img');image.className=className;
      image.alt='';image.width=1000;image.height=875;image.decoding='async';
      return image;
    });
    const [base,current,next]=images;
    base.fetchPriority='high';
    const semanticPositions=document.createElement('span');
    semanticPositions.className='sr-only';semanticPositions.setAttribute('aria-hidden','true');
    host.replaceChildren(...images,semanticPositions);
    const currentFinish=()=>document.documentElement.dataset.theme==='dark'?'dark':'light';
    const instant=()=>frozen||matchMedia('(prefers-reduced-motion: reduce)').matches||document.documentElement.dataset.motionInput==='keyboard';
    function prepare(url) {
      if(!frames.has(url)) frames.set(url,new Promise(resolve=>{
        const candidate=new Image();
        candidate.onload=async()=>{try{await candidate.decode();resolve(candidate);}catch{frames.delete(url);resolve(null);}};
        candidate.onerror=()=>{frames.delete(url);resolve(null);};
        candidate.src=url;
      }));
      return frames.get(url);
    }
    function semantics(month,finish) {
      host.dataset.index=month;host.dataset.month=month+1;host.dataset.finish=finish;
      semanticPositions.replaceChildren(...stateForMonth(month).map(placement=>{
        const span=document.createElement('span');
        Object.assign(span.dataset,{position:placement.index,role:placement.role,side:placement.side,
          stone:placement.stone===null?'blank':catalog[placement.stone].key,month:placement.stone===null?'':placement.stone+1});
        return span;
      }));
      const state=`${month===0?'Day 1, Month 1':'Month '+(month+1)} centered, ${month} earlier stones and ${11-month} brushed-steel pellets. Twelve occupied positions.`;
      host.setAttribute('aria-label',`HALO ${finish==='light'?'brushed natural stainless steel':'brushed black PVD stainless steel'} bracelet. ${state} Design visualization.`);
    }
    function sample() {
      const month=clampMonth(position);
      const from=instant()?month:Math.min(10,Math.floor(position));
      return {month,from,to:instant()?month:from+1,t:instant()?0:position-from};
    }
    function motion() {
      const {t}=sample();
      const lift=instant()?0:smooth(t/.30)*(1-smooth((t-.70)/.30));
      const blend=instant()?0:smooth((t-.38)/.24);
      const liftPx=host.clientHeight*.16*lift,scale=1+.60*lift;
      current.style.transform=`translate3d(${blend*-10}px,${-liftPx}px,0) scale(${scale})`;
      next.style.transform=`translate3d(${(1-blend)*10}px,${-liftPx}px,0) scale(${scale})`;
      current.style.opacity=String(1-blend);next.style.opacity=String(blend);
    }
    function prepareMonth(month,finish=currentFinish()) {
      return Promise.all([prepare(frameAsset(month,finish)),prepare(stoneAsset(month))]);
    }
    function render(value,reduced=false) {
      position=Math.max(0,Math.min(11,Number(value)||0));frozen=reduced;
      const {month,from,to}=sample(),finish=currentFinish();
      const key=[finish,month,from,to].join(':');
      motion();
      if(key===requested) return loading;
      requested=key;
      const token=++request;
      if(key===shown) return Promise.resolve();
      loading=Promise.all([prepare(frameAsset(month,finish)),prepare(stoneAsset(from)),prepare(stoneAsset(to))]).then(decoded=>{
        if(token!==request) return;
        if(decoded.some(image=>!image)){requested='';return;}
        images.forEach((image,index)=>{image.src=decoded[index].src;});
        shown=key;semantics(month,finish);motion();
        for(const ahead of [month-1,month+1]) if(ahead>=0&&ahead<=11) prepareMonth(ahead,finish);
        prepare(frameAsset(month,finish==='light'?'dark':'light'));
      });
      return loading;
    }
    new MutationObserver(()=>render(position,frozen)).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
    render(0);
    return {render,prepare:prepareMonth};
  }
  const api=Object.freeze({CENTER,HISTORY_SLOTS,stateForMonth,stateForIndex:stateForMonth,create});
  if(typeof module!=='undefined'&&module.exports) module.exports=api;
  else root.HaloBracelet=api;
})(typeof window!=='undefined'?window:globalThis);
