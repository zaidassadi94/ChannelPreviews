import { useRef, useState } from 'react'
import { fileToBackdrop } from '@/lib/backdrop'

/** A reusable image input for any content/logo image field: upload (drag-drop or
 *  browse) on top, a URL box below. Uploaded files become a downscaled data:
 *  URL (self-contained, Export/Record-clean); a pasted URL is used as-is. The
 *  URL box is hidden-empty while an uploaded image is showing so a huge data
 *  URI never fills the field. Emits '' when cleared. */
export function ImageField({ value, onChange, placeholder = 'or paste an image URL', max = 1200 }: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  max?: number
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [drag, setDrag] = useState(false)
  const [err, setErr] = useState('')

  async function onFile(file?: File | null) {
    if (!file) return
    setErr('')
    try { onChange(await fileToBackdrop(file, max)) }
    catch { setErr('Could not read that image file.') }
  }

  const isData = value.startsWith('data:')
  return (
    <div className="imgf">
      <div
        className={'imgf-drop' + (drag ? ' over' : '') + (value ? ' has' : '')}
        onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); onFile(e.dataTransfer.files?.[0]) }}
        onClick={() => fileRef.current?.click()}
        role="button" tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileRef.current?.click() } }}
        aria-label="Upload an image"
      >
        {value
          ? <><img className="imgf-thumb" src={value} alt="" /><span className="imgf-replace">Click or drop to replace</span></>
          : <span className="imgf-hint">Upload or drop an image</span>}
        <input ref={fileRef} type="file" accept="image/*" hidden
          onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = '' }} />
      </div>
      {value && (
        <div className="imgf-actions">
          <button type="button" className="imgf-act" onClick={() => fileRef.current?.click()}>Upload new</button>
          <button type="button" className="imgf-act muted" onClick={() => onChange('')}>Remove</button>
        </div>
      )}
      <input type="text" className="imgf-url" placeholder={placeholder}
        value={isData ? '' : value} onChange={(e) => onChange(e.target.value)} />
      {err && <p className="bgf-err">{err}</p>}
    </div>
  )
}
