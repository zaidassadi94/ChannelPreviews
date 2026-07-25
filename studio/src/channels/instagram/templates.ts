import { useStudio } from '@/store/useStudio'
import { useToast } from '@/store/useToast'
import { type Pack, packFor } from '@/content/model'
import { phImg, hueOf } from '@/lib/util'
import { oneLine } from '@/channels/notify/shared'

export const handleFromBrand = (b: string) => (b || 'brand').toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '').slice(0, 24) || 'brand'

export interface IgBuild { brand: string; handle: string; verified: boolean; time: string; caption: string; cta: string; media: string; likes: string; comments: string }
export interface IgTemplate {
  name: string
  kind: 'Promotional' | 'Transactional' | 'Flow'
  icon: string
  desc: string
  flow?: boolean
  build: (p: Pack) => IgBuild
}

const media = (p: Pack, seed: string) => phImg(p.brand, p.offer, hueOf(p.brand + seed), 800, 1000)
const base = (p: Pack, o: Partial<IgBuild>): IgBuild => ({ brand: p.brand, handle: handleFromBrand(p.brand), verified: true, time: '2 hours ago', caption: '', cta: 'Shop Now', media: '', likes: '', comments: '', ...o })

export const IG_TEMPLATES: IgTemplate[] = [
  { name: 'Product launch', kind: 'Promotional', icon: '🆕', desc: 'Hero product + Shop Now', build: (p) => base(p, { caption: `New in: ${p.carousel[0] ? p.carousel[0][0] : 'the drop'} just landed. ${oneLine(p.offer)} — tap to make it yours. ✨`, cta: 'Shop Now', media: media(p, '2'), likes: '3,204', comments: '128' }) },
  { name: 'Flash sale', kind: 'Promotional', icon: '⚡', desc: 'Urgency + offer', build: (p) => base(p, { caption: `${p.emoji || '🔥'} ${p.offer}. Today only.${p.code ? ` Use ${p.code} at checkout.` : ''}`, cta: 'Get Offer', media: media(p, '5'), likes: '1,876', comments: '64' }) },
  { name: 'App install', kind: 'Transactional', icon: '📲', desc: 'Drive installs', build: (p) => base(p, { caption: `Everything ${p.brand} in one app. Join the thousands already tapping in. 👇`, cta: 'Install Now', media: media(p, '3'), likes: '4,510', comments: '212' }) },
  { name: 'Sign-up / lead', kind: 'Flow', icon: '✍️', desc: 'Lead-gen CTA', flow: true, build: (p) => base(p, { caption: `Be first to know. Sign up for early access${p.code ? ` and grab ${p.code}` : ''} — new drops before anyone else.`, cta: 'Sign Up', media: media(p, '7'), likes: '932', comments: '41' }) },
  { name: 'Social proof', kind: 'Promotional', icon: '⭐', desc: 'Testimonial style', build: (p) => base(p, { caption: `“Honestly obsessed.” See why ${p.brand} is everyone's new favourite. ⭐️⭐️⭐️⭐️⭐️`, cta: 'Learn More', media: media(p, '4'), likes: '5,701', comments: '340' }) },
  { name: 'Retargeting', kind: 'Flow', icon: '🛒', desc: 'Cart / win-back', flow: true, build: (p) => base(p, { caption: oneLine(p.flow.intro) || `Still thinking it over? Your pick at ${p.brand} is waiting — and it's going fast.`, cta: 'Shop Now', media: media(p, '6'), likes: '688', comments: '23' }) },
]

export function applyIgTemplate(t: IgTemplate, announce = true) {
  const s = useStudio.getState()
  const p = packFor(s.ctxId())
  if (!p) return
  const f = t.build(p)
  s.setIg({ brand: f.brand, handle: f.handle, verified: f.verified, media: f.media, caption: f.caption, cta: f.cta, likes: f.likes, comments: f.comments, time: f.time })
  if (announce) useToast.getState().show('Template applied' + (t.flow ? ' · hit Simulate to tap the CTA' : ''))
}
