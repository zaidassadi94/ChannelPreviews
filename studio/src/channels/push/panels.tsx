import { useStudio } from '@/store/useStudio'
import { Icon } from '@/lib/icons'
import type { SectionDef } from '@/channels/registry'
import { WALLS } from '@/channels/notify/shared'
import { PUSH_TEMPLATES, applyPushTemplate } from './templates'

function TemplatesPanel() {
  const setPush = useStudio((s) => s.setPush)
  return (
    <>
      <p className="panel-hint">Ready-made push notifications. Ones tagged <b>FLOW</b> have tappable actions in Simulate.</p>
      <div className="tpl-grid">
        {PUSH_TEMPLATES.map((t, i) => (
          <button key={i} className="tpl" onClick={() => applyPushTemplate(t)}>
            <span className="ti">{t.icon}</span>
            <span className="tc"><span className="tt">{t.name}{t.flow && <span className="flow">FLOW</span>}</span><span className="td">{t.desc}</span></span>
          </button>
        ))}
      </div>
      <button className="btn ghost block" style={{ marginTop: 12 }} onClick={() => setPush({ title: 'New notification', body: 'Your message here.', image: '', actions: '' })}>{Icon.refresh}Clear &amp; start blank</button>
    </>
  )
}

function NotificationPanel() {
  const push = useStudio((s) => s.notify.push)
  const expanded = useStudio((s) => s.notify.expanded)
  const setPush = useStudio((s) => s.setPush)
  const setNotify = useStudio((s) => s.setNotify)
  return (
    <>
      <label className="field"><span>Title (bold line)</span><input type="text" value={push.title} onChange={(e) => setPush({ title: e.target.value })} /></label>
      <label className="field"><span>Body</span><textarea value={push.body} onChange={(e) => setPush({ body: e.target.value })} /></label>
      <label className="field"><span>Big image URL (shows when expanded)</span><input type="text" value={push.image} onChange={(e) => setPush({ image: e.target.value })} /></label>
      <label className="field"><span>Timestamp</span><input type="text" value={push.time} onChange={(e) => setPush({ time: e.target.value })} /></label>
      <div className="toggle-row"><span>Expanded (rich / big picture)</span>
        <label className="switch"><input type="checkbox" checked={expanded} onChange={(e) => setNotify({ expanded: e.target.checked })} /><span className="slider" /></label>
      </div>
    </>
  )
}

function ActionsPanel() {
  const push = useStudio((s) => s.notify.push)
  const setPush = useStudio((s) => s.setPush)
  const rows = (push.actions || '').split('\n').map((s) => s.trim()).filter(Boolean)
  const commit = (r: string[]) => setPush({ actions: r.join('\n') })
  return (
    <>
      <p className="panel-hint">Up to 3 buttons. They show when the notification is <b>expanded</b>.</p>
      {rows.map((r, i) => (
        <div className="msg-card" key={i} style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
          <input type="text" value={r} onChange={(e) => { const n = rows.slice(); n[i] = e.target.value; commit(n) }} placeholder="e.g. Shop now" />
          <button className="icobtn" title="Delete" onClick={() => commit(rows.filter((_, j) => j !== i))}>✕</button>
        </div>
      ))}
      {rows.length < 3 && <div className="addmsg"><button onClick={() => commit([...rows, 'Open'])}>+ Add button</button></div>}
    </>
  )
}

function SurfacePanel() {
  const device = useStudio((s) => s.device)
  const surface = useStudio((s) => s.notify.surface)
  const wallpaper = useStudio((s) => s.notify.wallpaper)
  const setNotify = useStudio((s) => s.setNotify)
  const opts: [string, string][] = device === 'ios' ? [['lock', 'Lock Screen'], ['banner', 'Banner']] : [['heads', 'Heads-up'], ['shade', 'Shade']]
  const showWall = (device === 'ios' && surface === 'lock') || (device === 'android' && surface === 'shade')
  return (
    <>
      <div className="field"><span>Surface</span>
        <div className="seg-in">{opts.map(([v, l]) => <button key={v} className={surface === v ? 'on' : ''} onClick={() => setNotify({ surface: v })}>{l}</button>)}</div>
      </div>
      {showWall && (
        <div className="field"><span>Wallpaper (behind the notification)</span>
          <div className="wp-grid">{Object.keys(WALLS).map((k) => <div key={k} className={'wp' + (wallpaper === k ? ' on' : '')} style={{ background: WALLS[k] }} onClick={() => setNotify({ wallpaper: k })} />)}</div>
        </div>
      )}
    </>
  )
}

function AppPanel() {
  const appName = useStudio((s) => s.notify.appName)
  const appLogo = useStudio((s) => s.notify.appLogo)
  const setNotify = useStudio((s) => s.setNotify)
  return (
    <>
      <label className="field"><span>App name</span><input type="text" value={appName} onChange={(e) => setNotify({ appName: e.target.value })} /></label>
      <label className="field"><span>App icon URL (blank = monogram)</span><input type="text" value={appLogo || ''} onChange={(e) => setNotify({ appLogo: e.target.value || null })} /></label>
    </>
  )
}

export const pushSections: SectionDef[] = [
  { id: 'templates', label: 'Templates', icon: Icon.templates, Panel: TemplatesPanel },
  { id: 'notification', label: 'Notification', icon: Icon.convo, Panel: NotificationPanel },
  { id: 'actions', label: 'Actions', icon: Icon.templates, Panel: ActionsPanel },
  { id: 'surface', label: 'Surface', icon: Icon.context, Panel: SurfacePanel },
  { id: 'app', label: 'App', icon: Icon.sender, Panel: AppPanel },
]
