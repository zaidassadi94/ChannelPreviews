import { makeM, useStudio, type MMsg } from '@/store/useStudio'
import { useToast } from '@/store/useToast'
import { type Pack, confirmFor, packFor, cap } from '@/content/model'
import { phImg, hueOf } from '@/lib/util'

export interface RcsTemplate {
  name: string
  kind: 'Promotional' | 'Transactional' | 'Flow'
  icon: string
  desc: string
  flow?: boolean
  build: (p: Pack, ctxId: string) => MMsg[]
}

const hero = (p: Pack, sub: string | null, seed = '') => phImg(p.brand, sub, hueOf(p.brand + seed), 600, 340)
const chipStr = (opts: [string, string][]) => opts.map((o) => `${o[0]} >> ${o[1]}`).join('\n')
const carouselStr = (p: Pack) => p.carousel.map((c) => ` | ${c[0]} | ${c[1]} | View | https://${p.url}`).join('\n')

export const RCS_TEMPLATES: RcsTemplate[] = [
  {
    name: 'Offer card', kind: 'Promotional', icon: '🏷️', desc: 'Rich card + chips',
    build: (p) => [makeM('card', { img: hero(p, p.offer, '3'), title: p.offer, desc: `${p.brand} · here while it lasts 👀`, buttons: `Shop the drop | url | https://${p.url}`, chips: 'See all deals\nNotify me' })],
  },
  {
    name: 'Confirmation', kind: 'Transactional', icon: '✅', desc: 'Status card + actions',
    build: (p, ctxId) => {
      const c = confirmFor(ctxId)
      return c.ship
        ? [makeM('card', { img: hero(p, null, '5'), title: `${cap(c.noun)} #${p.orderId}`, desc: 'On the way · Arriving today by 6 PM', buttons: `Track live | url | https://${p.url}/track`, chips: 'Change address >> Sure — reply with your new delivery address.\nContact support' })]
        : [makeM('card', { img: hero(p, null, '5'), title: c.head, desc: c.line, buttons: `${c.cta} | url | https://${p.url}`, chips: 'View details\nContact support' })]
    },
  },
  {
    name: 'Product carousel', kind: 'Promotional', icon: '🖼️', desc: 'Swipeable rich cards',
    build: (p) => [makeM('text', { text: `${p.emoji} Picked with you in mind:` }), makeM('carousel', { cards: carouselStr(p), chips: 'See all\nTalk to us' })],
  },
  {
    name: 'Reminder card', kind: 'Transactional', icon: '🔔', desc: 'Nudge + open app',
    build: (p) => [makeM('card', { img: hero(p, null, '9'), title: "Don't forget 👋", desc: cap(p.reminder), buttons: `Open ${p.brand} | url | https://${p.url}`, chips: 'Remind me later\nNot now' })],
  },
  {
    name: 'Interactive flow', kind: 'Flow', icon: '🔀', desc: 'Tap chips to branch', flow: true,
    build: (p) => [makeM('text', { text: p.flow.intro, chips: chipStr(p.flow.opts) })],
  },
  {
    name: 'Feedback request', kind: 'Flow', icon: '⭐', desc: 'Rating chips branch', flow: true,
    build: (p) => [makeM('text', { text: `Thanks for choosing ${p.brand} 🙌 How did we do?`, chips: `😍 Great >> Thank you! Mind leaving a review? ${p.url}/review\n🙂 Okay >> Thanks — we'll keep improving.\n😞 Poor >> Sorry! Reply and we'll make it right.` })],
  },
]

export function applyRcsTemplate(t: RcsTemplate, announce = true) {
  const s = useStudio.getState()
  const p = packFor(s.ctxId())
  if (!p) return
  s.msgSet('rcs', t.build(p, s.ctxId()))
  s.setBrand({ name: p.brand, sub: 'Verified business' })
  if (announce) useToast.getState().show('Template applied' + (t.flow ? ' · hit Simulate to branch' : ''))
}
