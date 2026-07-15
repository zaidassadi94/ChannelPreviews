/* ==========================================================================
   Channel Studio — shared channel dropdown routing.
   initChannelNav(localChannels, onLocal): channels owned by the current tool
   switch locally via onLocal(v); everything else navigates to the tool that
   owns it (messaging = whatsapp/rcs/sms, gmail = gmail, notify = push/inapp).
   ========================================================================== */
function initChannelNav(localChannels, onLocal){
  const sel=document.getElementById('selChannel'); if(!sel) return;
  sel.addEventListener('change', e=>{
    const v=e.target.value;
    if(localChannels.includes(v)){ if(onLocal) onLocal(v); return; }
    if(v==='gmail'){ location.href='../gmail-preview-tool/index.html'; return; }
    if(v==='push'||v==='inapp'){ location.href='../notify-preview-tool/index.html?channel='+v; return; }
    location.href='../messaging-preview-tool/index.html?channel='+v;
  });
}
