import { useStudio } from '@/store/useStudio'
import { useToast } from '@/store/useToast'
import { GMAIL_TEMPLATES, emailPackFor, type GmailTemplate } from './emails'

export { GMAIL_TEMPLATES }
export type { GmailTemplate }

export function applyGmailTemplate(t: GmailTemplate, announce = true) {
  const s = useStudio.getState()
  const p = emailPackFor(s.ctxId())
  const r = t.build(p, s.ctxId())
  s.setGmail({ senderName: r.sender, senderEmail: r.from, subject: r.subject, snippet: r.snippet, category: r.category, html: r.html, bodyMode: 'template' })
  if (announce) useToast.getState().show('Template applied')
}
