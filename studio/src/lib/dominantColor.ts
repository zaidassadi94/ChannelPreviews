/* Pull the dominant *brand* color out of a logo image so the studio can theme
 * buttons/accents to match. Draws the logo to a tiny canvas and picks the most
 * common vibrant (non-grey, non-near-black/white) color. Works on canvas-safe
 * sources — uploaded files and /api/logo results are data: URLs, so they read
 * fine; a tainted cross-origin URL just resolves null and the caller keeps its
 * current color. */
const hx = (x: number) => Math.round(x).toString(16).padStart(2, '0')
const toHex = (r: number, g: number, b: number) => '#' + hx(r) + hx(g) + hx(b)

/** Load an image (canvas-safe sources only) and hand back its 2D context data. */
function loadPixels(src: string, S = 48): Promise<{ data: Uint8ClampedArray } | null> {
  return new Promise((resolve) => {
    if (!src) { resolve(null); return }
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onerror = () => resolve(null)
    img.onload = () => {
      try {
        const c = document.createElement('canvas'); c.width = S; c.height = S
        const ctx = c.getContext('2d'); if (!ctx) { resolve(null); return }
        ctx.drawImage(img, 0, 0, S, S)
        resolve({ data: ctx.getImageData(0, 0, S, S).data })
      } catch { resolve(null) }
    }
    img.src = src
  })
}

/** Up to `n` distinct vibrant colors from a logo (dominant first) — for quick
    brand-color swatches. Empty when the logo is greyscale or unreadable. */
export async function logoPalette(src: string, n = 6): Promise<string[]> {
  const px = await loadPixels(src)
  if (!px) return []
  const { data } = px
  const buckets: Record<number, { r: number; g: number; b: number; c: number; sat: number }> = {}
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3]
    if (a < 128) continue
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b)
    const sat = mx === 0 ? 0 : (mx - mn) / mx
    const light = (mx + mn) / 510
    if (sat < 0.2 || light < 0.12 || light > 0.93) continue
    const key = ((r >> 5) << 6) | ((g >> 5) << 3) | (b >> 5)
    const bk = buckets[key] || (buckets[key] = { r: 0, g: 0, b: 0, c: 0, sat: 0 })
    bk.r += r; bk.g += g; bk.b += b; bk.c++; bk.sat += sat
  }
  return Object.values(buckets)
    .sort((a, b) => b.c * (0.5 + b.sat / b.c) - a.c * (0.5 + a.sat / a.c))
    .slice(0, n)
    .map((bk) => toHex(bk.r / bk.c, bk.g / bk.c, bk.b / bk.c))
}

export function dominantColor(src: string): Promise<string | null> {
  return new Promise((resolve) => {
    if (!src) { resolve(null); return }
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onerror = () => resolve(null)
    img.onload = () => {
      try {
        const S = 40
        const c = document.createElement('canvas')
        c.width = S; c.height = S
        const ctx = c.getContext('2d')
        if (!ctx) { resolve(null); return }
        ctx.drawImage(img, 0, 0, S, S)
        const { data } = ctx.getImageData(0, 0, S, S)
        const buckets: Record<number, { r: number; g: number; b: number; n: number; sat: number }> = {}
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3]
          if (a < 128) continue
          const mx = Math.max(r, g, b), mn = Math.min(r, g, b)
          const sat = mx === 0 ? 0 : (mx - mn) / mx
          const light = (mx + mn) / 510          // 0..1
          if (sat < 0.2) continue                 // skip greys / near-neutral
          if (light < 0.12 || light > 0.93) continue  // skip near-black / near-white
          const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4)
          const bk = buckets[key] || (buckets[key] = { r: 0, g: 0, b: 0, n: 0, sat: 0 })
          bk.r += r; bk.g += g; bk.b += b; bk.n++; bk.sat += sat
        }
        let best: { r: number; g: number; b: number; n: number; sat: number } | null = null
        let bestScore = -1
        for (const k in buckets) {
          const bk = buckets[k]
          const score = bk.n * (0.5 + bk.sat / bk.n)   // frequent AND vibrant
          if (score > bestScore) { bestScore = score; best = bk }
        }
        if (!best) { resolve(null); return }
        const h = (x: number) => Math.round(x / best!.n).toString(16).padStart(2, '0')
        resolve('#' + h(best.r) + h(best.g) + h(best.b))
      } catch { resolve(null) }
    }
    img.src = src
  })
}
