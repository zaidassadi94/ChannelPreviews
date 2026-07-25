/* Channel Studio — shared screen recorder + review studio.
   Records ONLY the device/desktop view (#capture) via Chromium Region Capture
   (getDisplayMedia + CropTarget.cropTo) -> MediaRecorder. On stop it opens a
   review panel: preview, filmstrip trim (crop length), and export as WebM
   (raw if untrimmed, re-encoded slice if trimmed) or GIF (vendored gifenc).
   Self-contained; needs gif-encoder.js loaded for GIF export.
   Usage: ChannelStudioRecorder.init({ button, getEl:()=>el, filename:()=>'name', toast:fn }) */
(function(){
  "use strict";
  var cfg=null, rec=null, chunks=[], stream=null, timer=null, startT=0, active=false;

  /* ---------------- styles ---------------- */
  function inject(){
    if(document.getElementById('cs-rec-style')) return;
    var s=document.createElement('style'); s.id='cs-rec-style';
    s.textContent=[
      '.btn.cs-recording{background:#e5484d!important;color:#fff!important;border-color:#e5484d!important;box-shadow:0 2px 6px rgba(229,72,77,.35)!important}',
      '.btn.cs-recording:hover{background:#d13c41!important}',
      '.cs-dot{width:8px;height:8px;border-radius:50%;background:currentColor;display:inline-block;animation:cs-pulse 1.1s infinite}',
      '@keyframes cs-pulse{0%,100%{opacity:1}50%{opacity:.25}}',
      'body.cs-rec-live .sim-badge,body.cs-rec-live .toast{display:none!important}',
      'body.cs-rec-live #capture,body.cs-rec-live #capture *{cursor:none!important}',
      '.cs-orb{position:fixed;left:-100px;top:-100px;width:34px;height:34px;margin:-17px 0 0 -17px;border-radius:50%;background:rgba(18,18,24,.16);border:1.5px solid rgba(255,255,255,.9);box-shadow:0 2px 9px rgba(0,0,0,.28),inset 0 0 10px rgba(255,255,255,.25);pointer-events:none;z-index:2147483646;opacity:0;transition:opacity .16s ease,transform .09s ease}',
      '.cs-orb.cs-show{opacity:1}.cs-orb.cs-press{transform:scale(.72);background:rgba(18,18,24,.3)}',
      '.cs-ripple{position:fixed;width:14px;height:14px;margin:-7px 0 0 -7px;border-radius:50%;border:2px solid rgba(255,255,255,.95);background:rgba(99,91,255,.18);pointer-events:none;z-index:2147483645;animation:cs-rip .52s ease-out forwards}',
      '@keyframes cs-rip{from{transform:scale(.4);opacity:.95}to{transform:scale(3.6);opacity:0}}',
      /* ---- review studio ---- */
      '.cs-rev{position:fixed;inset:0;z-index:2147483640;display:none;align-items:center;justify-content:center;background:rgba(12,14,20,.55);backdrop-filter:blur(3px);font-family:Inter,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}',
      '.cs-rev.on{display:flex}',
      '.cs-rev-card{width:560px;max-width:94vw;max-height:94vh;overflow:auto;background:#fff;border-radius:16px;box-shadow:0 30px 80px rgba(8,10,20,.45);display:flex;flex-direction:column}',
      '.cs-rev-hd{display:flex;align-items:center;justify-content:space-between;padding:15px 18px 12px;border-bottom:1px solid #eceef3}',
      '.cs-rev-hd b{font-size:14.5px;color:#14151a;letter-spacing:-.2px}',
      '.cs-rev-hd .x{border:0;background:none;color:#9aa0b0;font-size:17px;cursor:pointer;padding:2px 6px;border-radius:6px;line-height:1}',
      '.cs-rev-hd .x:hover{background:#f1f2f6;color:#14151a}',
      '.cs-rev-bd{padding:16px 18px;display:flex;flex-direction:column;gap:13px}',
      '.cs-rev-vwrap{display:flex;justify-content:center;background:#0e0f13;border-radius:12px;overflow:hidden}',
      '.cs-rev-vid{max-width:100%;max-height:46vh;display:block}',
      '.cs-rev-film{position:relative;height:52px;border-radius:9px;overflow:hidden;background:#0e0f13;user-select:none;touch-action:none}',
      '.cs-rev-thumbs{position:absolute;inset:0;display:flex}',
      '.cs-rev-thumbs canvas,.cs-rev-thumbs img{height:100%;flex:1 1 0;object-fit:cover;min-width:0;display:block}',
      '.cs-rev-mask{position:absolute;top:0;bottom:0;background:rgba(10,12,18,.62);pointer-events:none}',
      '.cs-rev-sel{position:absolute;top:0;bottom:0;border:2px solid #635bff;border-left:0;border-right:0;box-shadow:0 0 0 100vmax rgba(0,0,0,0)}',
      '.cs-rev-h{position:absolute;top:0;bottom:0;width:14px;background:#635bff;cursor:ew-resize;display:flex;align-items:center;justify-content:center;z-index:3}',
      '.cs-rev-h::after{content:"";width:2px;height:16px;background:rgba(255,255,255,.9);border-radius:2px}',
      '.cs-rev-h.a{border-radius:9px 0 0 9px}.cs-rev-h.b{border-radius:0 9px 9px 0}',
      '.cs-rev-ph{position:absolute;top:0;bottom:0;width:2px;background:#fff;box-shadow:0 0 4px rgba(0,0,0,.5);pointer-events:none;z-index:2}',
      '.cs-rev-times{display:flex;align-items:center;gap:10px;font-size:12px;color:#5b6070;flex-wrap:wrap}',
      '.cs-rev-times b{color:#14151a;font-variant-numeric:tabular-nums}',
      '.cs-rev-psel{margin-left:auto;border:1px solid #e4e6ee;background:#f7f8fb;border-radius:8px;padding:6px 11px;font-size:12px;font-weight:600;color:#4b45d6;cursor:pointer;font-family:inherit}',
      '.cs-rev-psel:hover{background:#eeecff;border-color:#dcd9fb}',
      '.cs-rev-opts{display:flex;gap:16px;flex-wrap:wrap;align-items:center;padding-top:2px}',
      '.cs-rev-opts label{font-size:12px;color:#5b6070;display:flex;align-items:center;gap:7px}',
      '.cs-rev-opts select{font-family:inherit;font-size:12.5px;font-weight:550;color:#14151a;background:#f7f8fb;border:1px solid #e4e6ee;border-radius:7px;padding:6px 8px;cursor:pointer}',
      '.cs-rev-opts .gi{color:#9aa0b0;font-size:11px}',
      '.cs-rev-prog{display:none;flex-direction:column;gap:6px}',
      '.cs-rev-prog.on{display:flex}',
      '.cs-rev-prog .track{height:7px;border-radius:5px;background:#eceef3;overflow:hidden}',
      '.cs-rev-prog .bar{height:100%;width:0;background:linear-gradient(90deg,#635bff,#8b5cf6);transition:width .15s}',
      '.cs-rev-prog .lbl{font-size:11.5px;color:#7a8194}',
      '.cs-rev-ft{display:flex;align-items:center;gap:9px;padding:13px 18px;border-top:1px solid #eceef3}',
      '.cs-rev-btn{border:0;border-radius:9px;padding:9px 15px;font-size:12.5px;font-weight:650;cursor:pointer;font-family:inherit;display:inline-flex;align-items:center;gap:7px;letter-spacing:-.1px}',
      '.cs-rev-btn.ghost{background:#fff;color:#3a3f4c;border:1px solid #e4e6ee}.cs-rev-btn.ghost:hover{background:#f7f8fb}',
      '.cs-rev-btn.p{background:#635bff;color:#fff;box-shadow:0 2px 6px rgba(99,91,255,.3)}.cs-rev-btn.p:hover{background:#4b45d6}',
      '.cs-rev-btn.d{background:#14151a;color:#fff}.cs-rev-btn.d:hover{background:#000}',
      '.cs-rev-btn:disabled{opacity:.5;cursor:default}',
      '.cs-rev-grow{flex:1}'
    ].join('');
    document.head.appendChild(s);
  }
  function regionOK(){ return typeof window.CropTarget!=='undefined' && typeof CropTarget.fromElement==='function'; }
  function pickMime(){ if(!window.MediaRecorder) return null; var c=['video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm']; for(var i=0;i<c.length;i++){ if(MediaRecorder.isTypeSupported(c[i])) return c[i]; } return ''; }
  function two(n){ return (n<10?'0':'')+n; }
  function tfmt(s){ s=Math.max(0,s); return Math.floor(s/60)+':'+two(Math.floor(s%60))+'.'+Math.floor((s%1)*10); }
  function toast(m){ if(cfg&&cfg.toast) cfg.toast(m); }
  function idle(){ if(cfg&&cfg.button) cfg.button.innerHTML='<svg viewBox="0 0 24 24" fill="currentColor" style="width:12px;height:12px"><circle cx="12" cy="12" r="7"/></svg>Record'; }
  function paint(){ if(!cfg||!active) return; var s=Math.floor((Date.now()-startT)/1000); cfg.button.innerHTML='<span class="cs-dot"></span>Stop · '+two(Math.floor(s/60))+':'+two(s%60); }
  function tracksStop(){ if(stream){ stream.getTracks().forEach(function(t){ try{t.stop();}catch(e){} }); stream=null; } }

  /* ---- touch-orb cursor + click ripple ---- */
  var orb=null;
  function overCap(x,y){ var el=cfg&&cfg.getEl&&cfg.getEl(); if(!el) return false; var r=el.getBoundingClientRect(); return x>=r.left && x<=r.right && y>=r.top && y<=r.bottom; }
  function onMove(e){ if(!active) return; if(!orb){ orb=document.createElement('div'); orb.className='cs-orb'; document.body.appendChild(orb); } orb.style.left=e.clientX+'px'; orb.style.top=e.clientY+'px'; if(overCap(e.clientX,e.clientY)) orb.classList.add('cs-show'); else orb.classList.remove('cs-show'); }
  function onDown(e){ if(!active) return; if(orb) orb.classList.add('cs-press'); if(overCap(e.clientX,e.clientY)){ var r=document.createElement('div'); r.className='cs-ripple'; r.style.left=e.clientX+'px'; r.style.top=e.clientY+'px'; document.body.appendChild(r); setTimeout(function(){ if(r&&r.parentNode) r.parentNode.removeChild(r); },560); } }
  function onUp(){ if(orb) orb.classList.remove('cs-press'); }
  function hideIfrCursor(on){ try{ var el=cfg&&cfg.getEl&&cfg.getEl(); if(!el) return; var fr=el.querySelectorAll('iframe'); for(var i=0;i<fr.length;i++){ try{ var d=fr[i].contentDocument; if(!d||!d.head) continue; var ex=d.getElementById('cs-nocur'); if(on){ if(!ex){ var st=d.createElement('style'); st.id='cs-nocur'; st.textContent='*{cursor:none!important}'; d.head.appendChild(st); } } else if(ex&&ex.parentNode){ ex.parentNode.removeChild(ex); } }catch(e){} } }catch(e){} }
  function cursorOn(){ document.addEventListener('mousemove',onMove,true); document.addEventListener('mousedown',onDown,true); document.addEventListener('mouseup',onUp,true); hideIfrCursor(true); }
  function cursorOff(){ document.removeEventListener('mousemove',onMove,true); document.removeEventListener('mousedown',onDown,true); document.removeEventListener('mouseup',onUp,true); hideIfrCursor(false); if(orb&&orb.parentNode) orb.parentNode.removeChild(orb); orb=null; }

  /* ---------------- record / stop ---------------- */
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
    rec.onstop=function(){ finalize((rec&&rec.mimeType)||mt); tracksStop(); };
    toast('Recording… click Stop when you’re done.');
    rec.start(200);
    active=true; startT=Date.now(); document.body.classList.add('cs-rec-live'); cursorOn(); cfg.button.classList.add('cs-recording'); paint(); timer=setInterval(paint,500);
  }
  function stop(){
    if(!active) return;
    active=false; clearInterval(timer); document.body.classList.remove('cs-rec-live'); cursorOff(); if(cfg&&cfg.button){ cfg.button.classList.remove('cs-recording'); idle(); }
    if(rec && rec.state!=='inactive'){ try{ rec.stop(); }catch(e){ tracksStop(); } } else { tracksStop(); }
  }
  function finalize(mt){
    var type=(mt||'video/webm').split(';')[0];
    var blob=new Blob(chunks,{type:type}); chunks=[];
    if(!blob.size){ toast('Recording was empty — try again.'); return; }
    openReview(blob, type);
  }
  function downloadBlob(blob, name){ var url=URL.createObjectURL(blob); var a=document.createElement('a'); a.href=url; a.download=name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function(){ URL.revokeObjectURL(url); },6000); }
  function baseName(){ return (cfg&&cfg.filename&&cfg.filename())||'channel-studio'; }

  /* ---------------- review studio ---------------- */
  var rev=null, E=null, srcVid=null, blobUrl=null, curBlob=null, dur=0, selA=0, selB=0, busy=false, rafId=0, selPlay=false;

  function seekTo(v,t){ return new Promise(function(res){ var done=false; function h(){ if(done)return; done=true; v.removeEventListener('seeked',h); res(); } v.addEventListener('seeked',h); try{ v.currentTime=Math.max(0,Math.min(t, (v.duration||t))); }catch(e){} setTimeout(h,500); }); }

  function buildDOM(){
    if(rev) return;
    rev=document.createElement('div'); rev.className='cs-rev';
    rev.innerHTML=''
      +'<div class="cs-rev-card">'
      +'<div class="cs-rev-hd"><b>Review recording</b><button class="x" data-x>&times;</button></div>'
      +'<div class="cs-rev-bd">'
      +'<div class="cs-rev-vwrap"><video class="cs-rev-vid" playsinline muted loop></video></div>'
      +'<div class="cs-rev-film"><div class="cs-rev-thumbs" data-thumbs></div><div class="cs-rev-mask" data-maskL></div><div class="cs-rev-mask" data-maskR></div><div class="cs-rev-sel" data-sel></div><div class="cs-rev-ph" data-ph></div><div class="cs-rev-h a" data-ha></div><div class="cs-rev-h b" data-hb></div></div>'
      +'<div class="cs-rev-times">Trim: <b data-ta>0:00.0</b> → <b data-tb>0:00.0</b> · <span data-sd>0.0s</span><button class="cs-rev-psel" data-psel>▶ Play selection</button></div>'
      +'<div class="cs-rev-opts"><label>GIF frame rate <select data-fps><option value="10">10 fps</option><option value="15" selected>15 fps</option><option value="20">20 fps</option></select></label>'
      +'<label>GIF size <select data-size><option value="0" selected>Auto</option><option value="240">Small</option><option value="360">Medium</option><option value="480">Large</option></select></label>'
      +'<span class="gi" data-gi></span></div>'
      +'<div class="cs-rev-prog" data-prog><div class="track"><div class="bar" data-bar></div></div><span class="lbl" data-plbl></span></div>'
      +'</div>'
      +'<div class="cs-rev-ft"><button class="cs-rev-btn ghost" data-rerec>↺ Re-record</button><div class="cs-rev-grow"></div><button class="cs-rev-btn d" data-webm>⬇ WebM</button><button class="cs-rev-btn p" data-gif>⬇ GIF</button></div>'
      +'</div>';
    document.body.appendChild(rev);
    E={ card:rev.querySelector('.cs-rev-card'), vid:rev.querySelector('.cs-rev-vid'), film:rev.querySelector('.cs-rev-film'), thumbs:rev.querySelector('[data-thumbs]'), maskL:rev.querySelector('[data-maskL]'), maskR:rev.querySelector('[data-maskR]'), sel:rev.querySelector('[data-sel]'), ph:rev.querySelector('[data-ph]'), ha:rev.querySelector('[data-ha]'), hb:rev.querySelector('[data-hb]'), ta:rev.querySelector('[data-ta]'), tb:rev.querySelector('[data-tb]'), sd:rev.querySelector('[data-sd]'), psel:rev.querySelector('[data-psel]'), fps:rev.querySelector('[data-fps]'), size:rev.querySelector('[data-size]'), gi:rev.querySelector('[data-gi]'), prog:rev.querySelector('[data-prog]'), bar:rev.querySelector('[data-bar]'), plbl:rev.querySelector('[data-plbl]'), webm:rev.querySelector('[data-webm]'), gif:rev.querySelector('[data-gif]'), rerec:rev.querySelector('[data-rerec]'), x:rev.querySelector('[data-x]') };
    srcVid=document.createElement('video'); srcVid.muted=true; srcVid.playsInline=true; srcVid.preload='auto';
    E.x.onclick=closeReview; E.rerec.onclick=function(){ closeReview(); start(); };
    E.psel.onclick=function(){ selPlay=!selPlay; E.psel.textContent=selPlay?'❚❚ Stop':'▶ Play selection'; if(selPlay){ E.vid.currentTime=selA; E.vid.play(); } };
    E.webm.onclick=exportWebM; E.gif.onclick=exportGIF;
    E.fps.onchange=updGi; E.size.onchange=updGi;
    rev.addEventListener('mousedown', function(e){ if(e.target===rev) closeReview(); });
    handleDrag(E.ha, 'a'); handleDrag(E.hb, 'b');
  }

  function resolveDuration(v){
    return new Promise(function(res){
      var settled=false;
      function done(D){ if(settled) return; settled=true; v.removeEventListener('durationchange',chk); v.removeEventListener('loadedmetadata',onmeta); try{ v.currentTime=0; }catch(e){} res(D>0&&isFinite(D)?D:0); }
      function chk(){ if(isFinite(v.duration)&&v.duration>0) done(v.duration); }
      function onmeta(){ if(isFinite(v.duration)&&v.duration>0) done(v.duration); else { try{ v.currentTime=1e6; }catch(e){} } }
      v.addEventListener('loadedmetadata', onmeta);
      v.addEventListener('durationchange', chk);
      if(v.readyState>=1) onmeta();
      setTimeout(function(){ done(v.duration); }, 4000);
    });
  }
  function openReview(blob, type){
    buildDOM();
    curBlob=blob;
    if(blobUrl) URL.revokeObjectURL(blobUrl);
    blobUrl=URL.createObjectURL(blob);
    E.vid.src=blobUrl; srcVid.src=blobUrl;
    busy=false; selPlay=false; E.psel.textContent='▶ Play selection';
    setProgress(-1);
    E.webm.disabled=E.gif.disabled=false;
    rev.classList.add('on');
    startLoop();
    resolveDuration(srcVid).then(function(D){
      dur=D>0?D:1; selA=0; selB=dur; layout(); updGi();
      genThumbs();
      try{ E.vid.currentTime=0; }catch(e){}
      E.vid.play().catch(function(){});
    });
  }
  function closeReview(){ if(!rev) return; rev.classList.remove('on'); selPlay=false; try{ E.vid.pause(); }catch(e){} stopLoop(); }

  function px(frac){ return frac*E.film.clientWidth; }
  function layout(){
    var w=E.film.clientWidth||1; var a=selA/dur, b=selB/dur;
    E.ha.style.left=(a*w-7)+'px'; E.hb.style.left=(b*w-7)+'px';
    E.sel.style.left=(a*w)+'px'; E.sel.style.width=((b-a)*w)+'px';
    E.maskL.style.left='0'; E.maskL.style.width=(a*w)+'px';
    E.maskR.style.left=(b*w)+'px'; E.maskR.style.width=((1-b)*w)+'px';
    E.ta.textContent=tfmt(selA); E.tb.textContent=tfmt(selB); E.sd.textContent=(selB-selA).toFixed(1)+'s';
  }
  function updGi(){ if(!srcVid) return; var fps=+E.fps.value; var d=Math.max(0.1,selB-selA); var frames=Math.max(1,Math.round(d*fps)); E.gi.textContent='≈ '+frames+' frames'; }

  function handleDrag(handle, which){
    handle.addEventListener('mousedown', function(ev){ ev.preventDefault(); if(busy) return;
      var move=function(e){ var r=E.film.getBoundingClientRect(); var f=Math.max(0,Math.min(1,(e.clientX-r.left)/r.width)); var t=f*dur; var min=Math.min(0.1,dur*0.02);
        if(which==='a'){ selA=Math.min(t, selB-min); if(selA<0)selA=0; } else { selB=Math.max(t, selA+min); if(selB>dur)selB=dur; }
        layout(); updGi(); if(!selPlay){ E.vid.currentTime=(which==='a'?selA:Math.max(selA,selB-0.05)); } };
      var up=function(){ document.removeEventListener('mousemove',move,true); document.removeEventListener('mouseup',up,true); };
      document.addEventListener('mousemove',move,true); document.addEventListener('mouseup',up,true);
    });
  }

  function startLoop(){ stopLoop(); var tick=function(){ if(rev&&rev.classList.contains('on')){ if(dur>0){ E.ph.style.left=((E.vid.currentTime/dur)*E.film.clientWidth)+'px'; if(selPlay && (E.vid.currentTime>=selB || E.vid.currentTime<selA-0.02)){ E.vid.currentTime=selA; } } rafId=requestAnimationFrame(tick); } }; rafId=requestAnimationFrame(tick); }
  function stopLoop(){ if(rafId) cancelAnimationFrame(rafId); rafId=0; }

  async function genThumbs(){
    E.thumbs.innerHTML=''; var N=12, made=[];
    var iw=srcVid.videoWidth||160, ih=srcVid.videoHeight||90; if(!iw||!ih) return;
    var th=52, tw=Math.max(8,Math.round(th*iw/ih));
    for(var i=0;i<N;i++){ made.push(document.createElement('canvas')); made[i].width=tw; made[i].height=th; E.thumbs.appendChild(made[i]); }
    if(!srcVid.duration||!isFinite(srcVid.duration)) return;
    for(var j=0;j<N;j++){ try{ await seekTo(srcVid,(j+0.5)/N*srcVid.duration); made[j].getContext('2d').drawImage(srcVid,0,0,made[j].width,made[j].height); }catch(e){} }
  }

  /* ---- progress ---- */
  function setProgress(frac, label){ if(frac<0){ E.prog.classList.remove('on'); E.bar.style.width='0'; return; } E.prog.classList.add('on'); E.bar.style.width=Math.round(frac*100)+'%'; E.plbl.textContent=label||''; }

  /* ---- WebM export (raw if untrimmed, else re-encode slice) ---- */
  async function exportWebM(){
    if(busy) return;
    var full = selA<=0.05 && selB>=dur-0.05;
    if(full){ downloadBlob(curBlob, baseName()+'.webm'); toast('WebM saved.'); return; }
    if(!srcVid.captureStream && !srcVid.mozCaptureStream){ toast('Trimmed WebM needs Chrome/Edge — saving full clip.'); downloadBlob(curBlob, baseName()+'.webm'); return; }
    busy=true; E.webm.disabled=E.gif.disabled=true; setProgress(0,'Trimming WebM…');
    try{
      var s=srcVid.captureStream?srcVid.captureStream():srcVid.mozCaptureStream();
      var mt=pickMime();
      var r=new MediaRecorder(s, mt?{mimeType:mt,videoBitsPerSecond:8000000}:undefined);
      var ch=[]; r.ondataavailable=function(e){ if(e.data&&e.data.size) ch.push(e.data); };
      var done=new Promise(function(res){ r.onstop=res; });
      await seekTo(srcVid, selA); r.start();
      srcVid.play();
      await new Promise(function(res){ var chk=function(){ if(srcVid.currentTime>=selB || srcVid.ended){ res(); return; } setProgress(Math.min(1,(srcVid.currentTime-selA)/Math.max(0.1,selB-selA)),'Trimming WebM…'); requestAnimationFrame(chk); }; requestAnimationFrame(chk); });
      srcVid.pause(); r.stop(); await done;
      downloadBlob(new Blob(ch,{type:(mt||'video/webm').split(';')[0]}), baseName()+'.webm');
      toast('Trimmed WebM saved.');
    }catch(e){ toast('Trim failed — saving full clip.'); downloadBlob(curBlob, baseName()+'.webm'); }
    finally{ busy=false; E.webm.disabled=E.gif.disabled=false; setProgress(-1); }
  }

  /* ---- GIF export ---- */
  var BAYER=[[0,8,2,10],[12,4,14,6],[3,11,1,9],[15,7,13,5]];
  function dither(data,w,h,amt){ for(var y=0;y<h;y++){ for(var x=0;x<w;x++){ var p=(y*w+x)*4; var t=(BAYER[y&3][x&3]/15-0.5)*amt; var r=data[p]+t,g=data[p+1]+t,b=data[p+2]+t; data[p]=r<0?0:r>255?255:r; data[p+1]=g<0?0:g>255?255:g; data[p+2]=b<0?0:b>255?255:b; } } }
  async function exportGIF(){
    if(busy) return;
    if(!window.gifenc){ toast('GIF encoder not loaded.'); return; }
    var iw=srcVid.videoWidth, ih=srcVid.videoHeight; if(!iw||!ih){ toast('Video not ready — try again.'); return; }
    busy=true; E.webm.disabled=E.gif.disabled=true; setProgress(0,'Preparing…');
    try{
      var cap=+E.size.value||Math.min(iw,480);
      var scale=Math.min(1, cap/iw);
      var W=Math.max(2,Math.round(iw*scale)), H=Math.max(2,Math.round(ih*scale));
      var fps=+E.fps.value, d=Math.max(0.1,selB-selA);
      var nF=Math.min(450, Math.max(1, Math.round(d*fps)));
      var delay=Math.round(1000/fps);
      var cv=document.createElement('canvas'); cv.width=W; cv.height=H; var ctx=cv.getContext('2d',{willReadFrequently:true});
      var enc=window.gifenc.GIFEncoder();
      for(var i=0;i<nF;i++){
        var t=selA + (i/Math.max(1,nF-1))*d; if(nF===1) t=selA;
        await seekTo(srcVid, Math.min(t, selB));
        ctx.drawImage(srcVid,0,0,W,H);
        var img=ctx.getImageData(0,0,W,H);
        var pal=window.gifenc.quantize(img.data,256);
        dither(img.data,W,H,10);
        var idx=window.gifenc.applyPalette(img.data,pal);
        enc.writeFrame(idx,W,H,{palette:pal,delay:delay});
        setProgress((i+1)/nF,'Encoding GIF… '+(i+1)+'/'+nF);
        if(i%3===0) await new Promise(function(r){ setTimeout(r,0); });
      }
      enc.finish();
      downloadBlob(new Blob([enc.bytes()],{type:'image/gif'}), baseName()+'.gif');
      toast('GIF saved ('+W+'×'+H+', '+nF+' frames).');
    }catch(e){ toast('GIF export failed.'); }
    finally{ busy=false; E.webm.disabled=E.gif.disabled=false; setProgress(-1); }
  }

  window.ChannelStudioRecorder={ init:function(opts){ cfg=opts; inject(); if(!cfg.button) return; idle(); cfg.button.addEventListener('click', function(){ active?stop():start(); }); }, _openReview:openReview };
})();
