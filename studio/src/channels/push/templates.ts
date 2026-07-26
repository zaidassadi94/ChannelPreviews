import { useStudio } from '@/store/useStudio'
import { useToast } from '@/store/useToast'
import { type Pack, confirmFor, packFor, cap } from '@/content/model'
import { heroPhoto } from '@/lib/photo'
import { oneLine } from '@/channels/notify/shared'

export interface PushBuild { appName: string; title: string; body: string; image: string; actions: string; expanded: boolean }
export interface PushOptin { style: string; title: string; body: string; allow: string; deny: string }
export interface PushTemplate {
  name: string
  kind: 'Promotional' | 'Transactional' | 'Flow'
  icon: string
  desc: string
  flow?: boolean
  build?: (p: Pack, ctxId: string) => PushBuild
  optin?: (p: Pack, ctxId: string) => PushOptin
}

const hero = (p: Pack, seed = '') => heroPhoto(p, seed, 600, 340)

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

/** Permission opt-in prompts — the system "Allow notifications?" alert + a two-step (soft) ask. */
export const PUSH_OPTIN_TEMPLATES: PushTemplate[] = [
  {
    name: 'System prompt', kind: 'Transactional', icon: '🔔', desc: 'iOS / Android Allow',
    optin: () => ({ style: 'native', title: '', body: '', allow: 'Allow', deny: "Don't Allow" }),
  },
  {
    name: 'Two-step opt-in', kind: 'Flow', icon: '✋', desc: 'Branded pre-permission', flow: true,
    optin: (p) => ({ style: 'twostep', title: 'Turn on notifications', body: `Get order updates and members-only offers from ${p.brand} the moment they go live.`, allow: 'Turn on notifications', deny: 'Not now' }),
  },
  {
    name: 'Offers opt-in', kind: 'Promotional', icon: '🎁', desc: 'Two-step · perks led',
    optin: (p) => ({ style: 'twostep', title: 'Get the good stuff first', body: `Allow notifications for early access to drops and deals at ${p.brand}.`, allow: 'Sounds good', deny: 'Maybe later' }),
  },
]

const NOTIF_SURFACES = ['lock', 'banner', 'heads', 'shade']

export function applyPushTemplate(t: PushTemplate, announce = true) {
  const s = useStudio.getState()
  const p = packFor(s.ctxId())
  if (!p) return
  if (t.optin) {
    const o = t.optin(p, s.ctxId())
    s.setNotify({ appName: p.brand, surface: 'optin', optinStyle: o.style, optinTitle: o.title, optinBody: o.body, optinAllow: o.allow, optinDeny: o.deny })
    if (announce) useToast.getState().show('Opt-in prompt applied')
    return
  }
  if (!t.build) return
  const f = t.build(p, s.ctxId())
  // if we're currently showing the opt-in prompt, drop back to a real notification surface
  const surface = NOTIF_SURFACES.includes(s.notify.surface) ? {} : { surface: s.device === 'ios' ? 'lock' : 'heads' }
  s.setNotify({ appName: f.appName, expanded: f.expanded, ...surface })
  s.setPush({ title: f.title, body: f.body, image: f.image, actions: f.actions, time: 'now' })
  if (announce) useToast.getState().show('Template applied' + (t.flow ? ' · hit Simulate to tap actions' : ''))
}
