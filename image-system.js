/* ==========================================================================
   Channel Studio — shared image system.
   Keyword photos: photo(kw,w,h) / ePhoto(kw) return window.__PXIMG[kw] (a real
   Pexels CDN URL resolved once via setup.html / resolve-images.js into images.js)
   or a self-contained SVG line-illustration (tile) as fallback.
   KW maps vertical -> keyword; IMGKW maps product name -> keyword (kwFor).
   IMPORTANT: keep the query maps in setup.html + resolve-images.js in sync with
   the keywords used here. images.js stays data-only. No build step.
   ========================================================================== */
function escXml(x){ return (x==null?'':String(x)).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function hueOf(x){ let h=0; x=x||'x'; for(let i=0;i<x.length;i++) h=(h*31+x.charCodeAt(i))>>>0; return h%360; }
const ILLUS={
  shirt:"M8 3l-4 2 1 4 2-1v13h10V8l2 1 1-4-4-2a3 3 0 01-8 0z",
  pants:"M7 3h10l-1 18h-4l-1-10-1 10H6z",
  hoodie:"M6 8l-2 2 2 2v9h12v-9l2-2-2-2M8 6a4 4 0 018 0M9 6c1 1.5 5 1.5 6 0",
  headphones:"M5 13a7 7 0 0114 0M4 13h2v6H5a1 1 0 01-1-1zM20 13h-2v6h1a1 1 0 001-1z",
  watch:"M8 6V3h8v3M8 18v3h8v-3M6 6h12v12H6zM12 9v3l2 1",
  phone:"M7 2h10a1 1 0 011 1v18a1 1 0 01-1 1H7a1 1 0 01-1-1V3a1 1 0 011-1zM10 19h4",
  battery:"M3 8h15a1 1 0 011 1v6a1 1 0 01-1 1H3a1 1 0 01-1-1V9a1 1 0 011-1zM21 11v2M6 12h4",
  bottle:"M10 2h4v3l1 2v12a2 2 0 01-2 2h-2a2 2 0 01-2-2V7l1-2zM9 12h6",
  card:"M2 6h20a1 1 0 011 1v10a1 1 0 01-1 1H2a1 1 0 01-1-1V7a1 1 0 011-1zM1 10h22M5 15h4",
  coins:"M8 7c0-1.7 2.7-3 6-3s6 1.3 6 3-2.7 3-6 3-6-1.3-6-3zM8 7v5c0 1.7 2.7 3 6 3s6-1.3 6-3V7M4 14c0-1.4 2.2-2.5 5-2.5M4 14v4c0 1.4 2.2 2.5 5 2.5s5-1.1 5-2.5v-2",
  piggy:"M3 13a7 6 0 0113-3.5L20 9l1 3-1.5 1.5.5 3h-3l-1-1.5a7 6 0 01-9 0L6 19H4l-.5-3A3.5 3.5 0 013 13zM16 11.5h.01",
  umbrella:"M12 3v2M3 11a9 8 0 0118 0zM3 11h18M12 11v7a2 2 0 003 1.7",
  gift:"M3 9h18v11H3zM2 6h20v3H2zM12 6V4a2 2 0 10-2 2h2zm0 0V4a2 2 0 112 2h-2zM12 6v14",
  film:"M4 4h16v16H4zM8 4v16M16 4v16M4 8h4M4 12h4M4 16h4M16 8h4M16 12h4M16 16h4",
  news:"M4 5h14v15H5a1 1 0 01-1-1zM18 8h2v10a2 2 0 01-2 2M7 8h6M7 12h6M7 16h4",
  laptop:"M5 5h14v10H5zM3 18l1-3h16l1 3zM9 15h6",
  plane:"M12 3c1 0 1.5 1 1.5 2v4l7 4v2l-7-2v4l2 1.5V21l-3.5-1L9 21v-1.5L11 18v-4l-7 2v-2l7-4V5c0-1 .5-2 1-2z",
  bed:"M3 9v10M3 12h18v7M21 15v4M3 12V9a1 1 0 011-1h6a1 1 0 011 1v3M11 12h9a1 1 0 011 1",
  burger:"M4 9a8 4 0 0116 0zM4 12h16M4 15h16a4 3 0 01-4 3H8a4 3 0 01-4-3zM8 6.5h.01M12 5.8h.01M15.5 6.5h.01",
  pizza:"M12 3l9 15a1 1 0 01-.5 1.4L4 20 3 6a1 1 0 011-1zM9 9h.01M14 13h.01M11 15h.01",
  basket:"M4 8h16l-1.5 11h-13zM4 8l3-4M20 8l-3-4M9 12v4M15 12v4M12 12v4",
  controller:"M7 8h10a4 4 0 014 4v2a3 3 0 01-5.5 1.6L15 14H9l-.5 1.6A3 3 0 013 14v-2a4 4 0 014-4zM6.5 11v3M5 12.5h3M15.5 11.5h.01M17.5 13h.01",
  chart:"M4 4v16h16M8 16v-5M12 16V9M16 16v-8",
  building:"M6 21V4a1 1 0 011-1h10a1 1 0 011 1v17M3 21h18M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2",
  box:"M3 8l9-5 9 5-9 5zM3 8v8l9 5 9-5V8M12 13v8",
  car:"M4 12l1.5-4.5A2 2 0 017.4 6h9.2a2 2 0 011.9 1.5L20 12M3 12h18v4a1 1 0 01-1 1M5 17H4a1 1 0 01-1-1v-4M7 17a2 2 0 004 0M13 17a2 2 0 004 0M6 12h12",
  stethoscope:"M6 3v6a4 4 0 008 0V3M6 3H4M12 3h2M10 13v2a4 4 0 008 0M18 13a2 2 0 100-.01",
  suitcase:"M5 8h14v11H5zM9 8V5h6v3M12 8v11",
  mic:"M12 3a3 3 0 013 3v5a3 3 0 01-6 0V6a3 3 0 013-3zM7 11a5 5 0 0010 0M12 16v4M9 21h6",
  trophy:"M7 4h10v4a5 5 0 01-10 0zM7 6H4v1a3 3 0 003 3M17 6h3v1a3 3 0 01-3 3M10 13h4l1 4H9zM8 20h8",
  family:"M8 8a2 2 0 100-.01M16 8a2 2 0 100-.01M5 20v-4a2 2 0 012-2h2M19 20v-4a2 2 0 00-2-2h-2M12 14a2 2 0 100-.01M10 20v-3a2 2 0 014 0v3",
  server:"M4 4h16v6H4zM4 14h16v6H4zM7 7h.01M7 17h.01",
  sun:"M12 8a4 4 0 100 8 4 4 0 000-8zM12 3v2M12 19v2M3 12h2M19 12h2M6 6l1 1M17 17l1 1M18 6l-1 1M7 17l-1 1"
};
const ILMAP={tshirt:'shirt',clothing:'shirt',trousers:'pants',hoodie:'hoodie',earbuds:'headphones',electronics:'headphones',smartwatch:'watch',battery:'battery',serum:'bottle',cosmetics:'bottle',sunscreen:'bottle',milk:'bottle',savings:'coins',cash:'coins',money:'coins',piggybank:'piggy',creditcard:'card',invoice:'card',car:'car',stethoscope:'stethoscope',suitcase:'suitcase',umbrella:'umbrella',gift:'gift',treasure:'gift',cinema:'film',popcorn:'film',microphone:'mic',newspaper:'news',laptop:'laptop',wireframe:'laptop',classroom:'laptop',dashboard:'chart',stockmarket:'chart',plane:'plane',airplane:'plane',hotel:'bed',hotelroom:'bed',beach:'sun',burger:'burger',food:'burger',sushi:'burger',pizza:'pizza',vegetables:'basket',groceries:'basket',eggs:'box',bread:'box',product:'box',server:'server',controller:'controller',videogame:'controller',gamepad:'controller',smartphone:'phone',wifi:'phone',family:'family',stadium:'trophy',sport:'trophy',building:'building',city:'building',miami:'building',newyork:'building',chicago:'building',dubai:'building',pyramids:'building',mountains:'building'};
function illusFor(kw){ kw=(kw||'').toLowerCase(); return ILMAP[kw] || (ILLUS[kw]?kw:'box'); }
function tile(kw,hue,w,h){ w=w||600; h=h||360; if(hue==null) hue=hueOf(kw); const h2=(hue+34)%360;
  const d=ILLUS[illusFor(kw)]||ILLUS.box; const S=(Math.min(w,h)*0.4/24), cx=w/2, cy=h/2, r=Math.min(w,h)*0.31;
  const svg="<svg xmlns='http://www.w3.org/2000/svg' width='"+w+"' height='"+h+"'>"
    +"<defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='hsl("+hue+",56%,58%)'/><stop offset='1' stop-color='hsl("+h2+",52%,44%)'/></linearGradient></defs>"
    +"<rect width='100%' height='100%' fill='url(#g)'/>"
    +"<circle cx='"+cx.toFixed(0)+"' cy='"+cy.toFixed(0)+"' r='"+r.toFixed(0)+"' fill='rgba(255,255,255,0.13)'/>"
    +"<g transform='translate("+cx.toFixed(1)+","+cy.toFixed(1)+") scale("+S.toFixed(3)+") translate(-12,-12)' fill='none' stroke='#fff' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round' opacity='0.95'><path d='"+d+"'/></g>"
    +"</svg>";
  return 'data:image/svg+xml,'+encodeURIComponent(svg); }
function photo(kw,w,h){ const m=(window.__PXIMG||{}); return m[kw] || tile(kw,null,w,h); }
function phGrad(seed){ const hue=((seed||0)%360+360)%360, h2=(hue+40)%360; const svg="<svg xmlns='http://www.w3.org/2000/svg' width='400' height='260'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='hsl("+hue+",52%,62%)'/><stop offset='1' stop-color='hsl("+h2+",48%,46%)'/></linearGradient></defs><rect width='100%' height='100%' fill='url(#g)'/><circle cx='330' cy='60' r='130' fill='rgba(255,255,255,0.10)'/><circle cx='60' cy='230' r='90' fill='rgba(0,0,0,0.06)'/></svg>"; return 'data:image/svg+xml,'+encodeURIComponent(svg); }
const KW={fashion:'clothing',marketplace:'electronics',d2c:'cosmetics',banking:'money',insurance:'umbrella',fintech:'smartphone',ott:'cinema',news:'newspaper',airlines:'airplane',hotels:'hotel',delivery:'food',grocery:'vegetables',edtech:'classroom',gaming:'videogame',telecom:'smartphone'};
const IMGKW={'Oversized Tee':'tshirt','Cargo Pants':'trousers','Knit Hoodie':'hoodie','Wireless Earbuds':'earbuds','Smart Watch':'smartwatch','Power Bank':'battery','Vitamin C Serum':'serum','Night Cream':'cosmetics','SPF 50':'sunscreen','Savings+ Account':'savings','Savings+':'savings','Gold Credit Card':'creditcard','Gold Card':'creditcard','Auto Loan':'car','Youth Account':'piggybank','Motor':'car','Health':'stethoscope','Travel':'suitcase','Pay bills':'invoice','Send money':'cash','Rewards':'gift','New Originals':'cinema','Blockbusters':'popcorn','Live Comedy':'microphone','Originals':'cinema','Business':'stockmarket','Technology':'laptop','Sport':'stadium','Miami':'miami','New York':'newyork','Chicago':'chicago','Palm Grand':'hotel','City Suites':'hotelroom','Beach Villa':'beach','Burger Yard':'burger','Sushi Bar':'sushi','Pizza Co':'pizza','Fresh Milk':'milk','Free-range Eggs':'eggs','Sourdough':'bread','Data Analytics':'dashboard','UX Design':'wireframe','Cloud 101':'server','Legendary Crate':'treasure','Season Pass':'videogame','Hero Bundle':'gamepad','Unlimited':'smartphone','Family Plan':'family','Data Add-on':'wifi','Live comedy':'microphone','Tech':'laptop','Item one':'product','Item two':'product','Product one':'product','Product two':'product'};
function kwFor(name){ return IMGKW[name] || (name||'product').split(' ')[0].toLowerCase(); }
function phGray(w,h){ w=w||600; h=h||340; const svg="<svg xmlns='http://www.w3.org/2000/svg' width='"+w+"' height='"+h+"'><rect width='100%' height='100%' fill='%23e7e9ee'/><g fill='none' stroke='%23aab0bd' stroke-width='2'><rect x='"+Math.round(w*0.32)+"' y='"+Math.round(h*0.3)+"' width='"+Math.round(w*0.36)+"' height='"+Math.round(h*0.4)+"' rx='6'/><circle cx='"+Math.round(w*0.42)+"' cy='"+Math.round(h*0.43)+"' r='"+Math.round(h*0.05)+"'/><path d='M"+Math.round(w*0.35)+" "+Math.round(h*0.66)+" L"+Math.round(w*0.46)+" "+Math.round(h*0.53)+" L"+Math.round(w*0.54)+" "+Math.round(h*0.6)+" L"+Math.round(w*0.6)+" "+Math.round(h*0.55)+" L"+Math.round(w*0.65)+" "+Math.round(h*0.66)+"'/></g></svg>"; return 'data:image/svg+xml,'+encodeURIComponent(svg); }
function ePhoto(kw,seed){ return photo(kw,600,360); }
