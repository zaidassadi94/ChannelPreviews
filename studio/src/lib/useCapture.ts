import html2canvas from 'html2canvas'
import { useStudio } from '@/store/useStudio'
import { useToast } from '@/store/useToast'

/** Rasterise the active #capture frame to a canvas.
 *
 *  Two studio-specific quirks vs the root `device.js`:
 *   1. <StageFit> puts its `scale(...)` on the PARENT `.stage-fit`, not on `#capture`,
 *      so we neutralise the *ancestor* transform (the root scaled the node itself).
 *   2. Simulate chrome (`.sim-on` ring on `.stage`, the `.sim-badge`) is hidden for a
 *      clean export, then restored.
 *  Everything is restored in `finally` so the on-screen view is untouched.
 */
/** Clip a rendered canvas to the frame's own rounded-rectangle so the export is
    exactly the device/desktop shape (transparent outside the corners), instead
    of a rectangle with the corners filled in. Radius is read from the captured
    node and scaled to canvas pixels. */
function roundToFrame(src: HTMLCanvasElement, node: HTMLElement): HTMLCanvasElement {
  const cs = getComputedStyle(node)
  const cssRadius = parseFloat(cs.borderTopLeftRadius) || 0
  if (cssRadius <= 0) return src
  const scale = src.width / (node.offsetWidth || src.width)
  const r = Math.min(cssRadius * scale, src.width / 2, src.height / 2)
  const out = document.createElement('canvas')
  out.width = src.width; out.height = src.height
  const ctx = out.getContext('2d')
  if (!ctx) return src
  const w = out.width, h = out.height
  ctx.beginPath()
  ctx.moveTo(r, 0)
  ctx.arcTo(w, 0, w, h, r)
  ctx.arcTo(w, h, 0, h, r)
  ctx.arcTo(0, h, 0, 0, r)
  ctx.arcTo(0, 0, w, 0, r)
  ctx.closePath()
  ctx.clip()
  ctx.drawImage(src, 0, 0)
  return out
}

async function grab(toast: (m: string) => void): Promise<HTMLCanvasElement | null> {
  const node = document.getElementById('capture') as HTMLElement | null
  if (!node) { toast('Nothing to capture yet'); return null }

  const fit = node.closest('.stage-fit') as HTMLElement | null
  const stage = node.closest('.stage') as HTMLElement | null
  const savedFit = fit ? fit.style.transform : ''
  if (fit) fit.style.transform = 'none'

  const wasSim = !!stage && stage.classList.contains('sim-on')
  if (wasSim && stage) stage.classList.remove('sim-on')
  const badge = node.querySelector('.sim-badge') as HTMLElement | null
  const savedBadge = badge ? badge.style.display : ''
  if (badge) badge.style.display = 'none'

  try {
    // Transparent background → the frame's rounded corners aren't filled in;
    // roundToFrame then clips to the exact device shape.
    const raw = await html2canvas(node, {
      backgroundColor: null,
      scale: 2,
      useCORS: true,
      allowTaint: false,
      logging: false,
    })
    return roundToFrame(raw, node)
  } catch (err) {
    console.error('[capture]', err)
    toast('Could not render the image — try again')
    return null
  } finally {
    if (fit) fit.style.transform = savedFit
    if (wasSim && stage) stage.classList.add('sim-on')
    if (badge) badge.style.display = savedBadge
  }
}

/** TopBar Copy/Export handlers. Both rasterise #capture; the studio ships `data:` `phImg`
 *  imagery by default so the canvas is CORS-clean offline (real Pexels photos, feature 4,
 *  add `useCORS`). Works in the artifact preview too — html2canvas bundles (no CDN). */
export function useCapture() {
  const show = useToast((s) => s.show)
  const channel = useStudio((s) => s.channel)
  const device = useStudio((s) => s.device)
  const ctx = useStudio((s) => s.sub || s.industry)

  const filename = () => `${channel}-${ctx}-${device}.png`

  const onExport = async () => {
    const canvas = await grab(show)
    if (!canvas) return
    const a = document.createElement('a')
    a.href = canvas.toDataURL('image/png')
    a.download = filename()
    document.body.appendChild(a)
    a.click()
    a.remove()
    show('PNG exported')
  }

  const onCopy = async () => {
    if (typeof ClipboardItem === 'undefined' || !navigator.clipboard || !navigator.clipboard.write) {
      show('Clipboard image copy unavailable — use Export')
      return
    }
    const canvas = await grab(show)
    if (!canvas) return
    canvas.toBlob(async (blob) => {
      if (!blob) { show('Copy failed — use Export'); return }
      try {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
        show('Copied to clipboard')
      } catch (err) {
        console.error('[copy]', err)
        show('Copy blocked by the browser — use Export')
      }
    }, 'image/png')
  }

  return { onExport, onCopy }
}
