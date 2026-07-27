import { useState } from 'react'
import { useStudio } from '@/store/useStudio'
import { useToast } from '@/store/useToast'
import { useAiPanel } from '@/store/useAiPanel'
import { channelById } from '@/channels/registry'
import { industryById } from '@/content/model'
import { applyAiMessage, applyBackdropShot, BACKDROP_CHANNELS } from '@/lib/applyAi'
import { resolveBrandLogo, cleanDomain, guessDomain, type AiMessage } from '@/lib/media'
import { captureSite } from '@/lib/backdrop'
import { detectChannel, CH_LABEL } from '@/lib/detectChannel'

const EXAMPLES = [
  'Flash sale, 40% off, ends tonight — urgent tone',
  'Abandoned cart nudge with a gentle reminder',
  'Welcome message for a new customer',
  'Order shipped, friendly and reassuring',
]

type Status = { kind: '' | 'ok' | 'err'; text: string; hint?: string }

/** The "✨ Generate with AI" panel (ported from the root `ai.js`). Slides in from the right;
 *  POSTs the brief to `/api/generate` and hands the one schema message to the active
 *  channel's adapter (`applyAiMessage`) — the same render path as a built-in template. On
 *  the artifact/offline there is no `/api`, so it surfaces a friendly error and changes
 *  nothing (the core render path stays self-contained). */
export function AiPanel() {
  const open = useAiPanel((s) => s.open)
  const setOpen = useAiPanel((s) => s.setOpen)
  const [brief, setBrief] = useState('')
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState<Status>({ kind: '', text: '' })

  async function generate(briefArg?: string) {
    const s = useStudio.getState()
    const text = (briefArg ?? brief).trim()
    if (!text) { setStatus({ kind: 'err', text: 'Write a short brief first.' }); return }
    setBrief(text)

    // brief-driven routing: switch to a named channel in-app (no cross-tool handoff here)
    const target = detectChannel(text)
    const from = s.channel
    const channel = target || from
    if (target && target !== from) s.setChannel(target)

    setBusy(true); setStatus({ kind: '', text: '' })
    try {
      const industry = industryById(s.industry)?.name || s.industry
      const r = await fetch('/api/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel, brand: s.brand.name, industry, brief: text }),
      })
      const data = await r.json().catch(() => ({ ok: false, error: 'Bad response from server' }))
      if (!r.ok || !data.ok) {
        const em: string = data?.error || `Request failed (${r.status})`
        const hint = /GEMINI_API_KEY|GROQ_API_KEY/.test(em) ? 'Add a free key in Vercel → Settings → Environment Variables, then redeploy.' : undefined
        setStatus({ kind: 'err', text: em, hint })
        return
      }
      const msg: AiMessage = data.message || {}
      const logo = await resolveBrandLogo({ brief: text, domain: msg.domain, brand: msg.brand })
      await applyAiMessage(channel, msg, { logo })
      // For channels with a page/app backdrop, best-effort capture the brand's
      // real site and drop it in when it resolves — non-blocking, so the message
      // shows instantly and the backdrop fills in a moment later (or not at all).
      if (BACKDROP_CHANNELS.includes(channel)) {
        const site = cleanDomain(msg.domain) || guessDomain(msg.brand)
        if (site) captureSite(site).then((shot) => { if (shot) applyBackdropShot(channel, shot) })
      }
      // open the content editor so the generated copy is right there to tweak
      const cdef = channelById(channel)
      const contentId = cdef?.sections?.[1]?.id || cdef?.sections?.[0]?.id
      if (contentId) s.setSection(contentId)
      s.setPanelOpen(true)
      useToast.getState().show('✨ AI message generated')
      const note = target && target !== from ? `Switched to ${CH_LABEL[target] || target}. ` : ''
      setStatus({ kind: 'ok', text: note + 'Done — edit any field on the left, or generate again.' })
    } catch {
      setStatus({ kind: 'err', text: 'Could not reach the generator. On the live site make sure the function is deployed.' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <aside className={'cs-ai' + (open ? ' open' : '')}>
      <div className="cs-ai-head">
        <span className="ic">✨</span>
        <h3>Generate with AI</h3>
        <button className="cs-ai-x" title="Close" onClick={() => setOpen(false)}>✕</button>
      </div>
      <div className="cs-ai-body">
        <label>Describe the message</label>
        <textarea
          className="cs-ai-ta" maxLength={500} placeholder={`e.g. ${EXAMPLES[0]}`}
          value={brief} onChange={(e) => setBrief(e.target.value)}
          onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') generate() }}
        />
        <div className="cs-ai-ex">
          {EXAMPLES.map((e) => (
            <button key={e} type="button" onClick={() => setBrief(e)}>{e}</button>
          ))}
        </div>
        <button className="cs-ai-go" type="button" disabled={busy} onClick={() => generate()}>
          {busy ? <><span className="cs-ai-spin" /> Generating…</> : 'Generate message'}
        </button>
        <div className="cs-ai-cap">
          Name a channel or industry in your brief and the studio switches to it. The AI writes the copy,
          picks an image, and sets the brand &amp; logo — tweak anything after.
        </div>
        <div className={'cs-ai-status' + (status.kind ? ' show ' + status.kind : '')}>
          {status.text}
          {status.hint && <><br /><span style={{ opacity: 0.85 }}>{status.hint}</span></>}
        </div>
      </div>
    </aside>
  )
}
