import { useStudio } from '@/store/useStudio'
import { useToast } from '@/store/useToast'
import { type Pack, packFor, cap } from '@/content/model'
import { heroPhoto } from '@/lib/photo'
import { oneLine } from '@/channels/notify/shared'

export interface InappBuild { type: string; image: string; headline: string; body: string; ctas: string; close: boolean; bannerPos?: string }
export interface InappTemplate {
  name: string
  kind: 'Promotional' | 'Transactional' | 'Flow'
  icon: string
  desc: string
  flow?: boolean
  build: (p: Pack) => InappBuild
}

const hero = (p: Pack, seed = '') => heroPhoto(p, seed, 600, 340)
const portrait = (p: Pack, seed = '') => heroPhoto(p, seed, 700, 900)

export const INAPP_TEMPLATES: InappTemplate[] = [
  {
    name: 'Welcome modal', kind: 'Promotional', icon: '👋', desc: 'Center modal + image',
    build: (p) => ({ type: 'modal', image: hero(p, '2'), headline: 'Welcome in 🎉', body: `${p.offer} is sitting in your account — think of it as our hello from ${p.brand}.`, ctas: 'Use my welcome gift | primary\nMaybe later | text', close: true }),
  },
  {
    name: 'Offer full-screen', kind: 'Promotional', icon: '🖼️', desc: 'Hero image takeover',
    build: (p) => ({ type: 'full', image: portrait(p, '3'), headline: p.offer, body: `${p.brand}, and only for a moment. Make it yours before it's gone.`, ctas: 'Shop the drop | primary\nNo thanks | text', close: true }),
  },
  {
    name: 'Rate us', kind: 'Flow', icon: '⭐', desc: 'Modal, no image', flow: true,
    build: (p) => ({ type: 'modal', image: '', headline: `Enjoying ${p.brand}?`, body: p.feedbackQ || 'Your feedback helps us make things better.', ctas: 'Rate us ★ | primary\nNot now | text', close: true }),
  },
  {
    name: 'Feature banner', kind: 'Transactional', icon: '📣', desc: 'Slim top banner',
    build: (p) => ({ type: 'banner', bannerPos: 'top', image: '', headline: cap(p.reminder), body: `Tap to open ${p.brand}.`, ctas: 'View | primary', close: true }),
  },
  {
    name: 'Cart bottom-sheet', kind: 'Flow', icon: '🛒', desc: 'Bottom sheet + image', flow: true,
    build: (p) => ({ type: 'sheet', image: hero(p, '7'), headline: 'You left something behind', body: oneLine(p.flow.intro), ctas: 'Checkout | primary\nKeep browsing | secondary', close: true }),
  },
  {
    name: 'Promo image-only', kind: 'Promotional', icon: '✨', desc: 'Full creative, tap to act',
    build: (p) => ({ type: 'image', image: portrait(p, '5'), headline: '', body: '', ctas: '', close: true }),
  },
]

export function applyInappTemplate(t: InappTemplate, announce = true) {
  const s = useStudio.getState()
  const p = packFor(s.ctxId())
  if (!p) return
  const f = t.build(p)
  s.setNotify({ appName: p.brand })
  s.setInapp({ type: f.type, image: f.image, headline: f.headline, body: f.body, ctas: f.ctas, close: f.close, ...(f.bannerPos ? { bannerPos: f.bannerPos } : {}) })
  if (announce) useToast.getState().show('Preset applied' + (t.flow ? ' · hit Simulate to tap CTAs' : ''))
}
