/* Showcase "Generate all": turn one board prompt into a coherent set of messages, one per
   tile. Auto mode asks the server planner for a per-channel angle (a connected story), then
   generates each channel with its angle; Directed mode uses each tile's own brief. Both reuse
   the normal per-channel generator + adapters (so every tile is real, editable content). */

import { useStudio } from '@/store/useStudio'
import { useShowcase, type ShowcaseTile } from '@/store/useShowcase'
import { industryById } from '@/content/model'
import { fetchGeneratedMessage } from '@/lib/aiCampaign'
import { applyAiMessage } from '@/lib/applyAi'
import { resolveBrandLogo } from '@/lib/media'

export interface SlidePlan { brand: string; industry: string; domain: string; plan: { channel: string; angle: string }[] }

/** Ask the server to plan one coherent moment across the given channels. */
export async function planSlide(brand: string, brief: string, channels: string[]): Promise<SlidePlan> {
  const s = useStudio.getState()
  const industry = industryById(s.industry)?.name || s.industry
  const r = await fetch('/api/generate', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode: 'plan', channels, brand: brand || s.brand.name, industry, brief }),
  })
  const data = await r.json().catch(() => ({ ok: false, error: 'Bad response from server' }))
  if (!r.ok || !data.ok) throw new Error(data?.error || `Request failed (${r.status})`)
  return { brand: data.brand || '', industry: data.industry || '', domain: data.domain || '', plan: data.plan || [] }
}

/** Generate every tile on the board. In Auto mode a single planner call decides a coherent
    angle per channel; in Directed mode each tile's own brief drives it. Tiles generate
    sequentially (gentle on the free-tier rate limit) and update their status as they go. */
export async function generateSlide(): Promise<{ ok: number; failed: number }> {
  const sc = useShowcase.getState()
  const st = useStudio.getState()
  const tiles = sc.tiles
  if (!tiles.length) return { ok: 0, failed: 0 }

  sc.setGenerating(true)
  tiles.forEach((t) => sc.setTileStatus(t.id, 'busy'))

  // Decide the brief per tile: Auto → planned angle; Directed → the tile's own brief.
  const brandInput = sc.brand.trim()
  let angleFor: (t: ShowcaseTile) => string
  let planBrand = brandInput || st.brand.name
  let planDomain = ''
  try {
    if (sc.mode === 'auto') {
      const plan = await planSlide(brandInput, sc.brief.trim() || `a marketing moment for ${planBrand}`, tiles.map((t) => t.channel))
      planBrand = plan.brand || planBrand
      planDomain = plan.domain
      const byCh = new Map(plan.plan.map((p) => [p.channel, p.angle]))
      angleFor = (t) => byCh.get(t.channel) || sc.brief.trim() || `a message from ${planBrand}`
    } else {
      angleFor = (t) => t.brief.trim() || sc.brief.trim() || `a message from ${planBrand}`
    }
  } catch (e) {
    sc.setGenerating(false)
    tiles.forEach((t) => sc.setTileStatus(t.id, 'idle'))
    throw e
  }

  // Resolve the shared brand + logo once, set brand identity globally (no industry change,
  // so the mounted tiles' auto-template can't clobber the content we're about to write).
  const logo = await resolveBrandLogo({ brief: sc.brief || planBrand, domain: planDomain, brand: planBrand }).catch(() => null)
  st.setBrand({ name: planBrand })
  st.setBrandIdentity(planBrand, logo)

  let ok = 0, failed = 0
  for (const t of tiles) {
    try {
      const msg = await fetchGeneratedMessage(t.channel, angleFor(t))
      await applyAiMessage(t.channel, msg, { logo, skipIdentity: true })
      useShowcase.getState().setTileStatus(t.id, 'done')
      ok++
    } catch {
      useShowcase.getState().setTileStatus(t.id, 'error')
      failed++
    }
  }
  useShowcase.getState().setGenerating(false)
  return { ok, failed }
}
