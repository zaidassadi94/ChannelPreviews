/* Channel Studio — shared screen recorder.
   Records ONLY the device/desktop view (#capture) using the Chromium
   Region Capture API (getDisplayMedia + CropTarget.cropTo) → MediaRecorder → .webm.
   Falls back to a whole-tab recording (with a note) where Region Capture is unavailable.
   Self-contained, no dependencies. Usage:
     ChannelStudioRecorder.init({ button, getEl:()=>el, filename:()=>'name', toast:fn }) */
(function(){
  "use strict";
  var cfg=null, rec=null, chunks=[], stream=null, timer=null, startT=0, active=false;

  function inject(){
    if(document.getElementById('cs-rec-style')) return;
    var s=document.createElement('style'); s.id='cs-rec-style';
    s.textContent='.btn.cs-recording{background:#e5484d!important;color:#fff!important;border-color:#e5484d!important;box-shadow:0 2px 6px rgba(229,72,77,.35)!important}'
      +'.btn.cs-recording:hover{background:#d13c41!important}'
      +'.cs-dot{width:8px;height:8px;border-radius:50%;background:currentColor;display:inline-block;animation:cs-pulse 1.1s infinite}'
      +'@keyframes cs-pulse{0%,100%{opacity:1}50%{opacity:.25}}'
      /* while recording, hide tool-only overlays that would otherwise be baked into the video */
      +'body.cs-rec-live .sim-badge,body.cs-rec-live .toast{display:none!important}'
      /* touch-orb cursor + click ripple, shown over the device while recording */
      +'body.cs-rec-live #capture,body.cs-rec-live #capture *{cursor:none!important}'
      +'.cs-orb{position:fixed;left:-100px;top:-100px;width:34px;height:34px;margin:-17px 0 0 -17px;border-radius:50%;background:rgba(18,18,24,.16);border:1.5px solid rgba(255,255,255,.9);box-shadow:0 2px 9px rgba(0,0,0,.28),inset 0 0 10px rgba(255,255,255,.25);pointer-events:none;z-index:2147483646;opacity:0;transition:opacity .16s ease,transform .09s ease}'
      +'.cs-orb.cs-show{opacity:1}.cs-orb.cs-press{transform:scale(.72);background:rgba(18,18,24,.3)}'
      +'.cs-ripple{position:fixed;width:14px;height:14px;margin:-7px 0 0 -7px;border-radius:50%;border:2px solid rgba(255,255,255,.95);background:rgba(99,91,255,.18);pointer-events:none;z-index:2147483645;animation:cs-rip .52s ease-out forwards}'
      +'@keyframes cs-rip{from{transform:scale(.4);opacity:.95}to{transform:scale(3.6);opacity:0}}';
    document.head.appendChild(s);
  }
  function regionOK(){ return typeof window.CropTarget!=='undefined' && typeof CropTarget.fromElement==='function'; }
  function pickMime(){ if(!window.MediaRecorder) return null; var c=['video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm']; for(var i=0;i<c.length;i++){ if(MediaRecorder.isTypeSupported(c[i])) return c[i]; } return ''; }
  function two(n){ return (n<10?'0':'')+n; }
  function toast(m){ if(cfg&&cfg.toast) cfg.toast(m); }
  function idle(){ if(cfg&&cfg.button) cfg.button.innerHTML='<svg viewBox="0 0 24 24" fill="currentColor" style="width:12px;height:12px"><circle cx="12" cy="12" r="7"/></svg>Record'; }
  function paint(){ if(!cfg||!active) return; var s=Math.floor((Date.now()-startT)/1000); cfg.button.innerHTML='<span class="cs-dot"></span>Stop · '+two(Math.floor(s/60))+':'+two(s%60); }
  function tracksStop(){ if(stream){ stream.getTracks().forEach(function(t){ try{t.stop();}catch(e){} }); stream=null; } }

  /* ---- touch-orb cursor + click ripple (only while recording) ---- */
  var orb=null;
  function overCap(x,y){ var el=cfg&&cfg.getEl&&cfg.getEl(); if(!el) return false; var r=el.getBoundingClientRect(); return x>=r.left && x<=r.right && y>=r.top && y<=r.bottom; }
  function onMove(e){ if(!active) return; if(!orb){ orb=document.createElement('div'); orb.className='cs-orb'; document.body.appendChild(orb); } orb.style.left=e.clientX+'px'; orb.style.top=e.clientY+'px'; if(overCap(e.clientX,e.clientY)) orb.classList.add('cs-show'); else orb.classList.remove('cs-show'); }
  function onDown(e){ if(!active) return; if(orb) orb.classList.add('cs-press'); if(overCap(e.clientX,e.clientY)){ var r=document.createElement('div'); r.className='cs-ripple'; r.style.left=e.clientX+'px'; r.style.top=e.clientY+'px'; document.body.appendChild(r); setTimeout(function(){ if(r&&r.parentNode) r.parentNode.removeChild(r); },560); } }
  function onUp(){ if(orb) orb.classList.remove('cs-press'); }
  function cursorOn(){ document.addEventListener('mousemove',onMove,true); document.addEventListener('mousedown',onDown,true); document.addEventListener('mouseup',onUp,true); }
  function cursorOff(){ document.removeEventListener('mousemove',onMove,true); document.removeEventListener('mousedown',onDown,true); document.removeEventListener('mouseup',onUp,true); if(orb&&orb.parentNode) orb.parentNode.removeChild(orb); orb=null; }

  async function start(){
    if(!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia){ toast('Screen recording needs a desktop browser (Chrome or Edge).'); return; }
    if(!window.MediaRecorder){ toast('This browser can’t record video.'); return; }
    var el=cfg.getEl && cfg.getEl(); if(!el){ toast('Nothing to record yet.'); return; }
    var crop=null;
    if(regionOK()){ try{ crop=await CropTarget.fromElement(el); }catch(e){ crop=null; } }
    try{ stream=await navigator.mediaDevices.getDisplayMedia({ video:{frameRate:30}, audio:false, preferCurrentTab:true }); }
    catch(e){ toast((e&&e.name==='NotAllowedError')?'Recording cancelled.':'Could not start recording.'); return; }
    var track=stream.getVideoTracks()[0];
    var cropped=false;
    if(crop && track && typeof track.cropTo==='function'){ try{ await track.cropTo(crop); cropped=true; }catch(e){} }
    if(!cropped){ toast('Recording the whole tab — device-only trimming needs Chrome or Edge.'); }
    track.addEventListener('ended', function(){ if(active) stop(); });
    var mt=pickMime();
    try{ rec=new MediaRecorder(stream, mt?{mimeType:mt, videoBitsPerSecond:8000000}:undefined); }
    catch(e){ toast('Recording is not supported here.'); tracksStop(); return; }
    chunks=[];
    rec.ondataavailable=function(e){ if(e.data && e.data.size) chunks.push(e.data); };
    rec.onstop=function(){ save((rec&&rec.mimeType)||mt); tracksStop(); };
    toast('Recording… click Stop when you’re done.');
    rec.start(200);
    active=true; startT=Date.now(); document.body.classList.add('cs-rec-live'); cursorOn(); cfg.button.classList.add('cs-recording'); paint(); timer=setInterval(paint,500);
  }
  function stop(){
    if(!active) return;
    active=false; clearInterval(timer); document.body.classList.remove('cs-rec-live'); cursorOff(); if(cfg&&cfg.button){ cfg.button.classList.remove('cs-recording'); idle(); }
    if(rec && rec.state!=='inactive'){ try{ rec.stop(); }catch(e){ tracksStop(); } } else { tracksStop(); }
  }
  function save(mt){
    var type=(mt||'video/webm').split(';')[0];
    var blob=new Blob(chunks,{type:type}); chunks=[];
    if(!blob.size){ toast('Recording was empty — try again.'); return; }
    var url=URL.createObjectURL(blob);
    var a=document.createElement('a'); a.href=url; a.download=((cfg.filename&&cfg.filename())||'channel-studio')+'.webm';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function(){ URL.revokeObjectURL(url); },6000);
    toast('Recording saved (WebM).');
  }

  window.ChannelStudioRecorder={ init:function(opts){ cfg=opts; inject(); if(!cfg.button) return; idle(); cfg.button.addEventListener('click', function(){ active?stop():start(); }); } };
})();
