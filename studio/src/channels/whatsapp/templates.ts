import { makeMsg, type WAMsg } from '@/store/useStudio'
import { type Pack, confirmFor } from '@/content/model'
import { phImg, genOtp, hueOf } from '@/lib/util'

export interface WATemplate {
  name: string
  kind: 'Promotional' | 'Transactional' | 'Flow'
  icon: string
  desc: string
  flow?: boolean
  build: (p: Pack, ctxId: string) => WAMsg[]
}

const optStr = (opts: [string, string][]) => opts.map((o) => `${o[0]} | reply >> ${o[1]}`).join('\n')
const hero = (p: Pack) => phImg(p.brand, null, hueOf(p.brand), 600, 340)
const cap = (x: string) => (x ? x.charAt(0).toUpperCase() + x.slice(1) : x)

export const WA_TEMPLATES: WATemplate[] = [
  {
    name: 'Seasonal offer', kind: 'Promotional', icon: '🏷️', desc: 'Image + offer + CTA',
    build: (p) => [makeMsg('template', { img: hero(p), body: `${p.emoji} *${p.offer}* just went live at ${p.brand}.\nYou're on the early list — first pick, best of the lot.`, footer: p.brand, buttons: `Shop the drop | url | https://${p.url}` })],
  },
  {
    name: 'Confirmation', kind: 'Transactional', icon: '✅', desc: 'Order / booking confirmed',
    build: (p, ctxId) => {
      const c = confirmFor(ctxId)
      return [makeMsg('template', { body: `Your ${c.noun} *#${p.orderId}* is confirmed ✅\n${c.line}`, footer: p.brand, buttons: `${c.cta} | url | https://${p.url}${c.ship ? '/track' : ''}\nContact support | call | +18005550199` })]
    },
  },
  {
    name: 'Interactive flow', kind: 'Flow', icon: '🔀', desc: 'Tap buttons to branch', flow: true,
    build: (p) => [makeMsg('template', { img: phImg(p.brand, 'offer', hueOf(p.brand + 'x'), 600, 340), body: p.flow.intro, footer: p.brand, buttons: optStr(p.flow.opts) })],
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
      body: `Thanks for choosing ${p.brand} 🙌\n${p.feedbackQ || 'How did we do?'}`, footer: p.brand,
      buttons: `😍 Loved it | reply >> Amazing — thank you! 💛 Mind leaving a quick review? ${p.url}/review\n🙂 It was OK | reply >> Thanks for the honest feedback — we're always improving.\n😞 Not great | reply >> So sorry. Reply here and we'll make it right.`,
    })],
  },
]

export { cap }
