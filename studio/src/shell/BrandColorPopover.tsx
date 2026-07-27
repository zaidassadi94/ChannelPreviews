import { useEffect, useRef, useState, type MouseEvent } from 'react'
import { useStudio } from '@/store/useStudio'
import { currentLogo } from '@/lib/useAutoBrandColor'
import { logoPalette } from '@/lib/dominantColor'

const isHex = (c: string) => /^#[0-9a-fA-F]{6}$/.test(c)
const h2 = (n: number) => n.toString(16).padStart(2, '0')

/** Brand-color picker: hex field first (not the OS RGB panel), a system-picker
 *  fallback, plus — when a logo is present — an eyedropper on the logo and its
 *  extracted palette so you can pick the exact brand color from the mark. */
export function BrandColorPopover({ anchor, onClose }: { anchor: DOMRect; onClose: () => void }) {
  const brandColor = useStudio((s) => s.brandColor)
  const setBrandColor = useStudio((s) => s.setBrandColor)
  const resetAuto = useStudio((s) => s.resetBrandColorAuto)
  const logo = useStudio(currentLogo)

  const [hex, setHex] = useState(brandColor)
  const [palette, setPalette] = useState<string[]>([])
  const rootRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => { setHex(brandColor) }, [brandColor])

  useEffect(() => {
    const onDown = (e: PointerEvent) => { if (rootRef.current && !rootRef.current.contains(e.target as Node)) onClose() }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('pointerdown', onDown); document.removeEventListener('keydown', onKey) }
  }, [onClose])

  // Draw the logo for the eyedropper + pull its palette.
  useEffect(() => {
    if (!logo) { setPalette([]); return }
    let alive = true
    logoPalette(logo, 6).then((p) => { if (alive) setPalette(p) })
    const cv = canvasRef.current
    if (cv) {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        const ctx = cv.getContext('2d'); if (!ctx) return
        ctx.clearRect(0, 0, cv.width, cv.height)
        const s = Math.min(cv.width / img.width, cv.height / img.height)
        const w = img.width * s, h = img.height * s
        ctx.drawImage(img, (cv.width - w) / 2, (cv.height - h) / 2, w, h)
      }
      img.src = logo
    }
    return () => { alive = false }
  }, [logo])

  const pickFromCanvas = (e: MouseEvent<HTMLCanvasElement>) => {
    const cv = canvasRef.current; if (!cv) return
    const ctx = cv.getContext('2d'); if (!ctx) return
    const r = cv.getBoundingClientRect()
    const x = Math.round((e.clientX - r.left) * (cv.width / r.width))
    const y = Math.round((e.clientY - r.top) * (cv.height / r.height))
    const d = ctx.getImageData(Math.max(0, Math.min(cv.width - 1, x)), Math.max(0, Math.min(cv.height - 1, y)), 1, 1).data
    if (d[3] < 8) return
    setBrandColor('#' + h2(d[0]) + h2(d[1]) + h2(d[2]))
  }

  const commitHex = (v: string) => {
    if (v && v[0] !== '#') v = '#' + v
    setHex(v)
    if (isHex(v)) setBrandColor(v)
  }

  const style = { left: Math.round(anchor.right + 8), bottom: Math.round(window.innerHeight - anchor.bottom) }
  return (
    <div className="bcpop" ref={rootRef} style={style}>
      <div className="bcpop-row">
        <span className="bcpop-sw" style={{ background: isHex(hex) ? hex : brandColor }} />
        <input className="bcpop-hex" value={hex} spellCheck={false} maxLength={7} placeholder="#635bff"
          onChange={(e) => commitHex(e.target.value.trim())} aria-label="Brand color hex" />
        <label className="bcpop-native" title="System color picker">
          <input type="color" value={isHex(brandColor) ? brandColor : '#635bff'} onChange={(e) => setBrandColor(e.target.value)} />
          <span aria-hidden>🎨</span>
        </label>
      </div>

      {logo ? (
        <div className="bcpop-logo">
          <div className="bcpop-cap">Pick from your logo</div>
          <canvas ref={canvasRef} width={168} height={92} className="bcpop-canvas" onClick={pickFromCanvas} title="Click the logo to sample a color" />
          {palette.length > 0 && (
            <div className="bcpop-swatches">
              {palette.map((c, i) => <button key={i} type="button" className="bcpop-chip" style={{ background: c }} title={c} onClick={() => setBrandColor(c)} />)}
            </div>
          )}
        </div>
      ) : <div className="bcpop-cap">Add a logo (Sender / Site) to pick a color from it.</div>}

      <button type="button" className="bcpop-auto" onClick={() => { resetAuto(); onClose() }}>↺ Auto-match logo</button>
    </div>
  )
}
