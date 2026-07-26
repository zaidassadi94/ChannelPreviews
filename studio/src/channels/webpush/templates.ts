import { useStudio } from '@/store/useStudio'
import { useToast } from '@/store/useToast'
import { type Pack, packFor, cap } from '@/content/model'
import { heroPhoto } from '@/lib/photo'
import { oneLine } from '@/channels/notify/shared'

export interface WebpushBuild { site: string; url: string; title: string; body: string; image: string; actions: string }
export interface WebpushOptin { style: string; title: string; body: string; allow: string; deny: string }
export interface WebpushTemplate {
  name: string
  kind: 'Promotional' | 'Transactional' | 'Flow'
  icon: string
  desc: string
  flow?: boolean
  build?: (p: Pack, ctxId: string) => WebpushBuild
  optin?: (p: Pack, ctxId: string) => WebpushOptin
}

const hero = (p: Pack, seed = '') => heroPhoto(p, seed, 600, 340)

export const WEBPUSH_TEMPLATES: WebpushTemplate[] = [
  {
    name: 'Promotional offer', kind: 'Promotional', icon: '🏷️', desc: 'Image + CTA',
    build: (p) => ({ site: p.brand, url: p.url, title: `${p.emoji} ${p.offer}`, body: `${p.brand} just dropped something good — take a look before it's gone.`, image: hero(p, '3'), actions: 'Shop now\nDismiss' }),
  },
  {
    name: 'Cart abandonment', kind: 'Flow', icon: '🛒', desc: 'Left something behind', flow: true,
    build: (p) => ({ site: p.brand, url: p.url, title: 'Still thinking it over?', body: oneLine(p.flow.intro) || 'Your cart is waiting — finish up before it sells out.', image: hero(p, '7'), actions: 'Return to cart\nNot now' }),
  },
  {
    name: 'Price drop', kind: 'Promotional', icon: '📉', desc: 'Wishlist alert',
    build: (p) => ({ site: p.brand, url: p.url, title: 'Good news — a price just dropped', body: `Something on your wishlist at ${p.brand} is now cheaper. Grab it while it lasts.`, image: hero(p, '5'), actions: 'See the deal' }),
  },
  {
    name: 'Back in stock', kind: 'Transactional', icon: '🔔', desc: 'Restock nudge',
    build: (p) => ({ site: p.brand, url: p.url, title: "It's back in stock", body: cap(p.reminder), image: hero(p, '9'), actions: 'Shop it now\nRemind me' }),
  },
  {
    name: 'Flash sale', kind: 'Promotional', icon: '⚡', desc: 'Countdown urgency',
    build: (p) => ({ site: p.brand, url: p.url, title: `⏰ Ends at midnight — ${p.offer}`, body: `Last call at ${p.brand}. After tonight it's back to full price.`, image: hero(p, '2'), actions: 'Shop the sale' }),
  },
  {
    name: 'Re-engagement', kind: 'Flow', icon: '💛', desc: 'We miss you', flow: true,
    build: (p) => ({ site: p.brand, url: p.url, title: `We miss you at ${p.brand}`, body: "Here's what's new since you've been gone — worth a look.", image: hero(p, '4'), actions: "See what's new\nNo thanks" }),
  },
]

/** Permission opt-in prompts — the "Allow notifications?" ask, native + two-step (soft). */
export const WEBPUSH_OPTIN_TEMPLATES: WebpushTemplate[] = [
  {
    name: 'Native browser prompt', kind: 'Transactional', icon: '🔔', desc: 'Chrome Allow / Block',
    optin: () => ({ style: 'native', title: '', body: '', allow: 'Allow', deny: 'Block' }),
  },
  {
    name: 'Two-step opt-in', kind: 'Flow', icon: '✋', desc: 'Branded soft ask', flow: true,
    optin: (p) => ({ style: 'twostep', title: 'Never miss a drop', body: `Get browser alerts from ${p.brand} for new arrivals, restocks and members-only offers.`, allow: 'Allow notifications', deny: 'Maybe later' }),
  },
  {
    name: 'Deals opt-in', kind: 'Promotional', icon: '🏷️', desc: 'Two-step · offer led',
    optin: (p) => ({ style: 'twostep', title: `Get ${p.offer} first`, body: `Turn on alerts and be first to know about drops and deals at ${p.brand}.`, allow: 'Yes, notify me', deny: 'No thanks' }),
  },
]

export function applyWebpushTemplate(t: WebpushTemplate, announce = true) {
  const s = useStudio.getState()
  const p = packFor(s.ctxId())
  if (!p) return
  if (t.optin) {
    const o = t.optin(p, s.ctxId())
    s.setWebpush({ mode: 'optin', site: p.brand, logo: null, optinStyle: o.style, optinTitle: o.title, optinBody: o.body, optinAllow: o.allow, optinDeny: o.deny })
    if (announce) useToast.getState().show('Opt-in prompt applied')
    return
  }
  if (!t.build) return
  const f = t.build(p, s.ctxId())
  s.setWebpush({ mode: 'notification', site: f.site, url: f.url, logo: null, title: f.title, body: f.body, image: f.image, actions: f.actions })
  if (announce) useToast.getState().show('Template applied' + (t.flow ? ' · hit Simulate to click' : ''))
}
