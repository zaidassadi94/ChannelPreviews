import { useStudio } from '@/store/useStudio'
import { Icon } from '@/lib/icons'
import type { SectionDef } from '@/channels/registry'
import { ImageField } from '@/shell/ImageField'
import { BackdropField } from '@/shell/BackdropField'
import { WEBPUSH_TEMPLATES, WEBPUSH_OPTIN_TEMPLATES, applyWebpushTemplate } from './templates'

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
      <p className="panel-hint" style={{ marginTop: 18 }}><b>Permission opt-in</b> — the "Allow notifications?" ask, shown before the first notification. Fine-tune the wording under <b>Opt-in</b>.</p>
      <div className="tpl-grid">
        {WEBPUSH_OPTIN_TEMPLATES.map((t, i) => (
          <button key={i} className="tpl" onClick={() => applyWebpushTemplate(t)}>
            <span className="ti">{t.icon}</span>
            <span className="tc"><span className="tt">{t.name}{t.flow && <span className="flow">FLOW</span>}</span><span className="td">{t.desc}</span></span>
          </button>
        ))}
      </div>
      <button className="btn ghost block" style={{ marginTop: 12 }} onClick={() => setWebpush({ mode: 'notification', title: 'New notification', body: 'Your message here.', image: '', actions: '' })}>{Icon.refresh}Clear &amp; start blank</button>
    </>
  )
}

function OptinPanel() {
  const w = useStudio((s) => s.webpush)
  const setWebpush = useStudio((s) => s.setWebpush)
  const styles: [string, string][] = [['native', 'Native prompt'], ['twostep', 'Two-step (soft)']]
  return (
    <>
      <div className="toggle-row"><span>Show opt-in prompt in preview</span>
        <label className="switch"><input type="checkbox" checked={w.mode === 'optin'} onChange={(e) => setWebpush({ mode: e.target.checked ? 'optin' : 'notification' })} /><span className="slider" /></label>
      </div>
      <div className="field"><span>Style</span>
        <div className="seg-in">{styles.map(([v, l]) => <button key={v} className={w.optinStyle === v ? 'on' : ''} onClick={() => setWebpush({ mode: 'optin', optinStyle: v })}>{l}</button>)}</div>
      </div>
      {w.optinStyle === 'native'
        ? <p className="panel-hint">The browser's own Allow / Block prompt — the wording is set by the browser, so only the site name shows. Use <b>Two-step</b> to ask in your own words first.</p>
        : (
          <>
            <p className="panel-hint">A branded pre-permission ask shown <i>before</i> the native prompt — the recommended two-step opt-in.</p>
            <label className="field"><span>Title</span><input type="text" value={w.optinTitle} onChange={(e) => setWebpush({ optinTitle: e.target.value })} /></label>
            <label className="field"><span>Body</span><textarea value={w.optinBody} onChange={(e) => setWebpush({ optinBody: e.target.value })} /></label>
            <div className="mc-row">
              <label className="field"><span>Allow button</span><input type="text" value={w.optinAllow} onChange={(e) => setWebpush({ optinAllow: e.target.value })} /></label>
              <label className="field"><span>Dismiss button</span><input type="text" value={w.optinDeny} onChange={(e) => setWebpush({ optinDeny: e.target.value })} /></label>
            </div>
          </>
        )}
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
      <div className="field"><span>Large image (optional)</span><ImageField pick value={w.image} onChange={(v) => setWebpush({ image: v })} /></div>
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
  return (
    <>
      <label className="field"><span>Site / brand name</span><input type="text" value={w.site} onChange={(e) => setWebpush({ site: e.target.value })} /></label>
      <label className="field"><span>Site URL (shown in the notification)</span><input type="text" value={w.url} onChange={(e) => setWebpush({ url: e.target.value })} /></label>
      <div className="field"><span>Site icon</span><ImageField value={w.logo || ''} onChange={(v) => setWebpush({ logo: v || null })} placeholder="or paste an icon URL (blank = monogram)" /></div>
    </>
  )
}

function BackdropPanel() {
  const w = useStudio((s) => s.webpush)
  const setWebpush = useStudio((s) => s.setWebpush)
  const modes: [string, string][] = [['branded', 'Branded'], ['upload', 'Upload'], ['neutral', 'Neutral']]
  return (
    <>
      <p className="panel-hint">The page behind the notification won't be your customer's real site — pick how to handle it, just like Onsite &amp; In-App.</p>
      <div className="field"><span>Background</span>
        <div className="seg-in">{modes.map(([v, l]) => <button key={v} className={w.bg === v ? 'on' : ''} onClick={() => setWebpush({ bg: v })}>{l}</button>)}</div>
      </div>
      {w.bg === 'upload' && <div className="field"><span>Your site backdrop</span><BackdropField value={w.bgImage} onChange={(v) => setWebpush({ bgImage: v })} /></div>}
      <div className="toggle-row"><span>Dim &amp; blur the page</span><label className="switch"><input type="checkbox" checked={w.blur} onChange={(e) => setWebpush({ blur: e.target.checked })} /><span className="slider" /></label></div>
    </>
  )
}

export const webpushSections: SectionDef[] = [
  { id: 'templates', label: 'Presets', icon: Icon.templates, Panel: TemplatesPanel },
  { id: 'notification', label: 'Notification', icon: Icon.convo, Panel: NotificationPanel },
  { id: 'actions', label: 'Actions', icon: Icon.templates, Panel: ActionsPanel },
  { id: 'optin', label: 'Opt-in', icon: Icon.context, Panel: OptinPanel },
  { id: 'backdrop', label: 'Backdrop', icon: Icon.context, Panel: BackdropPanel },
  { id: 'site', label: 'Site', icon: Icon.sender, Panel: SitePanel },
]
