import type { ReactNode } from 'react'
import { useStudio, INDUSTRIES } from '@/store/useStudio'
import { industryById } from '@/content/model'
import { Icon } from '@/lib/icons'
import { useCapture } from '@/lib/useCapture'
import { useRecorder } from '@/lib/useRecorder'
import { useAiPanel } from '@/store/useAiPanel'
import { ChannelPicker } from './ChannelPicker'

type DeviceOpt = [value: string, label: string, icon: ReactNode]

export function TopBar() {
  const industry = useStudio((s) => s.industry)
  const sub = useStudio((s) => s.sub)
  const setIndustry = useStudio((s) => s.setIndustry)
  const setSub = useStudio((s) => s.setSub)
  const channel = useStudio((s) => s.channel)
  const device = useStudio((s) => s.device)
  const setDevice = useStudio((s) => s.setDevice)
  const gmailSkin = useStudio((s) => s.gmail.skin)
  const setGmail = useStudio((s) => s.setGmail)
  const osmDevice = useStudio((s) => s.osm.device)
  const setOsm = useStudio((s) => s.setOsm)
  const webpushOs = useStudio((s) => s.webpush.os)
  const setWebpush = useStudio((s) => s.setWebpush)
  const sim = useStudio((s) => s.sim)
  const setSim = useStudio((s) => s.setSim)
  const simReset = useStudio((s) => s.simReset)
  const { onExport, onCopy } = useCapture()
  const recRef = useRecorder()
  const toggleAi = useAiPanel((s) => s.toggle)
  const aiOpen = useAiPanel((s) => s.open)
  const ind = industryById(industry)
  const subs = ind ? ind.subs : []

  // The "view" axis that matters differs by channel: phones toggle iPhone/Android,
  // Gmail & Onsite render on Desktop or Mobile, Web Push on macOS/Windows. Housed
  // in one place (here) so each channel's per-panel device toggle can go away.
  const PHONE: DeviceOpt[] = [['ios', 'iPhone', Icon.phone], ['android', 'Android', Icon.android]]
  const deviceAxis: { value: string; set: (v: string) => void; opts: DeviceOpt[] } =
    channel === 'gmail'
      ? { value: gmailSkin, set: (v) => setGmail({ skin: v }), opts: [['mobile', 'Mobile', Icon.phone], ['desktop', 'Desktop', Icon.desktop]] }
      : channel === 'osm'
        ? { value: osmDevice, set: (v) => setOsm({ device: v }), opts: [['mobile', 'Mobile', Icon.phone], ['desktop', 'Desktop', Icon.desktop]] }
        : channel === 'webpush'
          ? { value: webpushOs, set: (v) => setWebpush({ os: v }), opts: [['mac', 'macOS', Icon.desktop], ['windows', 'Windows', Icon.desktop]] }
          : { value: device, set: (v) => setDevice(v as 'ios' | 'android'), opts: PHONE }

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

      <div className="seg" role="tablist" aria-label="View">
        {deviceAxis.opts.map(([v, l, ic]) => (
          <button key={v} role="tab" aria-selected={deviceAxis.value === v} className={deviceAxis.value === v ? 'on' : ''} onClick={() => deviceAxis.set(v)}>{ic}{l}</button>
        ))}
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
