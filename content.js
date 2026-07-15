/* ==========================================================================
   Channel Studio — shared content model: INDUSTRIES, PACKS (per sub-industry
   content packs), CONFIRM (vertical-aware confirmations).
   One entry per ctx (sub-industry id, or industry id when it has no subs).
   Channel-variant copy lives INSIDE each entry:
     - base fields + flow{}  -> messaging (SMS/RCS/WhatsApp chat scripts)
     - push:{flow,...}       -> notify overrides (Push/In-App one-liners)
     - email:{...}           -> gmail overrides (from/accent/products/total etc.)
   Each tool merges its own view (see the small glue in each tool's script).
   To add an industry: add it to INDUSTRIES + one entry in PACKS and CONFIRM
   (+ KW/IMGKW keywords in image-system.js, + queries in setup.html/resolve-images.js).
   ========================================================================== */
const INDUSTRIES=[
  {id:'ecom', name:'E-commerce & Retail', biz:'Nova', status:'online', subs:[['fashion','Fashion'],['marketplace','Marketplace'],['d2c','D2C']]},
  {id:'bfsi', name:'Banking & Finance', biz:'Meridian Bank', status:'online', subs:[['banking','Retail Banking'],['insurance','Insurance'],['fintech','Fintech']]},
  {id:'media', name:'Media & Entertainment', biz:'Streamly', status:'online', subs:[['ott','OTT / Streaming'],['news','News & Publishing']]},
  {id:'travel', name:'Travel & Hospitality', biz:'SkyHigh', status:'online', subs:[['airlines','Airlines'],['hotels','Hotels & OTA']]},
  {id:'food', name:'Food & Delivery', biz:'QuickBite', status:'online', subs:[['delivery','Food Delivery'],['grocery','Grocery']]},
  {id:'edtech', name:'EdTech', biz:'LearnSphere', status:'online', subs:[]},
  {id:'gaming', name:'Gaming', biz:'PixelForge', status:'online', subs:[]},
  {id:'telecom', name:'Telecom', biz:'ConnectTel', status:'online', subs:[]},
];
const cap=x=>x?x.charAt(0).toUpperCase()+x.slice(1):x;
const PACKS={
  fashion:{brand:"Nova",emoji:"🛍️",offer:"40% off new arrivals",url:"nova.shop",hero:"fashion",orderNoun:"order",orderId:"10482",code:"NOVA10",otpUse:"login",reminder:"your wishlist item is back in stock",feedbackQ:"How was your recent order?",carousel:[["Oversized Tee","$89"],["Cargo Pants","$149"],["Knit Hoodie","$199"]],
    flow:{intro:"Hi Zaid! You left *Nova Air Runner (US 9)* in your bag 👟\n\nStill want it? We saved your size.",opts:[["Complete purchase","🎉 Here's *10% off*: NOVA10. Checkout: nova.shop/bag"],["Remind me later","No rush — we'll hold your size for 24h. ⏰"],["Not interested","All good! Browse new arrivals at nova.shop/new"]]},
    push:{flow:{intro:"You left Nova Air Runner (US 9) in your bag 👟 Still want it? We saved your size.",opts:[["Complete purchase"],["Remind me later"],["Not now"]]}},
    email:{from:"hello@nova.shop",accent:"#111111",products:[["Oversized Tee","$89"],["Cargo Pants","$149"],["Knit Hoodie","$199"]],total:"$437",otpUse:"sign-in"}},
  marketplace:{brand:"Nova Market",emoji:"🛒",offer:"Deals up to 70% off",url:"novamarket.com",hero:"market",orderNoun:"order",orderId:"88231",code:"SAVE15",otpUse:"login",reminder:"prices dropped on items in your cart",feedbackQ:"How was your delivery?",carousel:[["Wireless Earbuds","$129"],["Smart Watch","$299"],["Power Bank","$79"]],
    flow:{intro:"🛒 Your cart is waiting — 3 items, and one just dropped in price!",opts:[["Checkout now","🎉 Applied SAVE15 for you. Complete: novamarket.com/cart"],["Save for later","Saved! We'll alert you on further price drops. 🔔"],["Remove items","Done — your cart is cleared."]]},
    push:{flow:{intro:"Your cart is waiting — 3 items, and one just dropped in price!",opts:[["Checkout now"],["Save for later"],["Dismiss"]]}},
    email:{from:"orders@novamarket.com",accent:"#ff6d00",products:[["Wireless Earbuds","$129"],["Smart Watch","$299"],["Power Bank","$79"]],total:"$507",otpUse:"sign-in"}},
  d2c:{brand:"GlowLab",emoji:"✨",offer:"Buy 1 Get 1 on bestsellers",url:"glowlab.co",hero:"beauty",orderNoun:"order",orderId:"4471",code:"GLOW20",otpUse:"login",reminder:"time to restock your Vitamin C serum",feedbackQ:"How's your skin feeling?",carousel:[["Vit-C Serum","$119"],["Night Cream","$149"],["SPF 50","$89"]],
    flow:{intro:"✨ Running low, Zaid? Your *Vitamin C Serum* usually lasts 30 days — time to restock.",opts:[["Reorder now","🛒 Added to cart with 15% off (GLOW20). Checkout: glowlab.co/cart"],["Try something new","Great! Here are 3 bestsellers loved by your skin type."],["Not yet","No problem — we'll check in next week. 💛"]]},
    push:{flow:{intro:"Running low? Your Vitamin C Serum usually lasts 30 days — time to restock.",opts:[["Reorder now"],["See bestsellers"],["Not yet"]]}},
    email:{from:"care@glowlab.co",accent:"#e91e8c",products:[["Vitamin C Serum","$119"],["Night Cream","$149"],["SPF 50","$89"]],total:"$357",otpUse:"sign-in"}},
  banking:{brand:"Meridian Bank",emoji:"🏦",offer:"0% EMI on your credit card",url:"meridian.com",hero:"bank",orderNoun:"request",orderId:"RQ-2093",code:"",otpUse:"login",reminder:"your monthly statement is ready",feedbackQ:"How was your branch visit?",carousel:[["Savings+","3.2% p.a."],["Youth Account","Zero fees"],["Gold Card","Rewards"]],
    flow:{intro:"👋 Welcome to *Meridian Bank*. How can we help today?",opts:[["Check balance","Your available balance is *$24,930.55*. Last txn: −$220 at Nova Retail."],["Block my card","Your card is temporarily frozen 🔒 A replacement is on its way (2–3 days)."],["Talk to an agent","Connecting you to the next available agent… ⏳"]]},
    push:{flow:{intro:"A payment of $220.00 was made on your Gold Card at Nova Retail.",opts:[["View details"],["Not me"],["Dismiss"]]}},
    email:{from:"no-reply@meridian.com",accent:"#0b57d0",offer:"0% EMI on your card",products:[["Savings+ Account","3.2% p.a."],["Gold Credit Card","Rewards"],["Auto Loan","from 4.5%"]],total:"—",otpUse:"sign-in"}},
  insurance:{brand:"Meridian Assure",emoji:"🛡️",offer:"Renew early & save 15%",url:"meridian.com/renew",hero:"insure",orderNoun:"policy",orderId:"MA-88213",code:"",otpUse:"account",reminder:"your motor policy expires on 20 Jul",feedbackQ:"How was your claim experience?",carousel:[["Motor","from $900/yr"],["Health","Family cover"],["Travel","Single/annual"]],
    flow:{intro:"🛡️ Your *motor policy MA-88213* expires on *20 Jul*. Renew to stay covered.",opts:[["Renew now","✅ Renewed! No inspection needed. Policy doc: meridian.com/doc"],["File a claim","Sorry to hear that. Reply with your claim details and photos."],["Talk to advisor","Connecting you to an insurance advisor… ⏳"]]},
    push:{flow:{intro:"Your motor policy MA-88213 expires on 20 Jul. Renew now to stay covered.",opts:[["Renew now"],["Remind me"],["Dismiss"]]}},
    email:{from:"care@meridian.com",accent:"#0b8043",code:"RENEW15",url:"meridian.com",products:[["Motor","from $900/yr"],["Health","Family cover"],["Travel","Annual"]],total:"$1,150",otpUse:"account access"}},
  fintech:{brand:"Meridian Pay",emoji:"💳",offer:"Cashback week — 5% back",url:"meridianpay.com",hero:"pay",orderNoun:"payment",orderId:"PMT-5521",code:"CASH5",otpUse:"payment",reminder:"you have $40 in unused rewards",feedbackQ:"How was your last payment?",carousel:[["Pay bills","Instant"],["Send money","0% fee"],["Rewards","Redeem"]],
    flow:{intro:"📊 Your July spend is *$4,120* — 12% below last month. Nice work!",opts:[["Show savings tips","💡 Set a dining budget of $900 and enable round-ups to save ~$300/mo."],["Set a budget","Sure — reply with a monthly limit and we'll track it for you."],["Redeem rewards","You have $40 in rewards. Redeem: meridianpay.com/rewards"]]},
    push:{flow:{intro:"You received $150.00 from Alex Carter. Tap to view your balance.",opts:[["View balance"],["Send back"],["Dismiss"]]}},
    email:{from:"hello@meridianpay.com",accent:"#6d28d9",products:[["Pay bills","Instant"],["Send money","0% fee"],["Rewards","Redeem"]],total:"$320"}},
  ott:{brand:"Streamly",emoji:"🎬",offer:"50% off your next month",url:"streamly.tv",hero:"ott",orderNoun:"subscription",orderId:"SUB-771",code:"COMEBACK50",otpUse:"login",reminder:"3 new seasons landed in your watchlist",feedbackQ:"Enjoying the new releases?",carousel:[["Originals","New"],["Blockbusters","4K"],["Live comedy","Tonight"]],
    flow:{intro:"We miss you, Zaid 🍿 *3 new seasons* just landed in your watchlist. Come back for *50% off*?",opts:[["Claim 50% off","🎉 Done! Your next month is half price. Jump back in: streamly.tv/home"],["What's new?","This week: 3 Originals, 2 blockbusters & a live comedy special 🎤"],["Cancel updates","Got it — no more promos. Manage anytime in Settings."]]},
    push:{flow:{intro:"3 new seasons just landed in your watchlist 🍿 Come back for 50% off?",opts:[["Claim 50% off"],["See what's new"],["Not now"]]}},
    email:{from:"hello@streamly.tv",accent:"#e50914",products:[["New Originals","Watch"],["Blockbusters","4K"],["Live Comedy","Tonight"]],total:"$29",otpUse:"sign-in"}},
  news:{brand:"Streamly News",emoji:"📰",offer:"Go Premium — ad-free",url:"news.streamly.tv",hero:"news",orderNoun:"subscription",orderId:"NS-330",code:"READ30",otpUse:"login",reminder:"your morning briefing is ready",feedbackQ:"How do you like your briefing?",carousel:[["Business","Live"],["Tech","Daily"],["Sport","Scores"]],
    flow:{intro:"📰 Good morning! Your personalised briefing is ready. What matters most to you?",opts:[["Business","📈 Top story: Markets rally to record high. Read: news.streamly.tv/biz"],["Tech","🤖 Top story: New AI chips unveiled. Read: news.streamly.tv/tech"],["Sport","⚽ Last night: 3 results & today's fixtures. Read: news.streamly.tv/sport"]]},
    push:{flow:{intro:"Breaking: Markets rally to a record high. Tap to read the full story.",opts:[["Read now"],["Save"],["Dismiss"]]}},
    email:{from:"daily@news.streamly.tv",accent:"#b91c1c",products:[["Business","Live"],["Technology","Daily"],["Sport","Scores"]],total:"$19",otpUse:"sign-in"}},
  airlines:{brand:"SkyHigh",emoji:"✈️",offer:"Fares from $199",url:"skyhigh.com",hero:"air",orderNoun:"booking",orderId:"SH-233",code:"FLY15",otpUse:"booking",reminder:"online check-in is open for SH-233",feedbackQ:"How was your flight?",carousel:[["Miami","from $199"],["New York","from $320"],["Chicago","from $280"]],
    flow:{intro:"✈️ *SkyHigh SH-233* New York → Miami\nDeparts *Fri 18 Jul, 14:20* · Gate B12\n\nCheck-in is now open. Ready to fly?",opts:[["Check in now","✅ Checked in! Seat 14A. Boarding pass: skyhigh.com/bp/SH233"],["Add baggage","Add 23kg for $120? Reply YES to confirm."],["Change seat","Window seats free: 9A, 22F. Reply with your pick."]]},
    push:{flow:{intro:"Check-in is open for SH-233 (New York → Miami), departs Fri 14:20.",opts:[["Check in now"],["Add baggage"],["Later"]]}},
    email:{from:"noreply@skyhigh.com",accent:"#0077c8",products:[["Miami","from $199"],["New York","from $320"],["Chicago","from $280"]],total:"$640"}},
  hotels:{brand:"SkyHigh Stays",emoji:"🏨",offer:"Weekend stays 30% off",url:"skyhigh.com/stays",hero:"hotel",orderNoun:"booking",orderId:"SG-77120",code:"STAY30",otpUse:"booking",reminder:"your stay at Palm Grand is in 2 days",feedbackQ:"How was your stay?",carousel:[["Palm Grand","$640/nt"],["City Suites","$420/nt"],["Beach Villa","$980/nt"]],
    flow:{intro:"🏨 Your stay at *Palm Grand, Miami* is in 2 days. Anything we can arrange?",opts:[["Early check-in","✅ Requested! We'll try for 11 AM and confirm at the desk."],["Airport pickup","Add a pickup for $90? Reply YES and share your flight no."],["View booking","Here are your details: skyhigh.com/stay/SG-77120"]]},
    push:{flow:{intro:"Your stay at Palm Grand, Miami is in 2 days. Anything we can arrange?",opts:[["Early check-in"],["Airport pickup"],["View booking"]]}},
    email:{from:"stays@skyhigh.com",accent:"#0f766e",products:[["Palm Grand","$640/nt"],["City Suites","$420/nt"],["Beach Villa","$980/nt"]],total:"$1,280"}},
  delivery:{brand:"QuickBite",emoji:"🍔",offer:"Free delivery all weekend",url:"quickbite.app",hero:"food",orderNoun:"order",orderId:"5521",code:"FREEDEL",otpUse:"login",reminder:"hungry? your favourites are one tap away",feedbackQ:"How was your meal?",carousel:[["Burger Yard","20% off"],["Sushi Bar","Free miso"],["Pizza Co","Buy 1 Get 1"]],
    flow:{intro:"Your order *#5521* from Burger Yard is being prepared 👨‍🍳 Need anything?",opts:[["Track rider","🛵 Ahmed is 8 min away. Track live: quickbite.app/track/5521"],["Add cutlery","Added! Your rider will bring cutlery. 🍴"],["Report an issue","Sorry about that! Reply with the item and we'll refund it."]]},
    push:{flow:{intro:"Your order #5521 from Burger Yard is on the way 🛵 Ahmed is 8 min away.",opts:[["Track rider"],["Call rider"],["Dismiss"]]}},
    email:{from:"orders@quickbite.app",accent:"#f4511e",products:[["Burger Yard","20% off"],["Sushi Bar","Free miso"],["Pizza Co","B1G1"]],total:"$74",otpUse:"sign-in"}},
  grocery:{brand:"QuickBite Fresh",emoji:"🛒",offer:"$20 off your groceries",url:"quickbite.app/fresh",hero:"grocery",orderNoun:"order",orderId:"7830",code:"FRESH20",otpUse:"login",reminder:"running low? reorder your weekly essentials",feedbackQ:"How was your delivery?",carousel:[["Fresh Milk","$8"],["Free-range Eggs","$18"],["Sourdough","$12"]],
    flow:{intro:"🥛 Running low? Reorder your *weekly essentials* (milk, eggs, bread +4) in one tap.",opts:[["Reorder now","🛒 Added 7 items — $84. Checkout: quickbite.app/cart"],["Edit list","Sure! What would you like to add or remove?"],["Skip this week","No problem — we'll check in next week. 👋"]]},
    push:{flow:{intro:"Running low? Reorder your weekly essentials (milk, eggs, bread +4) in one tap.",opts:[["Reorder now"],["Edit list"],["Skip week"]]}},
    email:{from:"fresh@quickbite.app",accent:"#2e7d32",offer:"$20 off groceries",products:[["Fresh Milk","$8"],["Free-range Eggs","$18"],["Sourdough","$12"]],total:"$84",otpUse:"sign-in"}},
  edtech:{brand:"LearnSphere",emoji:"🎓",offer:"Certificates 50% off",url:"learnsphere.io",hero:"edu",orderNoun:"enrolment",orderId:"EN-9012",code:"LEARN50",otpUse:"login",reminder:"you're 68% through your course",feedbackQ:"How's the course going?",carousel:[["Data Analytics","12 wks"],["UX Design","8 wks"],["Cloud 101","6 wks"]],
    flow:{intro:"You're *68% through* “Data Analytics Foundations” 📈 Just 3 lessons to your certificate!",opts:[["Resume lesson","🚀 Loading Lesson 9: Dashboards. Pick up here: learnsphere.io/resume"],["Book a mentor","Free 15-min slots today: 4:00, 5:30, 7:00 PM. Reply with a time."],["Remind me tonight","Done — we'll ping you at 8 PM. Keep the streak alive! 🔥"]]},
    push:{flow:{intro:"You're 68% through Data Analytics Foundations 📈 Just 3 lessons to your certificate!",opts:[["Resume lesson"],["Book a mentor"],["Later"]]}},
    email:{from:"hello@learnsphere.io",accent:"#5b3df5",products:[["Data Analytics","12 wks"],["UX Design","8 wks"],["Cloud 101","6 wks"]],total:"$299",otpUse:"sign-in"}},
  gaming:{brand:"PixelForge",emoji:"🎮",offer:"Double gems this weekend",url:"pixelforge.gg",hero:"game",orderNoun:"purchase",orderId:"PX-4410",code:"GEMS2X",otpUse:"login",reminder:"your energy is full — time to play",feedbackQ:"Enjoying the new season?",carousel:[["Legendary Crate","500 gems"],["Season Pass","30 tiers"],["Hero Bundle","3 heroes"]],
    flow:{intro:"Your squad misses you, Commander ⚔️ Log in today for a *free Legendary crate* + 500 gems.",opts:[["Claim reward","🎁 Claimed! Your crate + 500 gems are waiting in-game."],["What's new?","New season “Ironfall” is live: new map, 3 heroes & ranked rewards 🏆"],["Turn off alerts","Done — no more nudges. Rewards saved for 7 days."]]},
    push:{flow:{intro:"Your squad misses you, Commander ⚔️ Log in for a free Legendary crate + 500 gems.",opts:[["Claim reward"],["See what's new"],["Dismiss"]]}},
    email:{from:"noreply@pixelforge.gg",accent:"#7c3aed",products:[["Legendary Crate","500 gems"],["Season Pass","30 tiers"],["Hero Bundle","3 heroes"]],total:"$120",otpUse:"sign-in"}},
  telecom:{brand:"ConnectTel",emoji:"📱",offer:"Unlimited data — $149/mo",url:"connecttel.com",hero:"telco",orderNoun:"plan",orderId:"CT-6621",code:"UNLTD",otpUse:"login",reminder:"you've used 90% of your data",feedbackQ:"How's your network experience?",carousel:[["Unlimited","$149"],["Family Plan","4 SIMs"],["Data Add-on","10GB"]],
    flow:{intro:"Heads up — you've used *90% of your data* 📶 3 days left in your cycle. Stay connected?",opts:[["Add 10GB · $30","✅ 10GB added instantly! Valid till your cycle ends. Enjoy 🎉"],["Upgrade plan","Our Unlimited plan is $149/mo. Reply YES to switch next cycle."],["No thanks","No problem! We'll remind you if you run low again."]]},
    push:{flow:{intro:"Heads up — you've used 90% of your data 📶 3 days left in your cycle.",opts:[["Add 10GB · $30"],["Upgrade plan"],["No thanks"]]}},
    email:{from:"care@connecttel.com",accent:"#d81b60",products:[["Unlimited","$149"],["Family Plan","4 SIMs"],["Data Add-on","10GB"]],total:"$149",otpUse:"sign-in"}},
};
const CONFIRM={
  fashion:{noun:'order',head:'Order confirmed',line:"We'll email your tracking link once it ships.",cta:'Track order',ship:true,push:{line:"We'll let you know when it ships."},email:{cta:"Track your order"}},
  marketplace:{noun:'order',head:'Order confirmed',line:"We'll email tracking as soon as it ships.",cta:'Track order',ship:true,push:{line:"We'll notify you when it ships."},email:{cta:"Track your order"}},
  d2c:{noun:'order',head:'Order confirmed',line:"We'll email tracking once it ships.",cta:'Track order',ship:true,email:{cta:"Track your order"}},
  banking:{noun:'request',head:'Request received',line:"Your request is being processed — we'll update you shortly.",cta:'View request',ship:false,push:{line:"Your request is being processed."}},
  insurance:{noun:'policy',head:'Policy active',line:'Your policy is now active. Documents are attached.',cta:'View policy',ship:false,push:{line:"Your policy is now active. Documents are ready."}},
  fintech:{noun:'payment',head:'Payment successful',line:'Your payment went through. A receipt is below.',cta:'View receipt',ship:false,push:{line:"Your payment went through. Tap for the receipt."}},
  ott:{noun:'subscription',head:"You're all set",line:'Your subscription is active — start watching now.',cta:'Start watching',ship:false},
  news:{noun:'subscription',head:'Welcome to Premium',line:'Ad-free reading is unlocked on all your devices.',cta:'Start reading',ship:false},
  airlines:{noun:'booking',head:'Booking confirmed',line:'Your seats are reserved. Check-in opens 48h before departure.',cta:'View booking',ship:false},
  hotels:{noun:'reservation',head:'Reservation confirmed',line:"Your stay is booked — we can't wait to host you.",cta:'View reservation',ship:false},
  delivery:{noun:'order',head:'Order confirmed',line:'Your food is being prepared — track your rider live.',cta:'Track order',ship:true},
  grocery:{noun:'order',head:'Order confirmed',line:"We'll notify you when your delivery is on the way.",cta:'Track order',ship:true},
  edtech:{noun:'enrollment',head:"You're enrolled",line:'Your seat is confirmed. Jump into your first lesson.',cta:'Start learning',ship:false},
  gaming:{noun:'purchase',head:'Purchase complete',line:'Your items have been added to your account.',cta:'Open game',ship:false},
  telecom:{noun:'plan',head:'Plan activated',line:'Your new plan is live. Enjoy!',cta:'Manage plan',ship:false},
};
// Map a free-text industry label (from the AI, or a brief) onto a known vertical
// so the sidebar can switch to it. Returns {industryId, subId} or null if unknown.
function resolveIndustry(label){
  if(!label) return null;
  const t=String(label).toLowerCase();
  const SYN={
    retail:'fashion',ecommerce:'fashion',ecom:'fashion',shopping:'fashion',store:'fashion',apparel:'fashion',clothing:'fashion',fashion:'fashion',outfit:'fashion',
    marketplace:'marketplace',
    beauty:'d2c',cosmetics:'d2c',skincare:'d2c',d2c:'d2c',dtc:'d2c',cpg:'d2c',
    bank:'banking',banking:'banking',retailbanking:'banking',finance:'banking',bfsi:'banking',financial:'banking',
    insurance:'insurance',insurer:'insurance',
    fintech:'fintech',payments:'fintech',payment:'fintech',wallet:'fintech',neobank:'fintech',
    ott:'ott',streaming:'ott',stream:'ott',video:'ott',entertainment:'ott',
    news:'news',publishing:'news',publisher:'news',media:'ott',
    travel:'airlines',airline:'airlines',airlines:'airlines',flight:'airlines',flights:'airlines',aviation:'airlines',
    hotel:'hotels',hotels:'hotels',hospitality:'hotels',ota:'hotels',resort:'hotels',accommodation:'hotels',
    food:'delivery',restaurant:'delivery',delivery:'delivery',fooddelivery:'delivery',takeout:'delivery',dining:'delivery',
    grocery:'grocery',groceries:'grocery',supermarket:'grocery',
    edtech:'edtech',education:'edtech',learning:'edtech',elearning:'edtech',course:'edtech',school:'edtech',university:'edtech',
    gaming:'gaming',game:'gaming',games:'gaming',gamer:'gaming',esports:'gaming',
    telecom:'telecom',telco:'telecom',mobile:'telecom',carrier:'telecom',network:'telecom',wireless:'telecom',broadband:'telecom',
  };
  const cands=[t.replace(/[^a-z0-9]+/g,'')].concat(t.split(/[^a-z0-9]+/).filter(Boolean));
  let key=null;
  for(const c of cands){ if(SYN[c]){ key=SYN[c]; break; } }
  if(!key){ for(const ind of INDUSTRIES){ if(cands.includes(ind.id)){ key=ind.id; break; } for(const s of (ind.subs||[])) if(cands.includes(s[0])){ key=s[0]; break; } if(key) break; } }
  if(!key) return null;
  for(const ind of INDUSTRIES){
    if(ind.id===key) return { industryId:ind.id, subId:(ind.subs&&ind.subs.length)?ind.subs[0][0]:null };
    for(const s of (ind.subs||[])) if(s[0]===key) return { industryId:ind.id, subId:s[0] };
  }
  return null;
}
