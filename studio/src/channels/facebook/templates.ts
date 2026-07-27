import { useStudio } from '@/store/useStudio'
import { useToast } from '@/store/useToast'
import { type Pack, packFor, cap } from '@/content/model'
import { heroPhoto } from '@/lib/photo'
import { oneLine } from '@/channels/notify/shared'

export interface FbBuild { page: string; verified: boolean; url: string; time: string; price: string; primary: string; headline: string; desc: string; cta: string; media: string; reactions: string; comments: string; shares: string }
export interface FbTemplate {
  name: string
  kind: 'Promotional' | 'Transactional' | 'Flow'
  icon: string
  desc: string
  flow?: boolean
  build: (p: Pack) => FbBuild
}

const media = (p: Pack, seed: string) => heroPhoto(p, seed, 800, 1000)
const base = (p: Pack, o: Partial<FbBuild>): FbBuild => ({ page: p.brand, verified: true, url: p.url || '', time: '2h', price: p.carousel[0] ? p.carousel[0][1] : '$49', primary: '', headline: '', desc: '', cta: 'Shop Now', media: '', reactions: '', comments: '', shares: '', ...o })

export const FB_TEMPLATES: FbTemplate[] = [
  { name: 'Product launch', kind: 'Promotional', icon: '🆕', desc: 'Hero product + Shop Now', build: (p) => base(p, { primary: `New in: ${p.carousel[0] ? p.carousel[0][0] : 'the drop'} just landed. ${oneLine(p.offer)} — tap to make it yours. ✨`, headline: cap(p.offer) || 'New arrivals are here', desc: `Shop the latest from ${p.brand}.`, cta: 'Shop Now', media: media(p, '2'), reactions: '2,104', comments: '128', shares: '44' }) },
  { name: 'Flash sale', kind: 'Promotional', icon: '⚡', desc: 'Urgency + offer', build: (p) => base(p, { primary: `${p.emoji || '🔥'} ${p.offer}. Today only.${p.code ? ` Use ${p.code} at checkout.` : ''}`, headline: cap(p.offer) || 'Limited-time offer', desc: p.code ? `Use code ${p.code}.` : 'Ends tonight.', cta: 'Get Offer', media: media(p, '5'), reactions: '1,276', comments: '64', shares: '88' }) },
  { name: 'App install', kind: 'Transactional', icon: '📲', desc: 'Drive installs', build: (p) => base(p, { primary: `Everything ${p.brand} in one app. Join the thousands already tapping in. 👇`, headline: `Get the ${p.brand} app`, desc: 'Free on iOS & Android.', cta: 'Install Now', media: media(p, '3'), reactions: '3,510', comments: '212', shares: '120' }) },
  { name: 'Lead / sign-up', kind: 'Flow', icon: '✍️', desc: 'Lead-gen CTA', flow: true, build: (p) => base(p, { primary: `Be first to know. Sign up for early access${p.code ? ` and grab ${p.code}` : ''} — new drops before anyone else.`, headline: 'Join the list', desc: 'Takes 30 seconds.', cta: 'Sign Up', media: media(p, '7'), reactions: '932', comments: '41', shares: '17' }) },
  { name: 'Social proof', kind: 'Promotional', icon: '⭐', desc: 'Testimonial style', build: (p) => base(p, { primary: `“Honestly obsessed.” See why ${p.brand} is everyone's new favourite. ⭐️⭐️⭐️⭐️⭐️`, headline: `Why everyone loves ${p.brand}`, desc: 'Rated 4.9/5 by customers.', cta: 'Learn More', media: media(p, '4'), reactions: '5,701', comments: '340', shares: '210' }) },
  { name: 'Retargeting', kind: 'Flow', icon: '🛒', desc: 'Cart / win-back', flow: true, build: (p) => base(p, { primary: oneLine(p.flow.intro) || `Still thinking it over? Your pick at ${p.brand} is waiting — and it's going fast.`, headline: 'Your pick is waiting', desc: 'Complete your order today.', cta: 'Shop Now', media: media(p, '6'), reactions: '688', comments: '23', shares: '9' }) },
]

export function applyFbTemplate(t: FbTemplate, announce = true) {
  const s = useStudio.getState()
  const p = packFor(s.ctxId())
  if (!p) return
  const f = t.build(p)
  s.setFb({ page: f.page, verified: f.verified, media: f.media, primary: f.primary, headline: f.headline, desc: f.desc, url: f.url, price: f.price, cta: f.cta, reactions: f.reactions, comments: f.comments, shares: f.shares, time: f.time })
  if (announce) useToast.getState().show('Preset applied' + (t.flow ? ' · hit Simulate to tap the CTA' : ''))
}
