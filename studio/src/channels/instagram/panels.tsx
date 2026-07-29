import { useStudio } from '@/store/useStudio'
import { Icon } from '@/lib/icons'
import type { SectionDef } from '@/channels/registry'
import { ImageField } from '@/shell/ImageField'
import { IG_TEMPLATES, applyIgTemplate } from './templates'

const IG_CTAS = ['Shop Now', 'Learn More', 'Sign Up', 'Install Now', 'Get Offer', 'Book Now', 'Order Now', 'Download', 'Watch More', 'Contact Us']
const selStyle = { width: '100%', padding: '9px 11px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--panel-2)', fontFamily: 'inherit', fontSize: 13 } as const

function TemplatesPanel() {
  const setIg = useStudio((s) => s.setIg)
  return (
    <>
      <p className="panel-hint">Ready-made ad creative. They render in whichever <b>format</b> (Feed / Story) is selected.</p>
      <div className="tpl-grid">
        {IG_TEMPLATES.map((t, i) => (
          <button key={i} className="tpl" onClick={() => applyIgTemplate(t)}>
            <span className="ti">{t.icon}</span>
            <span className="tc"><span className="tt">{t.name}{t.flow && <span className="flow">FLOW</span>}</span><span className="td">{t.desc}</span></span>
          </button>
        ))}
      </div>
      <button className="btn ghost block" style={{ marginTop: 12 }} onClick={() => setIg({ media: '', caption: 'Your caption here.', cta: 'Shop Now' })}>{Icon.refresh}Clear &amp; start blank</button>
    </>
  )
}

function FormatPanel() {
  const format = useStudio((s) => s.ig.format)
  const setIg = useStudio((s) => s.setIg)
  return (
    <div className="field"><span>Format</span>
      <div className="seg-in"><button className={format === 'feed' ? 'on' : ''} onClick={() => setIg({ format: 'feed' })}>Feed ad</button><button className={format === 'story' ? 'on' : ''} onClick={() => setIg({ format: 'story' })}>Story ad</button></div>
    </div>
  )
}

function AdvertiserPanel() {
  const g = useStudio((s) => s.ig)
  const setIg = useStudio((s) => s.setIg)
  return (
    <>
      <label className="field"><span>Business name</span><input type="text" value={g.brand} onChange={(e) => setIg({ brand: e.target.value })} /></label>
      <label className="field"><span>Handle (@username)</span><input type="text" value={g.handle} onChange={(e) => setIg({ handle: e.target.value })} /></label>
      <div className="toggle-row"><span>Verified badge</span><label className="switch"><input type="checkbox" checked={g.verified} onChange={(e) => setIg({ verified: e.target.checked })} /><span className="slider" /></label></div>
      <div className="field"><span>Profile photo</span><ImageField logo logoQuery={g.brand} value={g.logo || ''} onChange={(v) => setIg({ logo: v || null })} placeholder="or paste a photo URL (blank = monogram)" /></div>
    </>
  )
}

function CreativePanel() {
  const g = useStudio((s) => s.ig)
  const setIg = useStudio((s) => s.setIg)
  return (
    <>
      <div className="field"><span>Ad media</span><ImageField pick value={g.media} onChange={(v) => setIg({ media: v })} placeholder="or paste a media URL (blank = placeholder)" /></div>
      <label className="field"><span>Call-to-action button</span>
        <select value={g.cta} onChange={(e) => setIg({ cta: e.target.value })} style={selStyle}>{IG_CTAS.map((c) => <option key={c} value={c}>{c}</option>)}</select>
      </label>
      {g.format === 'feed' && <label className="field"><span>Caption (primary text)</span><textarea value={g.caption} onChange={(e) => setIg({ caption: e.target.value })} /></label>}
    </>
  )
}

function PostPanel() {
  const g = useStudio((s) => s.ig)
  const setIg = useStudio((s) => s.setIg)
  if (g.format !== 'feed') return <p className="panel-hint">Likes, comments and timestamp show on the <b>Feed</b> ad. Switch format to Feed to edit them.</p>
  return (
    <>
      <p className="panel-hint">Shown on the <b>Feed</b> ad — likes, comments and timestamp.</p>
      <label className="field"><span>Likes</span><input type="text" value={g.likes} onChange={(e) => setIg({ likes: e.target.value })} /></label>
      <label className="field"><span>Comments</span><input type="text" value={g.comments} onChange={(e) => setIg({ comments: e.target.value })} /></label>
      <label className="field"><span>Timestamp</span><input type="text" value={g.time} onChange={(e) => setIg({ time: e.target.value })} /></label>
    </>
  )
}

export const igSections: SectionDef[] = [
  { id: 'templates', label: 'Presets', icon: Icon.templates, Panel: TemplatesPanel },
  { id: 'format', label: 'Format', icon: Icon.phone, Panel: FormatPanel },
  { id: 'advertiser', label: 'Profile', icon: Icon.sender, Panel: AdvertiserPanel },
  { id: 'creative', label: 'Content', icon: Icon.convo, Panel: CreativePanel },
  { id: 'post', label: 'Post', icon: Icon.context, Panel: PostPanel },
]
