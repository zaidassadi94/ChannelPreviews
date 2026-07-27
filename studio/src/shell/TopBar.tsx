import { useStudio, INDUSTRIES } from '@/store/useStudio'
import { industryById } from '@/content/model'
import { Icon } from '@/lib/icons'
import { useCapture } from '@/lib/useCapture'
import { useRecorder } from '@/lib/useRecorder'
import { useAiPanel } from '@/store/useAiPanel'
import { ChannelPicker } from './ChannelPicker'

export function TopBar() {
  const industry = useStudio((s) => s.industry)
  const sub = useStudio((s) => s.sub)
  const setIndustry = useStudio((s) => s.setIndustry)
  const setSub = useStudio((s) => s.setSub)
  const brandColor = useStudio((s) => s.brandColor)
  const setBrandColor = useStudio((s) => s.setBrandColor)
  const device = useStudio((s) => s.device)
  const setDevice = useStudio((s) => s.setDevice)
  const sim = useStudio((s) => s.sim)
  const setSim = useStudio((s) => s.setSim)
  const simReset = useStudio((s) => s.simReset)
  const { onExport, onCopy } = useCapture()
  const recRef = useRecorder()
  const toggleAi = useAiPanel((s) => s.toggle)
  const aiOpen = useAiPanel((s) => s.open)
  const ind = industryById(industry)
  const subs = ind ? ind.subs : []

  return (
    <div className="topbar">
      <div className="tb-brand">
        <div className="mark">{Icon.chat}</div>
        <h1>Channel Studio</h1>
      </div>
      <div className="tb-sep" />
      <ChannelPicker />
      <div className="tb-sel">
        <select value={industry} onChange={(e) => setIndustry(e.target.value)} title="Industry">
          {INDUSTRIES.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
        </select>
      </div>
      {subs.length > 0 && (
        <div className="tb-sel">
          <select value={sub ?? ''} onChange={(e) => setSub(e.target.value)} title="Sub-industry">
            {subs.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
      )}

      <div className="tb-bc">
        <label className="tb-bc-pick" title="Brand color — themes buttons & accents on your own-brand channels (In-App, Push, Web Push, Onsite, Gmail, Gamification). Blank = auto.">
          <span className="dot" style={brandColor ? { background: brandColor } : undefined} />
          <span className="lb">Brand</span>
          <input type="color" value={brandColor || '#635bff'} onChange={(e) => setBrandColor(e.target.value)} aria-label="Brand color" />
        </label>
        {brandColor && <button type="button" className="tb-bc-x" title="Reset to auto color" onClick={() => setBrandColor('')}>✕</button>}
      </div>

      <div className="grow" />

      <div className="seg" role="tablist" aria-label="Device">
        <button className={device === 'ios' ? 'on' : ''} onClick={() => setDevice('ios')}>{Icon.phone}iPhone</button>
        <button className={device === 'android' ? 'on' : ''} onClick={() => setDevice('android')}>{Icon.android}Android</button>
      </div>
      <button className={'btn ghost' + (sim ? ' on' : '')} onClick={() => setSim(!sim)}>
        {sim ? Icon.pause : Icon.play}{sim ? 'Editing' : 'Simulate'}
      </button>
      {sim && <button className="btn ghost" onClick={simReset}>↺ Reset</button>}
      <button className={'btn ghost' + (aiOpen ? ' on' : '')} onClick={toggleAi} title="Generate with AI">
        <span style={{ fontSize: 14 }}>✨</span> AI
      </button>
      {/* Record — the recorder owns this button's content + class (childless on purpose). */}
      <button ref={recRef} className="btn ghost" title="Record the preview (Chrome/Edge)" aria-label="Record the preview" />
      <button className="btn ghost" onClick={onCopy}>Copy</button>
      <button className="btn primary" onClick={onExport}>{Icon.download}Export</button>
    </div>
  )
}
