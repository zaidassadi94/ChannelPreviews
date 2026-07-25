import { makeM, useStudio, type MMsg } from '@/store/useStudio'
import { useToast } from '@/store/useToast'
import { type Pack, confirmFor, packFor } from '@/content/model'
import { genOtp } from '@/lib/util'

export interface SmsTemplate {
  name: string
  kind: 'Promotional' | 'Transactional'
  icon: string
  desc: string
  build: (p: Pack, ctxId: string) => MMsg[]
}

export const SMS_TEMPLATES: SmsTemplate[] = [
  {
    name: 'Promotional', kind: 'Promotional', icon: '🏷️', desc: 'Offer + link',
    build: (p) => [makeM('text', { text: `${p.emoji} ${p.brand}: ${p.offer}! Shop now: ${p.url}/sale\nReply STOP to opt out.` })],
  },
  {
    name: 'Verification code', kind: 'Transactional', icon: '🔐', desc: 'OTP',
    build: (p) => { const otp = genOtp(); return [makeM('text', { text: `${otp} is your ${p.brand} ${p.otpUse} code. It expires in 10 minutes. Do not share it with anyone.` })] },
  },
  {
    name: 'Confirmation', kind: 'Transactional', icon: '✅', desc: 'Order / booking status',
    build: (p, ctxId) => {
      const c = confirmFor(ctxId)
      return [makeM('text', { text: c.ship
        ? `Your ${p.brand} ${c.noun} #${p.orderId} is out for delivery and arrives today by 6 PM. Track: ${p.url}/t/${p.orderId}`
        : `Your ${p.brand} ${c.noun} #${p.orderId} is confirmed. ${c.line} ${p.url}` })]
    },
  },
  {
    name: 'Reminder', kind: 'Transactional', icon: '🔔', desc: 'Nudge',
    build: (p) => [makeM('text', { text: `Reminder from ${p.brand}: ${p.reminder}. Details: ${p.url}` })],
  },
  {
    name: 'Flash sale', kind: 'Promotional', icon: '⚡', desc: 'Urgency + link',
    build: (p) => [makeM('text', { text: `⏰ Last chance! ${p.offer} ends at midnight — ${p.brand}. ${p.url}/flash` })],
  },
  {
    name: 'Win-back', kind: 'Promotional', icon: '💛', desc: 'Re-engagement + code',
    build: (p) => [makeM('text', { text: `We miss you at ${p.brand}! Here's a welcome-back treat — use ${p.code || 'HELLO10'} on your next order. ${p.url}` })],
  },
]

export function applySmsTemplate(t: SmsTemplate, announce = true) {
  const s = useStudio.getState()
  const p = packFor(s.ctxId())
  if (!p) return
  s.msgSet('sms', t.build(p, s.ctxId()))
  s.setBrand({ name: p.brand })
  if (announce) useToast.getState().show('Template applied')
}
