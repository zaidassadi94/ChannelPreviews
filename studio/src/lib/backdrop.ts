/* Backdrop image helpers for the Onsite / In-App / Web Push page backgrounds.
 *
 *  - fileToBackdrop: a dropped/selected image file → a downscaled data: URL
 *    (canvas, JPEG), so the mockup stays self-contained and Export/Record-clean.
 *  - captureSite: a website URL → a screenshot data: URL, via the same-origin
 *    /api/shot proxy (which returns base64, so there's no cross-origin taint).
 *    Returns null when offline / no function / capture fails, and the caller
 *    keeps whatever backdrop it already had.
 *
 * Both keep the render path self-contained: once resolved the value is a data:
 * URL embedded in state — no runtime network on the render path. */

const MAXW = 1600

/** Downscale an already-loaded image to a JPEG data URL no wider than maxW. */
function downscale(img: HTMLImageElement, maxW = MAXW): string {
  const nw = img.naturalWidth || maxW
  const scale = Math.min(1, maxW / nw)
  const w = Math.max(1, Math.round(nw * scale))
  const h = Math.max(1, Math.round((img.naturalHeight || nw) * scale))
  const c = document.createElement('canvas')
  c.width = w; c.height = h
  const ctx = c.getContext('2d')
  if (!ctx) return ''
  ctx.drawImage(img, 0, 0, w, h)
  return c.toDataURL('image/jpeg', 0.86)
}

/** Read an image File (drag-drop or picker) into a downscaled data: URL. */
export function fileToBackdrop(file: File, maxW = MAXW): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) { reject(new Error('Not an image file')); return }
    const fr = new FileReader()
    fr.onerror = () => reject(new Error('Could not read the file'))
    fr.onload = () => {
      const img = new Image()
      img.onload = () => { const d = downscale(img, maxW); d ? resolve(d) : reject(new Error('Could not process the image')) }
      img.onerror = () => reject(new Error('Could not read the image'))
      img.src = String(fr.result)
    }
    fr.readAsDataURL(file)
  })
}

/** Strip protocol / trailing slash from a URL down to a bare host[/path]. */
export function normSite(url: string): string {
  return (url || '').trim().replace(/^https?:\/\//i, '').replace(/\/+$/, '')
}

const shotMem: Record<string, string | null> = {}

/** Screenshot a website via /api/shot → data: URL, or null (offline / blocked /
    no function). Memoised so a given site is captured at most once per visit. */
export async function captureSite(url: string): Promise<string | null> {
  const site = normSite(url)
  if (!site || site.indexOf('.') < 1) return null
  if (site in shotMem) return shotMem[site]
  try {
    const r = await fetch('/api/shot?url=' + encodeURIComponent(site))
    const d = await r.json().catch(() => ({}))
    const out = d && d.ok && d.url ? (d.url as string) : null
    shotMem[site] = out
    return out
  } catch { return (shotMem[site] = null) }
}
