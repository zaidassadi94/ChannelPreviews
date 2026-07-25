import { useStudio } from '@/store/useStudio'
import { Icon } from '@/lib/icons'
import type { SectionDef } from '@/channels/registry'
import { WEBPUSH_TEMPLATES, applyWebpushTemplate } from './templates'

function TemplatesPanel() {
  const setWebpush = useStudio((s) => s.setWebpush)
  return (
    <>
      <p className="panel-hint">Ready-made browser notifications. Ones tagged <b>FLOW</b> have clickable buttons in Simulate.</p>
      <div className="tpl-grid">
        {WEBPUSH_TEMPLATES.map((t, i) => (
          <button key={i} className="tpl" onClick={() => applyWebpushTemplate(t)}>
            <span className="ti">{t.icon}</span>
            <span className="tc"><span className="tt">{t.name}{t.flow && <span className="flow">FLOW</span>}</span><span className="td">{t.desc}</span></span>
          </button>
        ))}
      </div>
      <button className="btn ghost block" style={{ marginTop: 12 }} onClick={() => setWebpush({ title: 'New notification', body: 'Your message here.', image: '', actions: '' })}>{Icon.refresh}Clear &amp; start blank</button>
    </>
  )
}

function NotificationPanel() {
  const w = useStudio((s) => s.webpush)
  const setWebpush = useStudio((s) => s.setWebpush)
  return (
    <>
      <label className="field"><span>Title (bold line)</span><input type="text" value={w.title} onChange={(e) => setWebpush({ title: e.target.value })} /></label>
      <label className="field"><span>Body</span><textarea value={w.body} onChange={(e) => setWebpush({ body: e.target.value })} /></label>
      <label className="field"><span>Image URL (large image, optional)</span><input type="text" value={w.image} onChange={(e) => setWebpush({ image: e.target.value })} /></label>
    </>
  )
}

function ActionsPanel() {
  const w = useStudio((s) => s.webpush)
  const setWebpush = useStudio((s) => s.setWebpush)
  const rows = (w.actions || '').split('\n').map((s) => s.trim()).filter(Boolean)
  const commit = (r: string[]) => setWebpush({ actions: r.join('\n') })
  return (
    <>
      <p className="panel-hint">Up to 2 buttons, shown under the notification.</p>
      {rows.map((r, i) => (
        <div className="msg-card" key={i} style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
          <input type="text" value={r} onChange={(e) => { const n = rows.slice(); n[i] = e.target.value; commit(n) }} placeholder="e.g. Shop now" />
          <button className="icobtn" title="Delete" onClick={() => commit(rows.filter((_, j) => j !== i))}>✕</button>
        </div>
      ))}
      {rows.length < 2 && <div className="addmsg"><button onClick={() => commit([...rows, 'Open'])}>+ Add button</button></div>}
    </>
  )
}

function SitePanel() {
  const w = useStudio((s) => s.webpush)
  const setWebpush = useStudio((s) => s.setWebpush)
  const os: [string, string][] = [['mac', 'macOS'], ['windows', 'Windows']]
  return (
    <>
      <div className="field"><span>Operating system (notification style)</span>
        <div className="seg-in">{os.map(([v, l]) => <button key={v} className={w.os === v ? 'on' : ''} onClick={() => setWebpush({ os: v })}>{l}</button>)}</div>
      </div>
      <label className="field"><span>Site / brand name</span><input type="text" value={w.site} onChange={(e) => setWebpush({ site: e.target.value })} /></label>
      <label className="field"><span>Site URL (shown in the notification)</span><input type="text" value={w.url} onChange={(e) => setWebpush({ url: e.target.value })} /></label>
      <label className="field"><span>Site icon URL (blank = monogram)</span><input type="text" value={w.logo || ''} onChange={(e) => setWebpush({ logo: e.target.value || null })} /></label>
    </>
  )
}

export const webpushSections: SectionDef[] = [
  { id: 'templates', label: 'Templates', icon: Icon.templates, Panel: TemplatesPanel },
  { id: 'notification', label: 'Notification', icon: Icon.convo, Panel: NotificationPanel },
  { id: 'actions', label: 'Actions', icon: Icon.templates, Panel: ActionsPanel },
  { id: 'site', label: 'Site', icon: Icon.sender, Panel: SitePanel },
]
