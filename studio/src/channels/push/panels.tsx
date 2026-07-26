import { useStudio } from '@/store/useStudio'
import { Icon } from '@/lib/icons'
import type { SectionDef } from '@/channels/registry'
import { WALLS } from '@/channels/notify/shared'
import { PUSH_TEMPLATES, PUSH_OPTIN_TEMPLATES, applyPushTemplate } from './templates'

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
      <p className="panel-hint" style={{ marginTop: 18 }}><b>Permission opt-in</b> — the "Allow notifications?" ask, shown before the first push. Fine-tune the wording under <b>Opt-in</b>.</p>
      <div className="tpl-grid">
        {PUSH_OPTIN_TEMPLATES.map((t, i) => (
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

function OptinPanel() {
  const device = useStudio((s) => s.device)
  const n = useStudio((s) => s.notify)
  const setNotify = useStudio((s) => s.setNotify)
  const showing = n.surface === 'optin'
  const styles: [string, string][] = [['native', device === 'ios' ? 'iOS system' : 'Android system'], ['twostep', 'Two-step (soft)']]
  return (
    <>
      <div className="toggle-row"><span>Show opt-in prompt in preview</span>
        <label className="switch"><input type="checkbox" checked={showing} onChange={(e) => setNotify({ surface: e.target.checked ? 'optin' : (device === 'ios' ? 'lock' : 'heads') })} /><span className="slider" /></label>
      </div>
      <div className="field"><span>Style</span>
        <div className="seg-in">{styles.map(([v, l]) => <button key={v} className={n.optinStyle === v ? 'on' : ''} onClick={() => setNotify({ surface: 'optin', optinStyle: v })}>{l}</button>)}</div>
      </div>
      {n.optinStyle === 'native'
        ? <p className="panel-hint">The operating system's own permission alert — its wording and buttons are fixed by iOS / Android, so only the app name shows. Use <b>Two-step</b> to ask in your own words first.</p>
        : (
          <>
            <p className="panel-hint">A branded pre-permission ask shown <i>before</i> the system alert — the recommended two-step opt-in.</p>
            <label className="field"><span>Title</span><input type="text" value={n.optinTitle} onChange={(e) => setNotify({ optinTitle: e.target.value })} /></label>
            <label className="field"><span>Body</span><textarea value={n.optinBody} onChange={(e) => setNotify({ optinBody: e.target.value })} /></label>
            <div className="mc-row">
              <label className="field"><span>Allow button</span><input type="text" value={n.optinAllow} onChange={(e) => setNotify({ optinAllow: e.target.value })} /></label>
              <label className="field"><span>Dismiss button</span><input type="text" value={n.optinDeny} onChange={(e) => setNotify({ optinDeny: e.target.value })} /></label>
            </div>
          </>
        )}
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
  { id: 'optin', label: 'Opt-in', icon: Icon.context, Panel: OptinPanel },
  { id: 'app', label: 'App', icon: Icon.sender, Panel: AppPanel },
]
