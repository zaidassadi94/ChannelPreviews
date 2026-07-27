/* Backdrop image helper for the Onsite / In-App / Web Push page backgrounds.
 * Reads a dropped/selected image file into a downscaled data: URL (canvas,
 * JPEG) so the mockup stays self-contained and Export/Record-clean, with no
 * runtime network on the render path. */

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
