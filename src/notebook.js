/** A floating edge drawer. It never changes the editor's layout or stored data. */
export function setupNotebook(){
 const panel=document.getElementById('notebook'),handle=document.getElementById('notebook-handle'),close=document.getElementById('notebook-close');
 if(!panel||!handle||!close)return;
 let open=false,drag=false,moved=false,start=0,offset=0,y=160;
 /** @type {ReturnType<typeof setTimeout>|undefined} */ let hideTimer;
 const position=()=>{y=Math.max(76,Math.min(y,window.innerHeight-70));handle.style.top=`${y}px`;panel.style.top=`${Math.max(12,Math.min(y-12,window.innerHeight-Math.min(580,window.innerHeight-24)-12))}px`;};
 const finishClose=()=>{if(!open)panel.hidden=true;};
 /** @param {boolean} value */ const toggle=(value)=>{
  open=value;clearTimeout(hideTimer);handle.setAttribute('aria-expanded',String(open));panel.inert=!open;
  if(open){panel.hidden=false;position();panel.getBoundingClientRect();requestAnimationFrame(()=>{if(open)panel.classList.add('is-open');});}
  else {panel.classList.remove('is-open');hideTimer=setTimeout(finishClose,matchMedia('(prefers-reduced-motion: reduce)').matches?0:360);}
 };
 panel.hidden=true;panel.inert=true;position();
 panel.addEventListener('transitionend',e=>{if(e.target===panel&&e.propertyName==='transform')finishClose();});
 handle.addEventListener('click',()=>{if(moved){moved=false;return;}toggle(!open);if(open)document.getElementById('scratchpad')?.focus({preventScroll:true});});
 close.addEventListener('click',()=>{toggle(false);handle.focus({preventScroll:true});});
 panel.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();toggle(false);handle.focus({preventScroll:true});}});
 handle.addEventListener('pointerdown',e=>{drag=true;moved=false;start=e.clientY;offset=y;handle.setPointerCapture(e.pointerId);});
 handle.addEventListener('pointermove',e=>{if(!drag)return;if(Math.abs(e.clientY-start)>4)moved=true;if(moved){y=offset+e.clientY-start;position();}});
 handle.addEventListener('pointerup',()=>{drag=false;});handle.addEventListener('pointercancel',()=>{drag=false;moved=false;});
 handle.addEventListener('keydown',e=>{if(e.key==='ArrowUp'||e.key==='ArrowDown'){e.preventDefault();y+=e.key==='ArrowUp'?-20:20;position();}if(e.key==='Escape'&&open){toggle(false);}});
 window.addEventListener('resize',position);
}
