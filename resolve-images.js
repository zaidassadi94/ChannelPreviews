#!/usr/bin/env node
/*
 * Channel Studio — one-time product-image resolver (Pexels)
 * -----------------------------------------------------------
 * Looks up ONE good photo per product keyword and writes images.js
 * (window.__PXIMG = { keyword: cdnUrl, ... }).
 *
 * Run once:   PEXELS_KEY=your_key_here node resolve-images.js
 * Then commit the generated images.js. The live tool loads it and just
 * displays the CDN images — that is NOT an API call, so it never counts
 * against your rate limit no matter how many people open the tool.
 *
 * Get a free key: https://www.pexels.com/api/  (free tier: 200/hr, 20k/mo)
 *
 * Queries are product/object-focused on purpose (a folded tee, a car, a
 * burger) so results are clean product shots and avoid people/demographics.
 * Edit any query below and re-run to swap a specific image.
 */
const https = require('https');
const fs = require('fs');

const KEY = process.env.PEXELS_KEY;
if (!KEY) { console.error('❌ Set PEXELS_KEY.  e.g.  PEXELS_KEY=abc123 node resolve-images.js'); process.exit(1); }

// keyword -> Pexels search query  (edit freely, then re-run)
const QUERIES = {
  // apparel
  tshirt:'plain white t-shirt product', trousers:'folded chino pants', hoodie:'grey hoodie sweatshirt product', clothing:'folded clothes on shelf',
  // electronics
  earbuds:'wireless earbuds', smartwatch:'smartwatch on white', battery:'power bank charger', electronics:'tech gadgets flatlay',
  smartphone:'smartphone on white', laptop:'laptop computer desk', server:'server data center', wireframe:'ux design wireframe screen',
  dashboard:'analytics dashboard screen', wifi:'wifi router',
  // beauty
  serum:'skincare serum bottle', cosmetics:'cosmetics products flatlay', sunscreen:'sunscreen bottle',
  // finance
  savings:'coins in glass jar', creditcard:'credit card on table', car:'car exterior street', piggybank:'piggy bank',
  invoice:'invoice paperwork desk', cash:'us dollar bills', money:'money finance desk', stethoscope:'stethoscope medical',
  umbrella:'open umbrella',
  // media
  cinema:'movie theater seats', popcorn:'popcorn bucket', microphone:'stage microphone', newspaper:'newspaper on table', film:'film reel',
  // travel
  suitcase:'travel suitcase', airplane:'airplane in sky', miami:'miami beach skyline', newyork:'new york city skyline',
  chicago:'chicago city skyline', hotel:'luxury hotel exterior', hotelroom:'hotel room interior', beach:'tropical beach resort',
  // food
  burger:'gourmet burger', sushi:'sushi platter', pizza:'pizza', food:'gourmet meal plate', vegetables:'fresh vegetables',
  milk:'milk bottle', eggs:'eggs in carton', bread:'artisan bread loaf', basket:'grocery basket',
  // edu / gaming / misc
  classroom:'online learning laptop', videogame:'game controller', gamepad:'game controller', treasure:'treasure chest gold',
  gift:'wrapped gift box', stadium:'sports stadium', family:'american family with phone', building:'modern city building',
};

function search(q){
  return new Promise(res=>{
    const req = https.get({hostname:'api.pexels.com', path:'/v1/search?per_page=1&orientation=landscape&query='+encodeURIComponent(q), headers:{Authorization:KEY}}, r=>{
      let d=''; r.on('data',c=>d+=c); r.on('end',()=>{ try{ const j=JSON.parse(d); const ph=j.photos&&j.photos[0]; res(ph?ph.src.large:null); }catch(e){ res(null); } });
    });
    req.on('error',()=>res(null)); req.setTimeout(15000,()=>{ req.destroy(); res(null); });
  });
}

(async ()=>{
  const out={}; const keys=Object.keys(QUERIES);
  console.log('Resolving '+keys.length+' product images from Pexels…\n');
  for(const k of keys){
    const u=await search(QUERIES[k]);
    if(u){ out[k]=u; console.log('  ✓ '+k); } else { console.log('  · skipped '+k+' (no result / rate limit)'); }
    await new Promise(r=>setTimeout(r,250));
  }
  fs.writeFileSync('images.js','window.__PXIMG='+JSON.stringify(out)+';\n');
  console.log('\n✅ Wrote images.js with '+Object.keys(out).length+' images. Commit it and redeploy.');
})();
