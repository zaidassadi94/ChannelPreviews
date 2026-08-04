import { useStudio } from '@/store/useStudio'
import { Icon } from '@/lib/icons'
import type { SectionDef } from '@/channels/registry'
import { ImageField } from '@/shell/ImageField'
import { BackdropField } from '@/shell/BackdropField'
import { avColor } from '@/lib/util'
import { OSM_TEMPLATES, applyOsmTemplate } from './templates'

const FORMATS: [string, string][] = [['popup', 'Popup'], ['bannerTop', 'Banner — top'], ['bannerBottom', 'Banner — bottom'], ['nudge', 'Nudge (slide-in)'], ['full', 'Full screen'], ['survey', 'Survey / Feedback']]

function TemplatesPanel() {
  const setOsm = useStudio((s) => s.setOsm)
  return (
    <>
      <p className="panel-hint">Onsite web messages. Picking one sets the right <b>format</b>. Ones tagged <b>FLOW</b> are interactive in Simulate.</p>
      <div className="tpl-grid">
        {OSM_TEMPLATES.map((t, i) => (
          <button key={i} className="tpl" onClick={() => applyOsmTemplate(t)}>
            <span className="ti">{t.icon}</span>
            <span className="tc"><span className="tt">{t.name}{t.flow && <span className="flow">FLOW</span>}</span><span className="td">{t.desc}</span></span>
          </button>
        ))}
      </div>
      <button className="btn ghost block" style={{ marginTop: 12 }} onClick={() => setOsm({ headline: 'Your headline', body: 'Your message goes here.', image: '', cta: 'Get started', cta2: '', code: '', input: false, countdown: '' })}>{Icon.refresh}Clear &amp; start blank</button>
    </>
  )
}

function FormatPanel() {
  const o = useStudio((s) => s.osm)
  const setOsm = useStudio((s) => s.setOsm)
  return (
    <>
      <label className="field"><span>Format</span>
        <select value={o.format} onChange={(e) => setOsm({ format: e.target.value })} style={{ width: '100%', padding: '9px 11px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--panel-2)', fontFamily: 'inherit', fontSize: 13 }}>
          {FORMATS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </label>
    </>
  )
}

const hex6 = (c: string) => (/^#[0-9a-f]{6}$/i.test(c) ? c : '')

function WebsitePanel() {
  const o = useStudio((s) => s.osm)
  const setOsm = useStudio((s) => s.setOsm)
  const auto = avColor(o.site)
  const swatch = hex6(o.accent) || hex6(auto) || '#635bff'
  return (
    <>
      <label className="field"><span>Site / brand name</span><input type="text" value={o.site} onChange={(e) => setOsm({ site: e.target.value })} /></label>
      <label className="field"><span>Site URL</span><input type="text" value={o.url} onChange={(e) => setOsm({ url: e.target.value })} /></label>
      <div className="field"><span>Logo</span><ImageField logo logoQuery={o.site} value={o.logo || ''} onChange={(v) => setOsm({ logo: v || null })} placeholder="or paste a logo URL (blank = monogram)" /></div>
      <div className="field"><span>Accent color (banners &amp; buttons)</span>
        <div className="color-row">
          <input type="color" className="color-swatch" value={swatch} onChange={(e) => setOsm({ accent: e.target.value })} aria-label="Accent color" />
          <input type="text" value={o.accent} placeholder={`${auto} (auto)`} onChange={(e) => setOsm({ accent: e.target.value })} />
          {o.accent && <button type="button" className="btn ghost" onClick={() => setOsm({ accent: '' })}>Auto</button>}
        </div>
      </div>
    </>
  )
}

function BackgroundPanel() {
  const o = useStudio((s) => s.osm)
  const setOsm = useStudio((s) => s.setOsm)
  return (
    <>
      <p className="panel-hint">The page behind the message won't be your customer's real site — pick how to handle it.</p>
      <div className="field"><span>Background</span>
        <div className="seg-in">{[['branded', 'Branded'], ['upload', 'Upload'], ['neutral', 'Neutral']].map(([v, l]) => <button key={v} className={o.bg === v ? 'on' : ''} onClick={() => setOsm({ bg: v })}>{l}</button>)}</div>
      </div>
      {o.bg === 'upload' && <div className="field"><span>Your site backdrop</span><BackdropField value={o.bgImage} onChange={(v) => setOsm({ bgImage: v })} /></div>}
      <div className="toggle-row"><span>Dim &amp; blur (intrusive formats)</span><label className="switch"><input type="checkbox" checked={o.blur} onChange={(e) => setOsm({ blur: e.target.checked })} /><span className="slider" /></label></div>
    </>
  )
}

function MessagePanel() {
  const o = useStudio((s) => s.osm)
  const setOsm = useStudio((s) => s.setOsm)
  const isBanner = o.format === 'bannerTop' || o.format === 'bannerBottom'
  const isSurvey = o.format === 'survey'
  const showImg = o.format === 'popup' || o.format === 'full' || o.format === 'nudge'
  return (
    <>
      <label className="field"><span>Headline</span><input type="text" value={o.headline} onChange={(e) => setOsm({ headline: e.target.value })} /></label>
      {!isBanner && <label className="field"><span>Body</span><textarea value={o.body} onChange={(e) => setOsm({ body: e.target.value })} /></label>}
      {showImg && <div className="field"><span>Image</span><ImageField pick value={o.image} onChange={(v) => setOsm({ image: v })} placeholder="or paste an image URL (optional)" /></div>}
      <label className="field"><span>{isBanner ? 'Primary button' : 'Button'}</span><input type="text" value={o.cta} onChange={(e) => setOsm({ cta: e.target.value })} /></label>
      {!isSurvey && <label className="field"><span>Secondary link (optional)</span><input type="text" value={o.cta2} onChange={(e) => setOsm({ cta2: e.target.value })} /></label>}
      {isSurvey && <label className="field"><span>Survey scale — low label</span><input type="text" value={o.scaleLo} onChange={(e) => setOsm({ scaleLo: e.target.value })} /></label>}
      {isSurvey && <label className="field"><span>Survey scale — high label</span><input type="text" value={o.scaleHi} onChange={(e) => setOsm({ scaleHi: e.target.value })} /></label>}
      {o.format === 'popup' && <label className="field"><span>Coupon code (optional)</span><input type="text" value={o.code} onChange={(e) => setOsm({ code: e.target.value })} /></label>}
      {o.format === 'popup' && <div className="toggle-row"><span>Email capture input</span><label className="switch"><input type="checkbox" checked={o.input} onChange={(e) => setOsm({ input: e.target.checked })} /><span className="slider" /></label></div>}
      {(o.format === 'popup' || isBanner || o.format === 'full') && (
        <>
          <div className="toggle-row"><span>Countdown timer</span><label className="switch"><input type="checkbox" checked={!!o.countdown} onChange={(e) => setOsm({ countdown: e.target.checked ? '05:59:59' : '' })} /><span className="slider" /></label></div>
          {o.countdown && <label className="field"><span>Time (HH:MM:SS)</span><input type="text" value={o.countdown} onChange={(e) => setOsm({ countdown: e.target.value })} placeholder="05:59:59" /></label>}
        </>
      )}
    </>
  )
}

export const osmSections: SectionDef[] = [
  { id: 'templates', label: 'Presets', icon: Icon.templates, Panel: TemplatesPanel },
  { id: 'format', label: 'Format', icon: Icon.phone, Panel: FormatPanel },
  { id: 'website', label: 'Brand', icon: Icon.sender, Panel: WebsitePanel },
  { id: 'background', label: 'Backdrop', icon: Icon.context, Panel: BackgroundPanel },
  { id: 'message', label: 'Message', icon: Icon.convo, Panel: MessagePanel },
]
