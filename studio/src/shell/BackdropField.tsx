import { useRef, useState } from 'react'
import { fileToBackdrop } from '@/lib/backdrop'

/** Shared "Upload" control for the Onsite / In-App / Web Push page backdrop:
 *  drop or browse for a screenshot image. The value it emits is a data: URL the
 *  channel stores as its bgImage. */
export function BackdropField({ value, onChange }: {
  value: string
  onChange: (v: string) => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [err, setErr] = useState('')
  const [drag, setDrag] = useState(false)

  async function onFile(file?: File | null) {
    if (!file) return
    setErr('')
    try { onChange(await fileToBackdrop(file)) }
    catch { setErr('Could not read that image file.') }
  }

  return (
    <div className="bgf">
      <div
        className={'bgf-drop' + (drag ? ' over' : '') + (value ? ' has' : '')}
        onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); onFile(e.dataTransfer.files?.[0]) }}
        onClick={() => fileRef.current?.click()}
        role="button" tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileRef.current?.click() } }}
        aria-label="Upload a screenshot image"
      >
        {value
          ? <><img className="bgf-thumb" src={value} alt="Chosen backdrop" /><span className="imgf-replace">Click or drop to replace</span></>
          : <span className="bgf-hint">Drop a screenshot here, or <u>browse</u></span>}
        <input ref={fileRef} type="file" accept="image/*" hidden
          onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = '' }} />
      </div>
      {value && (
        <div className="imgf-actions">
          <button type="button" className="imgf-act" onClick={() => fileRef.current?.click()}>Upload new</button>
          <button type="button" className="imgf-act muted" onClick={() => onChange('')}>Remove</button>
        </div>
      )}
      {err && <p className="bgf-err">{err}</p>}
      <p className="panel-hint" style={{ marginTop: 8 }}>
        Grab a screenshot of your site (or any page) and drop it in — it becomes the backdrop behind the message.
      </p>
    </div>
  )
}
