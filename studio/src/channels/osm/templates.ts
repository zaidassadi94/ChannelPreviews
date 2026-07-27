import { useStudio } from '@/store/useStudio'
import { useToast } from '@/store/useToast'
import { type Pack, packFor, cap } from '@/content/model'
import { heroPhoto } from '@/lib/photo'
import { oneLine } from '@/channels/notify/shared'

export interface OsmBuild { site: string; url: string; format: string; headline: string; body: string; image: string; cta: string; cta2: string; code: string; input: boolean; countdown: string; scaleLo?: string; scaleHi?: string }
export interface OsmTemplate {
  name: string
  format: string
  kind: 'Promotional' | 'Transactional' | 'Flow'
  icon: string
  desc: string
  flow?: boolean
  build: (p: Pack) => OsmBuild
}

const img = (p: Pack, w: number, h: number, seed = '') => heroPhoto(p, seed, w, h)
const mk = (p: Pack, format: string, o: Partial<OsmBuild>): OsmBuild => ({ site: p.brand, url: p.url || '', format, headline: '', body: '', image: '', cta: '', cta2: '', code: '', input: false, countdown: '', ...o })

export const OSM_TEMPLATES: OsmTemplate[] = [
  { name: 'Welcome offer', format: 'popup', kind: 'Promotional', icon: '👋', desc: 'Popup + image', build: (p) => mk(p, 'popup', { headline: 'Welcome — here’s 10% off', body: `A little hello from ${p.brand}. Use it on your first order.`, image: img(p, 700, 460, '2'), cta: 'Claim my 10%', cta2: 'No thanks', code: p.code || 'WELCOME10' }) },
  { name: 'Email capture', format: 'popup', kind: 'Flow', icon: '✉️', desc: 'Newsletter signup', flow: true, build: (p) => mk(p, 'popup', { headline: 'Get first dibs', body: 'Join the list for early access to drops and members-only deals.', cta: 'Subscribe', cta2: 'Maybe later', input: true }) },
  { name: 'Exit-intent discount', format: 'popup', kind: 'Flow', icon: '🚪', desc: 'Wait, don’t leave', flow: true, build: (p) => mk(p, 'popup', { headline: 'Wait — don’t go!', body: `Here’s ${p.code ? `code ${p.code}` : '15% off'} to finish your order at ${p.brand}.`, image: img(p, 700, 460, '5'), cta: 'Apply & continue', cta2: 'No, I’ll pay full price', code: p.code || 'STAY15' }) },
  { name: 'Cart abandonment', format: 'nudge', kind: 'Flow', icon: '🛒', desc: 'Slide-in reminder', flow: true, build: (p) => mk(p, 'nudge', { headline: 'Left something behind?', body: oneLine(p.flow.intro) || 'Your cart is waiting — complete it before it sells out.', image: img(p, 200, 200, '7'), cta: 'Return to cart' }) },
  { name: 'Free shipping bar', format: 'bannerTop', kind: 'Promotional', icon: '🚚', desc: 'Sticky top banner', build: (p) => mk(p, 'bannerTop', { headline: '*Free shipping* on all orders over $50 — today only.', cta: 'Shop now' }) },
  { name: 'Flash sale countdown', format: 'bannerTop', kind: 'Promotional', icon: '⏳', desc: 'Banner + live timer', build: (p) => mk(p, 'bannerTop', { headline: `*${cap(p.offer) || 'Flash sale'}* ends in`, cta: 'Shop the sale', countdown: '05:59:59' }) },
  { name: 'Coupon reveal', format: 'popup', kind: 'Promotional', icon: '🎟️', desc: 'Reveal a code', build: (p) => mk(p, 'popup', { headline: 'Your reward is unlocked', body: `Copy your code and use it at checkout on ${p.brand}.`, cta: 'Copy code & shop', code: p.code || 'SAVE20' }) },
  { name: 'Back in stock', format: 'nudge', kind: 'Transactional', icon: '🔔', desc: 'Restock nudge', build: (p) => mk(p, 'nudge', { headline: 'It’s back in stock', body: `The ${p.carousel[0] ? p.carousel[0][0] : 'item'} you wanted just returned.`, image: img(p, 200, 200, '3'), cta: 'Shop it now' }) },
  { name: 'NPS / feedback', format: 'survey', kind: 'Flow', icon: '⭐', desc: 'Emoji rating survey', flow: true, build: (p) => mk(p, 'survey', { headline: `How likely are you to recommend ${p.brand}?`, body: p.feedbackQ || 'Your feedback helps us improve.', cta: 'Submit' }) },
  { name: 'New feature / product', format: 'nudge', kind: 'Promotional', icon: '✨', desc: 'Announcement nudge', build: (p) => mk(p, 'nudge', { headline: 'Just launched', body: cap(p.reminder) || `Something new landed at ${p.brand} — take a look.`, image: img(p, 200, 200, '4'), cta: 'See what’s new' }) },
  { name: 'Limited-stock urgency', format: 'full', kind: 'Promotional', icon: '🔥', desc: 'Full-screen takeover', build: (p) => mk(p, 'full', { headline: 'Almost gone', body: `${cap(p.offer) || 'Our bestsellers'} are selling fast. Don’t miss out.`, image: img(p, 1200, 900, '5'), cta: 'Shop before it’s gone', cta2: 'Keep browsing', countdown: '01:59:59' }) },
  { name: 'Cookie consent', format: 'bannerBottom', kind: 'Transactional', icon: '🍪', desc: 'Consent bar', build: (p) => mk(p, 'bannerBottom', { headline: 'We use cookies to improve your experience.', cta: 'Accept all', cta2: 'Reject' }) },
]

export function applyOsmTemplate(t: OsmTemplate, announce = true) {
  const s = useStudio.getState()
  const p = packFor(s.ctxId())
  if (!p) return
  const f = t.build(p)
  s.setOsm({ site: f.site, url: f.url, format: f.format, headline: f.headline, body: f.body, image: f.image, cta: f.cta, cta2: f.cta2, code: f.code, input: f.input, countdown: f.countdown, scaleLo: f.scaleLo || 'Not likely', scaleHi: f.scaleHi || 'Very likely' })
  if (announce) useToast.getState().show('Preset applied' + (t.flow ? ' · hit Simulate to try it' : ''))
}
