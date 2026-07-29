import { useEffect, useState } from 'react'
import { useStudio } from '@/store/useStudio'
import { useToast } from '@/store/useToast'
import { useAiPanel } from '@/store/useAiPanel'
import { channelById } from '@/channels/registry'
import { industryById } from '@/content/model'
import { applyAiMessage, applyChosenImage, heroOrient, isMultiAi, COPY_SECTION } from '@/lib/applyAi'
import { regenerateImage } from '@/lib/aiCampaign'
import { resolveBrandLogo, type AiMessage } from '@/lib/media'
import { PhotoPicker } from '@/shell/PhotoPicker'
import { detectChannel, CH_LABEL } from '@/lib/detectChannel'

// Briefs that show off what the studio can do — name a brand (a website right in the
// brief pins smaller ones), a channel, the image to show, a feature. Doubles as the
// cycling placeholder in the textarea, so people see the shape of a good brief.
const EXAMPLES = [
  'WhatsApp for birkenstock.com — 50% off new arrivals, suede sandals',
  'Push for a coffee brand launching cold brew — iced coffee close-up',
  'Instagram story for nobero.com — new oversized tees, streetwear flatlay',
  'Gmail welcome for a skincare brand, warm and simple — serum bottle',
  'In-app modal: 30% off the annual plan for a fitness app',
  'On-site popup with email capture and a 24-hour countdown',
]

// Cycled one at a time under the panel (advances after each generation) to
// surface features people miss.
const TIPS = [
  'Name a channel in your brief ("on WhatsApp", "as a push") and the studio switches to it.',
  'Include a brand\'s website in your brief (e.g. "for nobero.com") so smaller brands are identified correctly.',
  'Mention a real brand and its logo & colors are pulled in automatically.',
  'After generating, switch channels — each one fills itself in for the same brand.',
  'Hit "New image" for a fresh photo, or search & pick one from the grid below — no regeneration, no rate limits.',
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
  const [busy, setBusy] = useState(false)
  const [reimaging, setReimaging] = useState(false)
  const [status, setStatus] = useState<Status>({ kind: '', text: '' })
  const [tip, setTip] = useState(0)
  const [showEx, setShowEx] = useState(false)
  // Cycling placeholder: advances only while the field is empty and unfocused, so it
  // teaches the shape of a good brief without ever interrupting typing.
  const [ph, setPh] = useState(0)
  const [focused, setFocused] = useState(false)

  // "New image" (re-roll) / the photo picker act on the channel on screen, so they're
  // only offered when this channel's last generation actually placed a photo.
  // A carousel, or a multi-message stack (several cards / a thread / stacked pushes), has
  // several photos — the single-hero picker doesn't apply, so hide it and let the per-item
  // pickers in the channel's own editor handle those.
  const lastIsCarousel = !!lastAi && lastAi.channel === channel && (lastAi.m.type === 'carousel' || isMultiAi(lastAi.m))
  const canReimage = !!lastAi && lastAi.hasImage && lastAi.channel === channel && !lastIsCarousel

  useEffect(() => {
    if (brief || focused) return
    const id = setInterval(() => setPh((p) => (p + 1) % EXAMPLES.length), 3400)
    return () => clearInterval(id)
  }, [brief, focused])

  async function reimage() {
    setReimaging(true)
    try {
      const ok = await regenerateImage()
      if (ok) useToast.getState().show('🖼️ New image')
    } finally { setReimaging(false) }
  }

  async function choose(url: string) {
    const ok = await applyChosenImage(url)
    if (ok) useToast.getState().show('🖼️ Image updated')
  }

  async function generate(briefArg?: string) {
    const s = useStudio.getState()
    const text = (briefArg ?? brief).trim()
    if (!text) { setStatus({ kind: 'err', text: 'Write a short brief first.' }); return }
    setBrief(text)

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
        body: JSON.stringify({ channel: channelId, brand: s.brand.name, industry, brief: text }),
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
      const logo = await resolveBrandLogo({ brief: text, domain: msg.domain, brand: msg.brand })
      await applyAiMessage(channelId, msg, { logo })
      // Start a campaign: switching to another channel now auto-generates it for the
      // same brand + brief in the background (until you change industry).
      s.startAiCampaign(text, logo, channelId)
      // Open the section that holds the generated copy, so you land where you can edit
      // the words — not on Presets or a Format toggle. (Falls back to the 2nd rail item.)
      const cdef = channelById(channelId)
      const sectionId = COPY_SECTION[channelId] || cdef?.sections?.[1]?.id || cdef?.sections?.[0]?.id
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
          className="cs-ai-ta" maxLength={500} placeholder={`e.g. ${EXAMPLES[ph]}`}
          value={brief} onChange={(e) => setBrief(e.target.value)}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
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
          <>
            <div className="cs-ai-imgrow">
              <button className="cs-ai-reimg" type="button" disabled={reimaging} onClick={reimage}
                title={lastIsCarousel ? 'Re-roll fresh photos for every product card — no AI request.' : 'Fetch a different photo for this message — no AI request, so it won\'t hit rate limits.'}>
                {reimaging ? <><span className="cs-ai-spin dark" /> New image…</> : '🖼️ New image'}
              </button>
            </div>
            {!lastIsCarousel && lastAi && (
              <PhotoPicker autoLoad orientation={heroOrient(lastAi.channel, lastAi.m)}
                query={lastAi.m.imageQuery || lastAi.m.imageAlt || ''} onPick={choose} />
            )}
          </>
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
