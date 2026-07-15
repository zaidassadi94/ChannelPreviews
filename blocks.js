/* ==========================================================================
   Channel Studio — shared DIY block builder + image field.
   serRows/parseRows serialize block rows to/from the compact string format
   (`Label | type | value >> reply`). buildBlocks(msg,key,host,onChange)
   renders the editor blocks into `host` and calls onChange() (the tool's
   render) after each edit. imageField(get,set) is the upload/URL image row
   (uses pickImage + phGray from image-system.js). No build step.
   ========================================================================== */
function splitResp(l){ const rr=l.split('>>'); if(rr.length>1) return [rr[0].trim(), rr.slice(1).join('>>').trim()]; return [l.trim(),'']; }
function parseButtons(raw){ return (raw||'').split('\n').map(l=>l.trim()).filter(Boolean).map(l=>{ const [m,response]=splitResp(l); const p=m.split('|').map(x=>x.trim()); let type=(p[1]||'reply').toLowerCase(); if(!['reply','url','call','map','copy'].includes(type)) type='reply'; return {label:p[0]||'Button', type, value:p[2]||'', response}; }); }
function parseCards(raw){ return (raw||'').split('\n').map(l=>l.trim()).filter(Boolean).map(l=>{ const p=l.split('|').map(x=>x.trim()); return {img:p[0]||'', title:p[1]||'', sub:p[2]||'', btn:p[3]||'', val:p[4]||''}; }); }
function parseListItems(raw){ return (raw||'').split('\n').map(l=>l.trim()).filter(Boolean).map(l=>{ const [m,response]=splitResp(l); const p=m.split('|').map(x=>x.trim()); return {t:p[0]||'', d:p[1]||'', response}; }); }
function parseChips(raw){ if(!raw) return []; const src=raw.indexOf('\n')>=0?raw.split('\n'):raw.split(','); return src.map(x=>x.trim()).filter(Boolean).map(l=>{ const [m,response]=splitResp(l); return {label:m, response}; }); }
function serRows(key,rows){
  if(key==='buttons') return rows.map(r=>{ const tp=r.type||'reply'; let a=[r.label||'',tp]; if(tp!=='reply'&&r.value) a.push(r.value); let s=a.join(' | '); if(tp==='reply'&&r.reply) s+=' >> '+r.reply; return s; }).join('\n');
  if(key==='items') return rows.map(r=>{ let s=r.t||''; if(r.d) s+=' | '+r.d; if(r.reply) s+=' >> '+r.reply; return s; }).join('\n');
  if(key==='chips') return rows.map(r=>{ let s=r.label||''; if(r.reply) s+=' >> '+r.reply; return s; }).join('\n');
  if(key==='cards') return rows.map(r=>[r.img||'',r.title||'',r.sub||'',r.btn||'',r.val||''].join(' | ')).join('\n');
  return '';
}
function parseRows(key,val){
  if(key==='buttons') return parseButtons(val).map(b=>({label:b.label,type:b.type,value:b.value,reply:b.response}));
  if(key==='items') return parseListItems(val).map(i=>({t:i.t,d:i.d,reply:i.response}));
  if(key==='chips') return parseChips(val).map(c=>({label:c.label,reply:c.response}));
  if(key==='cards') return parseCards(val).map(c=>({img:c.img,title:c.title,sub:c.sub,btn:c.btn,val:c.val}));
  return [];
}
function pickImage(cb){ const inp=document.createElement('input'); inp.type='file'; inp.accept='image/*'; inp.onchange=()=>{ const f=inp.files[0]; if(!f)return; const r=new FileReader(); r.onload=()=>cb(r.result); r.readAsDataURL(f); }; inp.click(); }
function imageField(get,set){
  const row=document.createElement('div'); row.className='imgf';
  const prev=document.createElement('img'); prev.className='prev';
  const setPrev=()=>{ const v=get(); prev.src = v || phGray(120,90); };
  const col=document.createElement('div'); col.className='col';
  const up=document.createElement('button'); up.type='button'; up.className='up'; up.textContent='⬆ Upload image';
  const url=document.createElement('input'); url.type='text'; url.placeholder='…or paste an image URL';
  const cur=get(); url.value=(cur && !/^data:/.test(cur))?cur:'';
  up.onclick=()=>pickImage(d=>{ set(d); url.value=''; setPrev(); });
  url.addEventListener('input',()=>{ set(url.value.trim()); setPrev(); });
  col.appendChild(up); col.appendChild(url); row.appendChild(prev); row.appendChild(col);
  setPrev(); return row;
}
function buildBlocks(msg,key,host,onChange){
  let rows=parseRows(key,msg[key]||'');
  const commit=()=>{ msg[key]=serRows(key,rows); onChange(); };
  const NAMES={buttons:'Button',items:'Item',chips:'Reply',cards:'Product'};
  const ADD={buttons:'+ Add button',items:'+ Add item',chips:'+ Add reply chip',cards:'+ Add product'};
  const NEW={buttons:()=>({label:'Button',type:'reply',value:'',reply:''}),items:()=>({t:'Option',d:'',reply:''}),chips:()=>({label:'Reply',reply:''}),cards:()=>({img:'',title:'Product',sub:'',btn:'Shop',val:''})};
  function fld(blk,label,el){ const l=document.createElement('label'); l.className='mini'; l.textContent=label; blk.appendChild(l); blk.appendChild(el); }
  function inp(val,ph,on){ const i=document.createElement('input'); i.type='text'; i.value=val||''; if(ph)i.placeholder=ph; i.addEventListener('input',()=>on(i.value)); return i; }
  function ta(val,ph,on){ const t=document.createElement('textarea'); t.value=val||''; if(ph)t.placeholder=ph; t.addEventListener('input',()=>on(t.value)); return t; }
  function replyBox(blk,row){ const rb=document.createElement('div'); rb.className='blk-reply'; const l=document.createElement('label'); l.className='mini'; l.textContent='↳ Auto-reply when tapped (optional)'; rb.appendChild(l); rb.appendChild(ta(row.reply,'What the business replies…',v=>{row.reply=v;commit();})); blk.appendChild(rb); }
  function draw(){
    host.innerHTML='';
    rows.forEach((row,ri)=>{
      const blk=document.createElement('div'); blk.className='blk';
      const head=document.createElement('div'); head.className='blk-h';
      const t=document.createElement('span'); t.className='t'; t.textContent=NAMES[key]+' '+(ri+1); head.appendChild(t);
      const x=document.createElement('button'); x.className='x'; x.type='button'; x.textContent='✕'; x.onclick=()=>{ rows.splice(ri,1); commit(); draw(); }; head.appendChild(x);
      blk.appendChild(head);
      if(key==='buttons'){
        fld(blk,'Button text',inp(row.label,'e.g. Shop now',v=>{row.label=v;commit();}));
        const sel=document.createElement('select'); [['reply','Quick reply'],['url','Link (opens URL)'],['call','Call number'],['copy','Copy code']].forEach(o=>{const op=document.createElement('option');op.value=o[0];op.textContent=o[1];if((row.type||'reply')===o[0])op.selected=true;sel.appendChild(op);}); sel.addEventListener('change',()=>{row.type=sel.value;commit();draw();}); fld(blk,'Button type',sel);
        const tp=row.type||'reply';
        if(tp==='url') fld(blk,'Link URL',inp(row.value,'https://…',v=>{row.value=v;commit();}));
        else if(tp==='call') fld(blk,'Phone number',inp(row.value,'+1 555…',v=>{row.value=v;commit();}));
        else if(tp==='copy') fld(blk,'Code to copy',inp(row.value,'e.g. NOVA10',v=>{row.value=v;commit();}));
        else replyBox(blk,row);
      } else if(key==='items'){
        fld(blk,'Title',inp(row.t,'e.g. Track my order',v=>{row.t=v;commit();}));
        fld(blk,'Description',inp(row.d,'optional',v=>{row.d=v;commit();}));
        replyBox(blk,row);
      } else if(key==='chips'){
        fld(blk,'Reply text',inp(row.label,'e.g. Confirm',v=>{row.label=v;commit();}));
        replyBox(blk,row);
      } else if(key==='cards'){
        const il=document.createElement('label'); il.className='mini'; il.textContent='Image'; blk.appendChild(il);
        blk.appendChild(imageField(()=>row.img,v=>{row.img=v;commit();},row.title));
        fld(blk,'Title',inp(row.title,'Product name',v=>{row.title=v;commit();}));
        fld(blk,'Subtitle / price',inp(row.sub,'e.g. $149',v=>{row.sub=v;commit();}));
        fld(blk,'Button label',inp(row.btn,'e.g. Shop',v=>{row.btn=v;commit();}));
        fld(blk,'Button link',inp(row.val,'https://…',v=>{row.val=v;commit();}));
      }
      host.appendChild(blk);
    });
    const add=document.createElement('button'); add.type='button'; add.className='blk-add'; add.textContent=ADD[key];
    add.onclick=()=>{ rows.push(NEW[key]()); commit(); draw(); }; host.appendChild(add);
  }
  draw();
}
