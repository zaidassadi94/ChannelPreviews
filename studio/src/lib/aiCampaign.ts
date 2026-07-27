/* AI "campaign" continuity: after you generate a message, switching to another
   channel auto-generates that channel's content for the SAME brand + brief in the
   background — so cycling channels shows the brand you generated everywhere, not
   each channel's stale default. The campaign (brief + resolved logo) lives in the
   store and is cleared when the industry changes. */

import { useEffect } from 'react'
import { useStudio } from '@/store/useStudio'
import { industryById } from '@/content/model'
import { applyAiMessage } from '@/lib/applyAi'
import type { AiMessage } from '@/lib/media'

/** POST the brief to the generator for one channel. Returns the schema message or throws. */
export async function fetchGeneratedMessage(channel: string, brief: string): Promise<AiMessage> {
  const s = useStudio.getState()
  const industry = industryById(s.industry)?.name || s.industry
  const r = await fetch('/api/generate', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ channel, brand: s.brand.name, industry, brief, domain: s.aiSite || '' }),
  })
  const data = await r.json().catch(() => ({ ok: false, error: 'Bad response from server' }))
  if (!r.ok || !data.ok) throw new Error(data?.error || `Request failed (${r.status})`)
  return (data.message || {}) as AiMessage
}

/** Generate + apply one channel's content for the active campaign, reusing the
    campaign's already-resolved logo (no per-channel logo re-fetch, so a channel
    whose logo can't be guessed doesn't wipe the shared one). */
export async function generateChannelForCampaign(channel: string, brief: string): Promise<void> {
  const msg = await fetchGeneratedMessage(channel, brief)
  const logo = useStudio.getState().aiLogo
  await applyAiMessage(channel, msg, { logo, skipIdentity: true })
}

/** Re-fetch just the photo for the last generation and re-apply it — a Pexels call
    with a fresh seed, NO LLM request, so it doesn't spend the generator's rate limit.
    Re-dispatches the stored message (copy is deterministic from it, so only the image
    changes). Returns false if there's nothing with an image to re-roll. */
export async function regenerateImage(): Promise<boolean> {
  const last = useStudio.getState().lastAi
  if (!last || !last.hasImage) return false
  await applyAiMessage(last.channel, last.m, { logo: last.logo, skipIdentity: true })
  return true
}

/** One background generation at a time (module-level so effect re-runs from our own
    state writes don't cancel the in-flight request). */
let inFlight: string | null = null

/** Mounted once in AppShell. When you switch to a channel that hasn't been generated
    for the current campaign yet, generate its content in the background. Failures are
    silent — the channel stays un-done and retries the next time you visit it. */
export function useAiChannelSync() {
  const channel = useStudio((s) => s.channel)
  const aiBrief = useStudio((s) => s.aiBrief)
  const aiDone = useStudio((s) => s.aiDone)

  useEffect(() => {
    if (!aiBrief || aiDone.includes(channel) || inFlight) return
    inFlight = channel
    useStudio.getState().setAiBusyChannel(channel)
    generateChannelForCampaign(channel, aiBrief)
      .then(() => useStudio.getState().markAiDone(channel))
      .catch(() => {})
      .finally(() => { inFlight = null; useStudio.getState().setAiBusyChannel(null) })
  }, [channel, aiBrief, aiDone])
}
