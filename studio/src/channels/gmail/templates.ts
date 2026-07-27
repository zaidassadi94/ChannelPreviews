import { useStudio } from '@/store/useStudio'
import { useToast } from '@/store/useToast'
import { GMAIL_TEMPLATES, emailPackFor, type GmailTemplate } from './emails'

export { GMAIL_TEMPLATES }
export type { GmailTemplate }

export function applyGmailTemplate(t: GmailTemplate, announce = true) {
  const s = useStudio.getState()
  const base = emailPackFor(s.ctxId())
  // Global brand color themes the email accent (button, brand bar, code) when set;
  // the full logo (if uploaded/fetched) rides along so the header shows the real mark.
  const p = { ...base, ...(s.brandColor ? { accent: s.brandColor } : {}), ...(s.gmail.logo ? { logo: s.gmail.logo } : {}) }
  const r = t.build(p, s.ctxId())
  s.setGmail({ senderName: r.sender, senderEmail: r.from, subject: r.subject, snippet: r.snippet, category: r.category, html: r.html, bodyMode: 'template' })
  if (announce) useToast.getState().show('Preset applied')
}
