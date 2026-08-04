import { useStudio } from '@/store/useStudio'
import { Icon } from '@/lib/icons'
import type { SectionDef } from '@/channels/registry'
import { ImageField } from '@/shell/ImageField'
import { FB_TEMPLATES, applyFbTemplate } from './templates'

const FB_CTAS = ['Shop Now', 'Learn More', 'Sign Up', 'Install Now', 'Get Offer', 'Book Now', 'Order Now', 'Download', 'Send Message', 'Contact Us']
const selStyle = { width: '100%', padding: '9px 11px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--panel-2)', fontFamily: 'inherit', fontSize: 13 } as const

function TemplatesPanel() {
  const setFb = useStudio((s) => s.setFb)
  return (
    <>
      <p className="panel-hint">Ready-made ad creative. They render in whichever <b>format</b> (Feed / Story / Marketplace) is selected.</p>
      <div className="tpl-grid">
        {FB_TEMPLATES.map((t, i) => (
          <button key={i} className="tpl" onClick={() => applyFbTemplate(t)}>
            <span className="ti">{t.icon}</span>
            <span className="tc"><span className="tt">{t.name}{t.flow && <span className="flow">FLOW</span>}</span><span className="td">{t.desc}</span></span>
          </button>
        ))}
      </div>
      <button className="btn ghost block" style={{ marginTop: 12 }} onClick={() => setFb({ media: '', primary: 'Your primary text.', headline: 'Your headline', desc: '', cta: 'Shop Now' })}>{Icon.refresh}Clear &amp; start blank</button>
    </>
  )
}

function FormatPanel() {
  const format = useStudio((s) => s.fb.format)
  const setFb = useStudio((s) => s.setFb)
  return (
    <div className="field"><span>Format</span>
      <div className="seg-in">{[['feed', 'Feed'], ['story', 'Story'], ['marketplace', 'Marketplace']].map(([v, l]) => <button key={v} className={format === v ? 'on' : ''} onClick={() => setFb({ format: v })}>{l}</button>)}</div>
    </div>
  )
}

function AdvertiserPanel() {
  const f = useStudio((s) => s.fb)
  const setFb = useStudio((s) => s.setFb)
  return (
    <>
      <label className="field"><span>Page name</span><input type="text" value={f.page} onChange={(e) => setFb({ page: e.target.value })} /></label>
      <div className="toggle-row"><span>Verified badge</span><label className="switch"><input type="checkbox" checked={f.verified} onChange={(e) => setFb({ verified: e.target.checked })} /><span className="slider" /></label></div>
      <div className="field"><span>Page photo</span><ImageField logo logoQuery={f.page} value={f.logo || ''} onChange={(v) => setFb({ logo: v || null })} placeholder="or paste a photo URL (blank = monogram)" /></div>
    </>
  )
}

function CreativePanel() {
  const f = useStudio((s) => s.fb)
  const setFb = useStudio((s) => s.setFb)
  const isFeed = f.format === 'feed'
  const isMkt = f.format === 'marketplace'
  return (
    <>
      <div className="field"><span>Ad media</span><ImageField pick value={f.media} onChange={(v) => setFb({ media: v })} placeholder="or paste a media URL (blank = placeholder)" /></div>
      {isFeed && <label className="field"><span>Primary text</span><textarea value={f.primary} onChange={(e) => setFb({ primary: e.target.value })} /></label>}
      {(isFeed || isMkt) && <label className="field"><span>{isMkt ? 'Listing title' : 'Headline (link)'}</span><input type="text" value={f.headline} onChange={(e) => setFb({ headline: e.target.value })} /></label>}
      {isMkt && <label className="field"><span>Price</span><input type="text" value={f.price} onChange={(e) => setFb({ price: e.target.value })} /></label>}
      {isFeed && <label className="field"><span>Link description</span><input type="text" value={f.desc} onChange={(e) => setFb({ desc: e.target.value })} /></label>}
      {isFeed && <label className="field"><span>Display URL</span><input type="text" value={f.url} onChange={(e) => setFb({ url: e.target.value })} /></label>}
      <label className="field"><span>Call-to-action button</span>
        <select value={f.cta} onChange={(e) => setFb({ cta: e.target.value })} style={selStyle}>{FB_CTAS.map((c) => <option key={c} value={c}>{c}</option>)}</select>
      </label>
    </>
  )
}

function EngagementPanel() {
  const f = useStudio((s) => s.fb)
  const setFb = useStudio((s) => s.setFb)
  if (f.format !== 'feed') return <p className="panel-hint">Reactions, comments and shares show on the <b>Feed</b> ad. Switch format to Feed to edit them.</p>
  return (
    <>
      <p className="panel-hint">Shown on the <b>Feed</b> ad — reactions, comments and shares.</p>
      <label className="field"><span>Reactions</span><input type="text" value={f.reactions} onChange={(e) => setFb({ reactions: e.target.value })} /></label>
      <label className="field"><span>Comments</span><input type="text" value={f.comments} onChange={(e) => setFb({ comments: e.target.value })} /></label>
      <label className="field"><span>Shares</span><input type="text" value={f.shares} onChange={(e) => setFb({ shares: e.target.value })} /></label>
    </>
  )
}

export const fbSections: SectionDef[] = [
  { id: 'templates', label: 'Presets', icon: Icon.templates, Panel: TemplatesPanel },
  { id: 'format', label: 'Format', icon: Icon.phone, Panel: FormatPanel },
  { id: 'advertiser', label: 'Brand', icon: Icon.sender, Panel: AdvertiserPanel },
  { id: 'creative', label: 'Content', icon: Icon.convo, Panel: CreativePanel },
  { id: 'engagement', label: 'Engage', icon: Icon.context, Panel: EngagementPanel },
]
