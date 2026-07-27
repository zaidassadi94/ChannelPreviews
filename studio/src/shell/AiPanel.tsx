import { useState } from 'react'
import { useStudio } from '@/store/useStudio'
import { useToast } from '@/store/useToast'
import { useAiPanel } from '@/store/useAiPanel'
import { channelById } from '@/channels/registry'
import { industryById } from '@/content/model'
import { applyAiMessage, BACKDROP_SECTION } from '@/lib/applyAi'
import { regenerateImage } from '@/lib/aiCampaign'
import { resolveBrandLogo, cleanDomain, type AiMessage } from '@/lib/media'
import { detectChannel, CH_LABEL } from '@/lib/detectChannel'

// Briefs that show off what the studio can do — name a brand, a channel, a
// feature (buttons, countdown, backdrop) — not just a generic tone.
const EXAMPLES = [
  'WhatsApp for Oatly: order shipped, with a Track order button',
  'Push for a banking app — your salary just landed 💰',
  'Instagram story for a coffee brand launching cold brew',
  'Gmail welcome email for a skincare brand, warm and simple',
  'In-app modal: 30% off the annual plan for a fitness app',
  'On-site popup with email capture and a 24-hour countdown',
]

// Cycled one at a time under the panel (advances after each generation) to
// surface features people miss.
const TIPS = [
  'Name a channel in your brief ("on WhatsApp", "as a push") and the studio switches to it.',
  'Mention a real brand and its logo & colors are pulled in automatically.',
  'After generating, switch channels — each one fills itself in for the same brand.',
  'Drop the website above so smaller or lesser-known brands are identified correctly.',
  'Hit "New image" to swap just the photo — no full regeneration, no rate limits.',
  'Set a Brand color from the left rail to theme buttons across every channel.',
  'Use Export or Copy (top-right) for a clean, rounded screenshot.',
  'Upload a screenshot as the app/site backdrop for in-app, web push & on-site.',
  'Edit any field on the left after generating — nothing is locked in.',
]

type Status = { kind: '' | 'ok' | 'err'; text: string; hint?: string }

/** The "✨ Generate with AI" panel. Slides in from the right; POSTs the brief to
 *  `/api/generate` and hands the schema message to the active channel's adapter
 *  (`applyAiMessage`) — the same render path as a built-in template. Generating also
 *  starts a "campaign" so switching channels auto-fills them for the same brand. */
export function AiPanel() {
  const open = useAiPanel((s) => s.open)
  const setOpen = useAiPanel((s) => s.setOpen)
  const channel = useStudio((s) => s.channel)
  const lastAi = useStudio((s) => s.lastAi)
  const [brief, setBrief] = useState('')
  const [site, setSite] = useState('')
  const [busy, setBusy] = useState(false)
  const [reimaging, setReimaging] = useState(false)
  const [status, setStatus] = useState<Status>({ kind: '', text: '' })
  const [tip, setTip] = useState(0)
  const [showEx, setShowEx] = useState(false)

  // "New image" re-rolls just the photo for the channel on screen (a Pexels call,
  // no LLM), so it's only offered when this channel's last generation had one.
  const canReimage = !!lastAi && lastAi.hasImage && lastAi.channel === channel

  async function reimage() {
    setReimaging(true)
    try {
      const ok = await regenerateImage()
      if (ok) useToast.getState().show('🖼️ New image')
    } finally { setReimaging(false) }
  }

  async function generate(briefArg?: string) {
    const s = useStudio.getState()
    const text = (briefArg ?? brief).trim()
    if (!text) { setStatus({ kind: 'err', text: 'Write a short brief first.' }); return }
    setBrief(text)
    const cleanSite = cleanDomain(site)

    // brief-driven routing: switch to a named channel in-app (no cross-tool handoff here)
    const target = detectChannel(text)
    const from = s.channel
    const channelId = target || from
    if (target && target !== from) s.setChannel(target)

    setBusy(true); setStatus({ kind: '', text: '' })
    try {
      const industry = industryById(s.industry)?.name || s.industry
      const r = await fetch('/api/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel: channelId, brand: s.brand.name, industry, brief: text, domain: cleanSite }),
      })
      const data = await r.json().catch(() => ({ ok: false, error: 'Bad response from server' }))
      if (!r.ok || !data.ok) {
        const em: string = data?.error || `Request failed (${r.status})`
        const hint = /GEMINI_API_KEY|GROQ_API_KEY/.test(em) ? 'Add a free key in Vercel → Settings → Environment Variables, then redeploy.'
          : /Too many requests/i.test(em) ? 'Tip: use "New image" to re-roll just the photo — it doesn\'t use the AI quota.' : undefined
        setStatus({ kind: 'err', text: em, hint })
        return
      }
      const msg: AiMessage = data.message || {}
      const logo = await resolveBrandLogo({ brief: text, domain: cleanSite || msg.domain, brand: msg.brand })
      await applyAiMessage(channelId, msg, { logo })
      // Start a campaign: switching to another channel now auto-generates it for the
      // same brand + brief (+ pinned site) in the background, until the industry changes.
      s.startAiCampaign(text, cleanSite, logo, channelId)
      // Open a relevant section on the left. For channels with a page/app backdrop,
      // open the Backdrop section so it's obvious you can drop in a real screenshot.
      const cdef = channelById(channelId)
      const sectionId = BACKDROP_SECTION[channelId] || cdef?.sections?.[1]?.id || cdef?.sections?.[0]?.id
      if (sectionId) s.setSection(sectionId)
      s.setPanelOpen(true)
      useToast.getState().show('✨ AI message generated')
      setTip((t) => (t + 1) % TIPS.length)
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
        <label className="cs-ai-sub">Brand website <span>optional — pins smaller brands &amp; their logo</span></label>
        <input
          className="cs-ai-url" type="text" inputMode="url" spellCheck={false} placeholder="e.g. nobero.com"
          value={site} onChange={(e) => setSite(e.target.value)}
          onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') generate() }}
        />
        <button type="button" className="cs-ai-extoggle" aria-expanded={showEx} onClick={() => setShowEx((v) => !v)}>
          {showEx ? 'Hide examples' : '💡 Need an idea? See examples'}
        </button>
        {showEx && (
          <div className="cs-ai-ex">
            {EXAMPLES.map((e) => (
              <button key={e} type="button" onClick={() => { setBrief(e); setShowEx(false) }}>{e}</button>
            ))}
          </div>
        )}
        <button className="cs-ai-go" type="button" disabled={busy} onClick={() => generate()}>
          {busy ? <><span className="cs-ai-spin" /> Generating…</> : 'Generate message'}
        </button>
        {canReimage && (
          <button className="cs-ai-reimg" type="button" disabled={reimaging} onClick={reimage}
            title="Fetch a different photo for this message — no AI request, so it won't hit rate limits.">
            {reimaging ? <><span className="cs-ai-spin dark" /> New image…</> : '🖼️ New image'}
          </button>
        )}
        <div className="cs-ai-cap">
          Name a channel or industry in your brief and the studio switches to it. The AI writes the copy,
          picks an image where it fits, and sets the brand &amp; logo — tweak anything after.
        </div>
        <div className={'cs-ai-status' + (status.kind ? ' show ' + status.kind : '')}>
          {status.text}
          {status.hint && <><br /><span style={{ opacity: 0.85 }}>{status.hint}</span></>}
        </div>
        <div className="cs-ai-tip"><span className="cs-ai-tip-ic">💡</span><span>{TIPS[tip]}</span></div>
      </div>
    </aside>
  )
}
