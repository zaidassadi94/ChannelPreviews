import { makeMsg, useStudio, type WAMsg } from '@/store/useStudio'
import { useToast } from '@/store/useToast'
import { type Pack, confirmFor, packFor } from '@/content/model'
import { genOtp } from '@/lib/util'
import { heroPhoto } from '@/lib/photo'

export interface WATemplate {
  name: string
  kind: 'Promotional' | 'Transactional' | 'Flow'
  icon: string
  desc: string
  flow?: boolean
  build: (p: Pack, ctxId: string) => WAMsg[]
}

const optStr = (opts: [string, string][]) => opts.map((o) => `${o[0]} | reply >> ${o[1]}`).join('\n')
const hero = (p: Pack) => heroPhoto(p, '', 600, 340)
const cap = (x: string) => (x ? x.charAt(0).toUpperCase() + x.slice(1) : x)

export const WA_TEMPLATES: WATemplate[] = [
  {
    name: 'Seasonal offer', kind: 'Promotional', icon: '🏷️', desc: 'Image + offer + CTA',
    build: (p) => [makeMsg('template', { img: hero(p), body: `${p.emoji} *${p.offer}* just went live at ${p.brand}.\nYou're on the early list — first pick, best of the lot.`, footer: 'Reply STOP to unsubscribe', buttons: `Shop the drop | url | https://${p.url}` })],
  },
  {
    name: 'Confirmation', kind: 'Transactional', icon: '✅', desc: 'Order / booking confirmed',
    build: (p, ctxId) => {
      const c = confirmFor(ctxId)
      return [makeMsg('template', { body: `Your ${c.noun} *#${p.orderId}* is confirmed ✅\n${c.line}`, footer: 'Questions? Just reply here', buttons: `${c.cta} | url | https://${p.url}${c.ship ? '/track' : ''}\nContact support | call | +18005550199` })]
    },
  },
  {
    name: 'Interactive flow', kind: 'Flow', icon: '🔀', desc: 'Tap buttons to branch', flow: true,
    build: (p) => [makeMsg('template', { img: heroPhoto(p, 'x', 600, 340), body: p.flow.intro, footer: 'Reply STOP to unsubscribe', buttons: optStr(p.flow.opts) })],
  },
  {
    name: 'Verification code', kind: 'Transactional', icon: '🔐', desc: 'OTP + copy button',
    build: (p) => {
      const otp = genOtp()
      return [makeMsg('template', { body: `*${otp.slice(0, 3)} ${otp.slice(3)}* is your ${p.brand} ${p.otpUse} code.\nFor your security, never share it.`, footer: 'Expires in 10 minutes', buttons: `Copy code | copy` })]
    },
  },
  {
    name: 'Feedback request', kind: 'Flow', icon: '⭐', desc: 'Rating replies branch', flow: true,
    build: (p) => [makeMsg('template', {
      body: `Thanks for choosing ${p.brand} 🙌\n${p.feedbackQ || 'How did we do?'}`, footer: 'Takes less than a minute',
      buttons: `😍 Loved it | reply >> Amazing — thank you! 💛 Mind leaving a quick review? ${p.url}/review\n🙂 It was OK | reply >> Thanks for the honest feedback — we're always improving.\n😞 Not great | reply >> So sorry. Reply here and we'll make it right.`,
    })],
  },
  {
    name: 'BOGO + coupon', kind: 'Promotional', icon: '🎟️', desc: 'Image + offer + copy-code',
    build: (p) => [makeMsg('template', {
      img: hero(p),
      body: `*Buy One Get One* 🛍️\nOffer ends 31 Jul, 12:00 pm · Code *${p.code || 'BOGO'}*\n\nBuy 1, get 1 FREE on our entire collection! 🎉 Limited-time offer — don't miss out.\nPaste the code below at checkout.`,
      footer: 'Reply STOP to unsubscribe',
      buttons: `Copy code | copy\nExplore | url | https://${p.url}`,
    })],
  },
]

/** Imperative apply — usable from a panel click or a mount effect. */
export function applyWATemplate(t: WATemplate, announce = true) {
  const s = useStudio.getState()
  const p = packFor(s.ctxId())
  if (!p) return
  s.waSetMessages(t.build(p, s.ctxId()))
  s.setBrand({ name: p.brand, sub: 'online' })
  if (announce) useToast.getState().show('Preset applied' + (t.flow ? ' · hit Simulate to branch' : ''))
}

export { cap }
