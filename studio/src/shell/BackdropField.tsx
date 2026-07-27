import { useRef, useState } from 'react'
import { fileToBackdrop, captureSite, normSite } from '@/lib/backdrop'

/** Shared "Upload" control for the Onsite / In-App / Web Push page backdrop:
 *  drop or browse for a screenshot image, OR type a website URL and capture it.
 *  The value it emits is always a data: URL (or a pasted image URL) that the
 *  channel stores as its bgImage. Auto-capture is best-effort; upload is the
 *  reliable fallback. */
export function BackdropField({ value, onChange, siteUrl = '', noun = 'site' }: {
  value: string
  onChange: (v: string) => void
  siteUrl?: string
  noun?: string
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [url, setUrl] = useState(normSite(siteUrl))
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [drag, setDrag] = useState(false)

  async function onFile(file?: File | null) {
    if (!file) return
    setErr('')
    try { onChange(await fileToBackdrop(file)) }
    catch { setErr('Could not read that image file.') }
  }

  async function onCapture() {
    const site = normSite(url)
    if (!site || site.indexOf('.') < 1) { setErr(`Enter a ${noun} address like ${noun}.com`); return }
    setBusy(true); setErr('')
    const shot = await captureSite(site)
    setBusy(false)
    if (shot) onChange(shot)
    else setErr('Couldn’t capture that page — upload a screenshot instead.')
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
          ? <img className="bgf-thumb" src={value} alt="Chosen backdrop" />
          : <span className="bgf-hint">Drop a screenshot here, or <u>browse</u></span>}
        <input ref={fileRef} type="file" accept="image/*" hidden
          onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = '' }} />
      </div>
      {value && <button className="bgf-clear" type="button" onClick={() => onChange('')}>Remove image</button>}

      <div className="bgf-or"><span>or capture from a URL</span></div>
      <div className="bgf-cap">
        <input type="text" value={url} placeholder={`${noun}.com`}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') onCapture() }} />
        <button className="btn ghost" type="button" disabled={busy} onClick={onCapture}>
          {busy ? 'Capturing…' : 'Capture'}
        </button>
      </div>
      {err && <p className="bgf-err">{err}</p>}
      <p className="panel-hint" style={{ marginTop: 8 }}>
        Auto-capture is best-effort — cookie banners or login walls can block it. Uploading a screenshot always works.
      </p>
    </div>
  )
}
