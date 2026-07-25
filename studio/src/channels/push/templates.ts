import { useStudio } from '@/store/useStudio'
import { useToast } from '@/store/useToast'
import { type Pack, confirmFor, packFor, cap } from '@/content/model'
import { phImg, hueOf } from '@/lib/util'
import { oneLine } from '@/channels/notify/shared'

export interface PushBuild { appName: string; title: string; body: string; image: string; actions: string; expanded: boolean }
export interface PushTemplate {
  name: string
  kind: 'Promotional' | 'Transactional' | 'Flow'
  icon: string
  desc: string
  flow?: boolean
  build: (p: Pack, ctxId: string) => PushBuild
}

const hero = (p: Pack, seed = '') => phImg(p.brand, p.offer, hueOf(p.brand + seed), 600, 340)

export const PUSH_TEMPLATES: PushTemplate[] = [
  {
    name: 'Promotional offer', kind: 'Promotional', icon: '🏷️', desc: 'Big image + CTA',
    build: (p) => ({ appName: p.brand, title: `${p.emoji} ${p.offer}`, body: `${p.brand} just dropped something good — tap to see it first. 👀`, image: hero(p, '3'), actions: 'Shop the drop\nRemind me', expanded: true }),
  },
  {
    name: 'Order update', kind: 'Transactional', icon: '✅', desc: 'Confirmation / delivery',
    build: (p, ctxId) => {
      const c = confirmFor(ctxId)
      const line = c.push?.line || c.line
      return { appName: p.brand, title: `${cap(c.noun)} #${p.orderId} ${c.ship ? 'is on the way' : 'confirmed'}`, body: c.ship ? 'Arriving today by 6 PM. Tap to track it live.' : line, image: '', actions: c.ship ? 'Track order' : c.cta, expanded: true }
    },
  },
  {
    name: 'Win-back', kind: 'Flow', icon: '💛', desc: 'Re-engagement + choices', flow: true,
    build: (p) => ({ appName: p.brand, title: `We miss you at ${p.brand}`, body: oneLine(p.push?.flow.intro || p.flow.intro), image: hero(p, '7'), actions: (p.push?.flow.opts.map((o) => o[0]) || p.flow.opts.map((o) => o[0])).slice(0, 3).join('\n'), expanded: true }),
  },
  {
    name: 'Reminder', kind: 'Transactional', icon: '🔔', desc: 'Nudge + open app',
    build: (p) => ({ appName: p.brand, title: `Reminder from ${p.brand}`, body: cap(p.reminder), image: '', actions: `Open ${p.brand}`, expanded: false }),
  },
  {
    name: 'Flash sale', kind: 'Promotional', icon: '⚡', desc: 'Urgency + image',
    build: (p) => ({ appName: p.brand, title: `⏰ Gone at midnight — ${p.offer}`, body: `This is your reminder. After tonight, it's back to full price at ${p.brand}.`, image: hero(p, '5'), actions: 'Shop the sale', expanded: true }),
  },
  {
    name: 'Feedback', kind: 'Flow', icon: '⭐', desc: 'Rating buttons', flow: true,
    build: (p) => ({ appName: p.brand, title: 'How did we do?', body: p.feedbackQ || `Tell us how ${p.brand} did — it takes 10 seconds.`, image: '', actions: '😍 Great\n🙂 Okay\n😞 Poor', expanded: true }),
  },
]

export function applyPushTemplate(t: PushTemplate, announce = true) {
  const s = useStudio.getState()
  const p = packFor(s.ctxId())
  if (!p) return
  const f = t.build(p, s.ctxId())
  s.setNotify({ appName: f.appName, expanded: f.expanded })
  s.setPush({ title: f.title, body: f.body, image: f.image, actions: f.actions, time: 'now' })
  if (announce) useToast.getState().show('Template applied' + (t.flow ? ' · hit Simulate to tap actions' : ''))
}
