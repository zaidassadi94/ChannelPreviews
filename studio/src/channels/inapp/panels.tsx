import { useStudio } from '@/store/useStudio'
import { Icon } from '@/lib/icons'
import type { SectionDef } from '@/channels/registry'
import { ImageField } from '@/shell/ImageField'
import { BackdropField } from '@/shell/BackdropField'
import { INAPP_TEMPLATES, applyInappTemplate } from './templates'

const IATYPES: [string, string][] = [['modal', 'Modal'], ['banner', 'Banner'], ['full', 'Full'], ['sheet', 'Sheet'], ['image', 'Image']]

interface Cta { label: string; style: string }
const parseCtas = (v: string): Cta[] => (v || '').split('\n').map((l) => l.trim()).filter(Boolean).map((l) => {
  const p = l.split('|').map((x) => x.trim()); let st = (p[1] || 'primary').toLowerCase()
  if (!['primary', 'secondary', 'text'].includes(st)) st = 'primary'
  return { label: p[0] || '', style: st }
})
const serCtas = (rows: Cta[]) => rows.map((r) => `${r.label || ''} | ${r.style || 'primary'}`).join('\n')

function TemplatesPanel() {
  const setInapp = useStudio((s) => s.setInapp)
  return (
    <>
      <p className="panel-hint">Ready-made in-app messages. Ones tagged <b>FLOW</b> have tappable CTAs in Simulate.</p>
      <div className="tpl-grid">
        {INAPP_TEMPLATES.map((t, i) => (
          <button key={i} className="tpl" onClick={() => applyInappTemplate(t)}>
            <span className="ti">{t.icon}</span>
            <span className="tc"><span className="tt">{t.name}{t.flow && <span className="flow">FLOW</span>}</span><span className="td">{t.desc}</span></span>
          </button>
        ))}
      </div>
      <button className="btn ghost block" style={{ marginTop: 12 }} onClick={() => setInapp({ image: '', headline: 'New message', body: 'Your text here.', ctas: 'Got it | primary', close: true })}>{Icon.refresh}Clear &amp; start blank</button>
    </>
  )
}

function ContentPanel() {
  const a = useStudio((s) => s.notify.inapp)
  const setInapp = useStudio((s) => s.setInapp)
  const pickType = (t: string) => {
    if (t === 'banner') setInapp({ type: t, ctas: serCtas(parseCtas(a.ctas).slice(0, 1)) })
    else setInapp({ type: t })
  }
  return (
    <>
      <div className="field"><span>Format</span>
        <div className="seg-in">{IATYPES.map(([v, l]) => <button key={v} className={a.type === v ? 'on' : ''} onClick={() => pickType(v)}>{l}</button>)}</div>
        <span className="field-hint">The message template — modal, banner, full-screen, bottom sheet or image-only.</span>
      </div>
      {a.type !== 'banner' && <div className="field"><span>Image</span><ImageField value={a.image} onChange={(v) => setInapp({ image: v })} placeholder="or paste an image URL (blank = placeholder)" /></div>}
      {a.type !== 'image' && <label className="field"><span>Headline</span><input type="text" value={a.headline} onChange={(e) => setInapp({ headline: e.target.value })} /></label>}
      {a.type !== 'image' && <label className="field"><span>Body</span><textarea value={a.body} onChange={(e) => setInapp({ body: e.target.value })} /></label>}
      <div className="toggle-row"><span>Close (✕) button</span>
        <label className="switch"><input type="checkbox" checked={a.close} onChange={(e) => setInapp({ close: e.target.checked })} /><span className="slider" /></label>
      </div>
    </>
  )
}

function ButtonsPanel() {
  const a = useStudio((s) => s.notify.inapp)
  const setInapp = useStudio((s) => s.setInapp)
  if (a.type === 'image') return <p className="panel-hint">The image-only creative has no buttons — the whole image is the tap target.</p>
  const rows = parseCtas(a.ctas)
  const maxC = a.type === 'banner' ? 1 : 2
  const commit = (r: Cta[]) => setInapp({ ctas: serCtas(r) })
  return (
    <>
      <p className="panel-hint">Up to {maxC} CTA{maxC > 1 ? 's' : ''}. Each has a style — <b>primary</b> (filled), <b>secondary</b> (outline) or <b>text</b>.</p>
      {rows.map((row, i) => (
        <div className="msg-card" key={i}>
          <label className="field" style={{ marginBottom: 8 }}><span>Label</span><input type="text" value={row.label} onChange={(e) => { const n = rows.slice(); n[i] = { ...row, label: e.target.value }; commit(n) }} placeholder="e.g. Get started" /></label>
          <div className="mc-top" style={{ marginBottom: 0 }}>
            <select value={row.style} onChange={(e) => { const n = rows.slice(); n[i] = { ...row, style: e.target.value }; commit(n) }}>
              <option value="primary">Primary (filled)</option>
              <option value="secondary">Secondary (outline)</option>
              <option value="text">Text (plain)</option>
            </select>
            <button className="icobtn" title="Delete" onClick={() => commit(rows.filter((_, j) => j !== i))}>✕</button>
          </div>
        </div>
      ))}
      {rows.length < maxC && <div className="addmsg"><button onClick={() => commit([...rows, { label: 'Button', style: rows.length ? 'text' : 'primary' }])}>+ Add CTA</button></div>}
    </>
  )
}

function LayoutPanel() {
  const a = useStudio((s) => s.notify.inapp)
  const appName = useStudio((s) => s.notify.appName)
  const setInapp = useStudio((s) => s.setInapp)
  const setNotify = useStudio((s) => s.setNotify)
  return (
    <>
      {a.type === 'banner' && (
        <div className="field"><span>Banner position</span>
          <div className="seg-in"><button className={a.bannerPos === 'top' ? 'on' : ''} onClick={() => setInapp({ bannerPos: 'top' })}>Top</button><button className={a.bannerPos === 'bottom' ? 'on' : ''} onClick={() => setInapp({ bannerPos: 'bottom' })}>Bottom</button></div>
        </div>
      )}
      <label className="field"><span>App name (backdrop title)</span><input type="text" value={appName} onChange={(e) => setNotify({ appName: e.target.value })} /></label>
    </>
  )
}

function BackgroundPanel() {
  const appBg = useStudio((s) => s.notify.appBg)
  const setAppBg = useStudio((s) => s.setAppBg)
  return (
    <>
      <p className="panel-hint">The app behind the message won't be your customer's real app — pick how to handle it.</p>
      <div className="field"><span>Background</span>
        <div className="seg-in">{[['branded', 'Branded'], ['upload', 'Upload'], ['neutral', 'Neutral']].map(([v, l]) => <button key={v} className={appBg.mode === v ? 'on' : ''} onClick={() => setAppBg({ mode: v })}>{l}</button>)}</div>
      </div>
      {appBg.mode === 'upload' && <div className="field"><span>Your app / site backdrop</span><BackdropField value={appBg.image} onChange={(v) => setAppBg({ image: v })} /></div>}
      <div className="toggle-row"><span>Dim &amp; blur (except banner)</span>
        <label className="switch"><input type="checkbox" checked={appBg.blur} onChange={(e) => setAppBg({ blur: e.target.checked })} /><span className="slider" /></label>
      </div>
    </>
  )
}

export const inappSections: SectionDef[] = [
  { id: 'templates', label: 'Presets', icon: Icon.templates, Panel: TemplatesPanel },
  { id: 'content', label: 'Content', icon: Icon.convo, Panel: ContentPanel },
  { id: 'buttons', label: 'Buttons', icon: Icon.templates, Panel: ButtonsPanel },
  { id: 'layout', label: 'Layout', icon: Icon.context, Panel: LayoutPanel },
  { id: 'background', label: 'Background', icon: Icon.sender, Panel: BackgroundPanel },
]
