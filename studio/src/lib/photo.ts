/* Real-photo resolver for template content — stored bytes, else the gradient placeholder.
 *
 *   1. a STORED/bundled photo (data: URI from content/photos.ts) — self-contained, works
 *      offline + in the artifact preview, and stays CORS-clean for Export/Record,
 *   2. else the self-contained SVG GRADIENT (util.phImg) — always available.
 *
 * content/photos.ts is populated by `npm run prefetch:photos` (see that script), which the
 * Vercel build runs automatically, so the deployed site ships real STORED photos with zero
 * runtime fetches. Until then everything falls back to gradients — no network, no breakage.
 * (The live-search remote URLs in pximg.ts stay on the AI path only, never the render path.) */
import type { Pack } from '@/content/model'
import { kwForSubject } from '@/content/pximg'
import { PHOTO } from '@/content/photos'
import { phImg, hueOf } from '@/lib/util'

/** Best photo for a free-text subject (product name, keyword…): stored → gradient. */
export function tphoto(subject: string, w = 600, h = 340): string {
  const key = kwForSubject(subject)
  if (key && PHOTO[key]) return PHOTO[key]
  return phImg(subject, null, hueOf(subject), w, h)
}

/** A representative product photo for a pack's promo/hero slot. Uses the seed to rotate
    through the pack's own products so different templates don't all show the same shot. */
export function heroPhoto(p: Pack, seed = '', w = 600, h = 340): string {
  const c = p.carousel
  const name = c && c.length ? c[hueOf(p.brand + seed) % c.length][0] : p.brand
  return tphoto(name, w, h)
}
