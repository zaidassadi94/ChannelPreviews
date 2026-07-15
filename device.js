/* ==========================================================================
   Channel Studio — shared device helpers.
   fitDevice(): scale-to-fit keeps the whole #capture visible in #stage.
   statusBarHTML(device,lt): the iPhone/Android status bar used by the phone
   frames (gmail's iPhone frame keeps its own variant).
   captureDevice({background,toast,h2c}): html2canvas PNG export — resets the
   fit transform, hides simulate chrome, restores everything after.
   ========================================================================== */
function fitDevice(){ const cap=document.getElementById('capture'); if(!cap) return; cap.style.transform='none'; cap.style.marginBottom='';
  const stage=document.getElementById('stage');
  const availH=stage.clientHeight-40, availW=stage.clientWidth-24, h=cap.offsetHeight, w=cap.offsetWidth;
  const k=Math.min(1, availH/h, availW/w); if(k<1){ cap.style.transformOrigin='top center'; cap.style.transform='scale('+k+')'; cap.style.marginBottom=(-(h*(1-k)))+'px'; } }
window.addEventListener('resize', fitDevice);
const CS_STATUS_ICONS={
  wifi:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 18a2 2 0 100 4 2 2 0 000-4zM5 12a10 10 0 0114 0l-2 2a7 7 0 00-10 0l-2-2zM1.5 8.5a15 15 0 0121 0l-2 2a12 12 0 00-17 0l-2-2z"/></svg>',
  batt:'<svg viewBox="0 0 24 24" fill="none"><rect x="2" y="7" width="18" height="10" rx="2.5" stroke="currentColor" stroke-width="1.5"/><rect x="4" y="9" width="12" height="6" rx="1" fill="currentColor"/><rect x="21" y="10" width="1.6" height="4" rx=".8" fill="currentColor"/></svg>',
  cell:'<svg viewBox="0 0 24 24" fill="currentColor"><rect x="2" y="14" width="3" height="6" rx="1"/><rect x="7" y="10" width="3" height="10" rx="1"/><rect x="12" y="6" width="3" height="14" rx="1"/><rect x="17" y="2" width="3" height="18" rx="1"/></svg>',
};
function statusBarHTML(device,lt){ const I=CS_STATUS_ICONS; const r=device==='android'?`${I.wifi}${I.cell}${I.batt}`:`${I.cell}${I.wifi}${I.batt}`; return `<div class="statusbar ${lt?'lt':''}"><span>9:41</span><div class="r">${r}</div></div>`; }
async function captureDevice(opts){ opts=opts||{}; const node=document.getElementById('capture'); if(!node) return null;
  if(window.__noH2C||typeof html2canvas==='undefined'){ if(opts.toast) opts.toast('Screenshot library offline — use OS screenshot (Cmd/Win+Shift+S)'); return null; }
  const stage=document.getElementById('stage');
  const t=node.style.transform, m=node.style.marginBottom; node.style.transform='none'; node.style.marginBottom='';
  const wasSim=stage.classList.contains('sim-on'); stage.classList.remove('sim-on'); const badge=node.querySelector('.sim-badge'); if(badge) badge.style.display='none';
  try{ return await html2canvas(node,Object.assign({ backgroundColor:opts.background||'#eef0f5', scale:2, useCORS:true, allowTaint:false, logging:false }, opts.h2c||{})); }
  finally{ node.style.transform=t; node.style.marginBottom=m; if(wasSim) stage.classList.add('sim-on'); if(badge) badge.style.display=''; }
}
