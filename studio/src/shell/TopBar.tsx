import { useStudio, INDUSTRIES } from '@/store/useStudio'
import { industryById } from '@/content/model'
import { useToast } from '@/store/useToast'
import { Icon } from '@/lib/icons'
import { ChannelPicker } from './ChannelPicker'

export function TopBar() {
  const industry = useStudio((s) => s.industry)
  const sub = useStudio((s) => s.sub)
  const setIndustry = useStudio((s) => s.setIndustry)
  const setSub = useStudio((s) => s.setSub)
  const device = useStudio((s) => s.device)
  const setDevice = useStudio((s) => s.setDevice)
  const sim = useStudio((s) => s.sim)
  const setSim = useStudio((s) => s.setSim)
  const simReset = useStudio((s) => s.simReset)
  const show = useToast((s) => s.show)
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

      <div className="grow" />

      <div className="seg" role="tablist" aria-label="Device">
        <button className={device === 'ios' ? 'on' : ''} onClick={() => setDevice('ios')}>{Icon.phone}iPhone</button>
        <button className={device === 'android' ? 'on' : ''} onClick={() => setDevice('android')}>{Icon.android}Android</button>
      </div>
      <button className={'btn ghost' + (sim ? ' on' : '')} onClick={() => setSim(!sim)}>
        {sim ? Icon.pause : Icon.play}{sim ? 'Editing' : 'Simulate'}
      </button>
      {sim && <button className="btn ghost" onClick={simReset}>↺ Reset</button>}
      <button className="btn ghost" onClick={() => show('Export (PNG) is being ported next')}>Copy</button>
      <button className="btn primary" onClick={() => show('Export (PNG) is being ported next')}>{Icon.download}Export</button>
    </div>
  )
}
