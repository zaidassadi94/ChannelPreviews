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
async function grab(background: string, toast: (m: string) => void): Promise<HTMLCanvasElement | null> {
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
    return await html2canvas(node, {
      backgroundColor: background,
      scale: 2,
      useCORS: true,
      allowTaint: false,
      logging: false,
    })
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
    const canvas = await grab('#eef0f6', show)
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
    const canvas = await grab('#eef0f6', show)
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
