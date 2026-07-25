/* Shared content model (ported from content.js).
   Industries + per-vertical content packs + vertical-aware confirmations.
   Channel modules read from this; American names, dollar amounts. */

export interface Industry {
  id: string
  name: string
  biz: string
  status: string
  subs: [string, string][]
}

export interface Pack {
  brand: string
  emoji: string
  offer: string
  url: string
  orderId: string
  otpUse: string
  reminder: string
  feedbackQ: string
  carousel: [string, string][]
  flow: { intro: string; opts: [string, string][] }
}

export interface Confirm {
  noun: string
  head: string
  line: string
  cta: string
  ship: boolean
}

export const INDUSTRIES: Industry[] = [
  { id: 'ecom', name: 'E-commerce & Retail', biz: 'Nova', status: 'online', subs: [['fashion', 'Fashion'], ['marketplace', 'Marketplace'], ['d2c', 'D2C']] },
  { id: 'bfsi', name: 'Banking & Finance', biz: 'Meridian Bank', status: 'online', subs: [['banking', 'Retail Banking'], ['insurance', 'Insurance'], ['fintech', 'Fintech']] },
  { id: 'media', name: 'Media & Entertainment', biz: 'Streamly', status: 'online', subs: [['ott', 'OTT / Streaming'], ['news', 'News & Publishing']] },
  { id: 'travel', name: 'Travel & Hospitality', biz: 'SkyHigh', status: 'online', subs: [['airlines', 'Airlines'], ['hotels', 'Hotels & OTA']] },
  { id: 'food', name: 'Food & Delivery', biz: 'QuickBite', status: 'online', subs: [['delivery', 'Food Delivery'], ['grocery', 'Grocery']] },
  { id: 'edtech', name: 'EdTech', biz: 'LearnSphere', status: 'online', subs: [] },
  { id: 'gaming', name: 'Gaming', biz: 'PixelForge', status: 'online', subs: [] },
  { id: 'telecom', name: 'Telecom', biz: 'ConnectTel', status: 'online', subs: [] },
]

export const PACKS: Record<string, Pack> = {
  fashion: { brand: 'Nova', emoji: '🛍️', offer: '40% off new arrivals', url: 'nova.shop', orderId: '10482', otpUse: 'login', reminder: 'your wishlist item is back in stock', feedbackQ: 'How was your recent order?', carousel: [['Oversized Tee', '$89'], ['Cargo Pants', '$149'], ['Knit Hoodie', '$199']], flow: { intro: 'Hi Alex! You left *Nova Air Runner (US 9)* in your bag 👟\n\nStill want it? We saved your size.', opts: [['Complete purchase', "🎉 Here's *10% off*: NOVA10. Checkout: nova.shop/bag"], ['Remind me later', "No rush — we'll hold your size for 24h. ⏰"], ['Not interested', 'All good! Browse new arrivals at nova.shop/new']] } },
  marketplace: { brand: 'Nova Market', emoji: '🛒', offer: 'Deals up to 70% off', url: 'novamarket.com', orderId: '88231', otpUse: 'login', reminder: 'prices dropped on items in your cart', feedbackQ: 'How was your delivery?', carousel: [['Wireless Earbuds', '$129'], ['Smart Watch', '$299'], ['Power Bank', '$79']], flow: { intro: '🛒 Your cart is waiting — 3 items, and one just dropped in price!', opts: [['Checkout now', '🎉 Applied SAVE15 for you. Complete: novamarket.com/cart'], ['Save for later', "Saved! We'll alert you on further price drops. 🔔"], ['Remove items', 'Done — your cart is cleared.']] } },
  d2c: { brand: 'GlowLab', emoji: '✨', offer: 'Buy 1 Get 1 on bestsellers', url: 'glowlab.co', orderId: '4471', otpUse: 'login', reminder: 'time to restock your Vitamin C serum', feedbackQ: "How's your skin feeling?", carousel: [['Vit-C Serum', '$119'], ['Night Cream', '$149'], ['SPF 50', '$89']], flow: { intro: '✨ Running low, Alex? Your *Vitamin C Serum* usually lasts 30 days — time to restock.', opts: [['Reorder now', '🛒 Added to cart with 15% off (GLOW20). Checkout: glowlab.co/cart'], ['Try something new', 'Great! Here are 3 bestsellers loved by your skin type.'], ['Not yet', "No problem — we'll check in next week. 💛"]] } },
  banking: { brand: 'Meridian Bank', emoji: '🏦', offer: '0% EMI on your credit card', url: 'meridian.com', orderId: 'RQ-2093', otpUse: 'login', reminder: 'your monthly statement is ready', feedbackQ: 'How was your branch visit?', carousel: [['Savings+', '3.2% p.a.'], ['Youth Account', 'Zero fees'], ['Gold Card', 'Rewards']], flow: { intro: '👋 Welcome to *Meridian Bank*. How can we help today?', opts: [['Check balance', 'Your available balance is *$24,930.55*. Last txn: −$220 at Nova Retail.'], ['Block my card', 'Your card is temporarily frozen 🔒 A replacement is on its way (2–3 days).'], ['Talk to an agent', 'Connecting you to the next available agent… ⏳']] } },
  ott: { brand: 'Streamly', emoji: '🎬', offer: '50% off your next month', url: 'streamly.tv', orderId: 'SUB-771', otpUse: 'login', reminder: '3 new seasons landed in your watchlist', feedbackQ: 'Enjoying the new releases?', carousel: [['Originals', 'New'], ['Blockbusters', '4K'], ['Live comedy', 'Tonight']], flow: { intro: 'We miss you, Alex 🍿 *3 new seasons* just landed in your watchlist. Come back for *50% off*?', opts: [['Claim 50% off', '🎉 Done! Your next month is half price. Jump back in: streamly.tv/home'], ["What's new?", 'This week: 3 Originals, 2 blockbusters & a live comedy special 🎤'], ['Cancel updates', 'Got it — no more promos. Manage anytime in Settings.']] } },
  delivery: { brand: 'QuickBite', emoji: '🍔', offer: 'Free delivery all weekend', url: 'quickbite.app', orderId: '5521', otpUse: 'login', reminder: 'hungry? your favourites are one tap away', feedbackQ: 'How was your meal?', carousel: [['Burger Yard', '20% off'], ['Sushi Bar', 'Free miso'], ['Pizza Co', 'Buy 1 Get 1']], flow: { intro: 'Your order *#5521* from Burger Yard is being prepared 👨‍🍳 Need anything?', opts: [['Track rider', '🛵 Mike is 8 min away. Track live: quickbite.app/track/5521'], ['Add cutlery', 'Added! Your rider will bring cutlery. 🍴'], ['Report an issue', "Sorry about that! Reply with the item and we'll refund it."]] } },
  edtech: { brand: 'LearnSphere', emoji: '🎓', offer: 'Certificates 50% off', url: 'learnsphere.io', orderId: 'EN-9012', otpUse: 'login', reminder: "you're 68% through your course", feedbackQ: "How's the course going?", carousel: [['Data Analytics', '12 wks'], ['UX Design', '8 wks'], ['Cloud 101', '6 wks']], flow: { intro: "You're *68% through* Data Analytics Foundations 📈 Just 3 lessons to your certificate!", opts: [['Resume lesson', '🚀 Loading Lesson 9: Dashboards. Pick up here: learnsphere.io/resume'], ['Book a mentor', 'Free 15-min slots today: 4:00, 5:30, 7:00 PM. Reply with a time.'], ['Remind me tonight', "Done — we'll ping you at 8 PM. Keep the streak alive! 🔥"]] } },
  gaming: { brand: 'PixelForge', emoji: '🎮', offer: 'Double gems this weekend', url: 'pixelforge.gg', orderId: 'PX-4410', otpUse: 'login', reminder: 'your energy is full — time to play', feedbackQ: 'Enjoying the new season?', carousel: [['Legendary Crate', '500 gems'], ['Season Pass', '30 tiers'], ['Hero Bundle', '3 heroes']], flow: { intro: 'Your squad misses you, Commander ⚔️ Log in today for a *free Legendary crate* + 500 gems.', opts: [['Claim reward', '🎁 Claimed! Your crate + 500 gems are waiting in-game.'], ["What's new?", 'New season Ironfall is live: new map, 3 heroes & ranked rewards 🏆'], ['Turn off alerts', 'Done — no more nudges. Rewards saved for 7 days.']] } },
  telecom: { brand: 'ConnectTel', emoji: '📱', offer: 'Unlimited data — $149/mo', url: 'connecttel.com', orderId: 'CT-6621', otpUse: 'login', reminder: "you've used 90% of your data", feedbackQ: "How's your network experience?", carousel: [['Unlimited', '$149'], ['Family Plan', '4 SIMs'], ['Data Add-on', '10GB']], flow: { intro: "Heads up — you've used *90% of your data* 📶 3 days left in your cycle. Stay connected?", opts: [['Add 10GB · $30', '✅ 10GB added instantly! Valid till your cycle ends. Enjoy 🎉'], ['Upgrade plan', 'Our Unlimited plan is $149/mo. Reply YES to switch next cycle.'], ['No thanks', "No problem! We'll remind you if you run low again."]] } },
}

export const CONFIRM: Record<string, Confirm> = {
  fashion: { noun: 'order', head: 'Order confirmed', line: "We'll email your tracking link once it ships.", cta: 'Track order', ship: true },
  marketplace: { noun: 'order', head: 'Order confirmed', line: "We'll email tracking as soon as it ships.", cta: 'Track order', ship: true },
  d2c: { noun: 'order', head: 'Order confirmed', line: "We'll email tracking once it ships.", cta: 'Track order', ship: true },
  banking: { noun: 'request', head: 'Request received', line: "Your request is being processed — we'll update you shortly.", cta: 'View request', ship: false },
  ott: { noun: 'subscription', head: "You're all set", line: 'Your subscription is active — start watching now.', cta: 'Start watching', ship: false },
  delivery: { noun: 'order', head: 'Order confirmed', line: 'Your food is being prepared — track your rider live.', cta: 'Track order', ship: true },
  edtech: { noun: 'enrollment', head: "You're enrolled", line: 'Your seat is confirmed. Jump into your first lesson.', cta: 'Start learning', ship: false },
  gaming: { noun: 'purchase', head: 'Purchase complete', line: 'Your items have been added to your account.', cta: 'Open game', ship: false },
  telecom: { noun: 'plan', head: 'Plan activated', line: 'Your new plan is live. Enjoy!', cta: 'Manage plan', ship: false },
}

export function industryById(id: string) { return INDUSTRIES.find((i) => i.id === id) }
export function packFor(ctxId: string): Pack | undefined { return PACKS[ctxId] }
export function confirmFor(ctxId: string): Confirm { return CONFIRM[ctxId] || { noun: 'order', head: 'Order confirmed', line: '', cta: 'View details', ship: true } }
