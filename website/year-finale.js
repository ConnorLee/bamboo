/* The completed year is a chapter of the existing scroll, rendered from the same Blender master. */
(function(root){
  'use strict';
  const duration=3.4, frameCount=24;
  const clamp=value=>Math.min(1,Math.max(0,value));
  const smooth=value=>{const t=clamp(value);return t*t*(3-2*t);};
  function sample(position,reduced=false){
    const time=Math.min(duration,Math.max(0,Number.isFinite(position)?position:0));
    const arrival=reduced?1:smooth(time/.9);
    const closure=reduced?1:smooth((time-.55)/1.8);
    const reveal=reduced?1:smooth((time-2.05)/.6);
    return {time,arrival,closure,reveal,frame:Math.round(closure*(frameCount-1))};
  }
  const asset=(finish,frame)=>'assets/bracelet-year/finale/'+finish+'-'+String(frame).padStart(2,'0')+'.webp';
  function create(journey,source){
    const element=journey.querySelector('.year-finale');
    if(!element) return null;
    const product=element.querySelector('.year-finale-product');
    const images=[...product.querySelectorAll('img')];
    const atmosphere=element.querySelector('.year-finale-atmosphere');
    const sheen=element.querySelector('.year-finale-sheen');
    const copy=element.querySelector('.year-finale-copy');
    const foot=element.querySelector('.year-finale-foot');
    const monthly=journey.querySelector('.journey-inner');
    const stage=journey.querySelector('.journey-stage');
    const frames=new Map(),prefetched=new Set();
    let position=0,reduced=false,enabled=false,layout=null,desired='',lastFinish='',focusRequested=false;
    const finish=()=>document.documentElement.dataset.theme==='dark'?'dark':'light';
    function prepareFrame(color,index){
      const url=asset(color,index);
      if(frames.has(url)) return frames.get(url).promise;
      const entry={image:null,promise:null};
      entry.promise=new Promise(resolve=>{
        const image=new Image();image.decoding='async';
        image.onload=async()=>{
          try{await image.decode();entry.image=image;resolve(image);if(enabled) paint();}
          catch{frames.delete(url);resolve(null);}
        };
        image.onerror=()=>{frames.delete(url);resolve(null);};
        image.src=url;
      });
      frames.set(url,entry);
      return entry.promise;
    }
    function prepare(all=false){
      const color=finish();
      [0,1,frameCount-1].forEach(index=>prepareFrame(color,index));
      // Warm compressed files near the end of the year. Keep only a small window
      // of decoded images, rather than two entire RGBA sequences, on mobile.
      if(all&&!prefetched.has(color)&&typeof fetch==='function'){
        prefetched.add(color);
        let next=0;
        const worker=async()=>{while(next<frameCount){const index=next++;try{const response=await fetch(asset(color,index),{cache:'force-cache'});await response.arrayBuffer();}catch{/* The live frame loader can retry. */}}};
        Promise.all([worker(),worker(),worker()]);
      }
    }
    function measure(){
      const bounds=stage.getBoundingClientRect(),origin=source.getBoundingClientRect();
      const heightLimit=bounds.height<480?Math.max(130,(bounds.height-150)*1.2):bounds.height*.92;
      const width=Math.min(960,bounds.width*.94,heightLimit);
      const height=width*875/1000;
      const sourceWidth=Math.min(origin.width,origin.height*1000/875);
      layout={width,height,x:origin.left+origin.width/2-bounds.left-bounds.width/2,
        y:origin.top+origin.height/2-bounds.top-bounds.height*.53,scale:sourceWidth/width};
      product.style.width=width+'px';product.style.height=height+'px';
      if(enabled) paint();
    }
    function paint(){
      if(!enabled||!layout) return;
      const state=sample(position,reduced),color=finish();
      const exact=state.closure*(frameCount-1),lower=Math.floor(exact),upper=Math.min(frameCount-1,lower+1);
      desired=color+':'+lower+':'+upper;
      const available=index=>frames.get(asset(color,index))?.image;
      const first=available(lower),second=available(upper);
      if(first&&second){
        if(images[0].src!==first.src) images[0].src=first.src;
        if(images[1].src!==second.src) images[1].src=second.src;
        images[0].style.opacity=String(1-(exact-lower));
        images[1].style.opacity=String(exact-lower);
        product.dataset.frame=String(state.frame);lastFinish=color;
        const clasp=state.frame<2||state.frame>=16?'closed':'revealed during the locking sequence';
        product.setAttribute('aria-label',`Completed HALO bracelet with twelve milestone stones, with Opal current at the center. Rear clasp ${clasp}.`);
      }else{
        const closest=[...frames.values()].filter(entry=>entry.image&&entry.image.src.endsWith('.webp')&&entry.image.src.includes('/'+color+'-'))
          .sort((a,b)=>Math.abs(Number(a.image.src.match(/-(\d+)\.webp$/)[1])-exact)-Math.abs(Number(b.image.src.match(/-(\d+)\.webp$/)[1])-exact))[0]?.image;
        if(closest){if(images[0].src!==closest.src) images[0].src=closest.src;images[0].style.opacity='1';images[1].style.opacity='0';lastFinish=color;}
      }
      const ready=lastFinish===color;
      product.style.opacity=ready?String(reduced?1:smooth(position/.18)):'0';
      // On a slow connection the existing completed bracelet remains visible.
      monthly.style.opacity=String(ready?1-state.arrival:1);
      source.style.opacity=String(ready?1-(reduced?1:smooth(position/.18)):1);
      atmosphere.style.opacity=String(ready?state.arrival:0);
      sheen.style.transform=`translate3d(${(1-state.closure)*-5}%,0,0) rotate(${(1-state.closure)*-12}deg) scale(1.12)`;
      const scale=layout.scale+(1-layout.scale)*state.arrival;
      product.style.transform=`translate(-50%,-50%) translate3d(${layout.x*(1-state.arrival)}px,${layout.y*(1-state.arrival)}px,0) scale(${scale})`;
      const reveal=ready?state.reveal:0;
      copy.style.opacity=String(reveal);copy.style.transform=`translate3d(0,${reduced?0:(1-reveal)*18}px,0)`;
      foot.style.opacity=String(reveal);foot.inert=reveal<.8;
      if(reveal<.8&&document.activeElement===copy.querySelector('h4')) document.activeElement.blur();
      copy.setAttribute('aria-hidden',String(reveal<.8));
      if(focusRequested&&reveal>=.8){copy.querySelector('h4').focus({preventScroll:true});focusRequested=false;}
      element.dataset.finish=color;
      for(const [url,entry] of frames){
        const index=Number(url.match(/-(\d+)\.webp$/)[1]);
        if(entry.image&&(!url.includes('/'+color+'-')||Math.abs(index-lower)>3)&&index!==0&&index!==frameCount-1) frames.delete(url);
      }
    }
    function render(value,instant=false){
      position=value;reduced=instant;
      const state=sample(position,reduced),color=finish();
      const lower=Math.floor(state.closure*(frameCount-1));
      const key=color+':'+lower+':'+Math.min(frameCount-1,lower+1);
      const changed=key!==desired;
      paint();
      if(changed||!frames.has(asset(color,lower))||!frames.has(asset(color,Math.min(frameCount-1,lower+1)))){
        for(let index=Math.max(0,lower-2);index<=Math.min(frameCount-1,lower+3);index++) prepareFrame(color,index);
      }
    }
    function setActive(value){
      enabled=value;element.hidden=!value;element.inert=!value;
      if(value){measure();prepare();}
      else{monthly.style.opacity='';source.style.opacity='';product.style.opacity='0';focusRequested=false;}
    }
    new MutationObserver(()=>{if(enabled){lastFinish='';render(position,reduced);prepare(true);}})
      .observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
    return {duration,root:element,render,prepare,measure,setActive,focus(){focusRequested=true;paint();}};
  }
  const api={sample,duration,frameCount,create};
  if(typeof module!=='undefined'&&module.exports) module.exports=api;
  else root.HaloYearFinale=api;
})(typeof window!=='undefined'?window:globalThis);
