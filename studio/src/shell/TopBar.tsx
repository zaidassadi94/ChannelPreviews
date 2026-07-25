import { useStudio } from '@/store/useStudio'
import { useToast } from '@/store/useToast'
import { Icon } from '@/lib/icons'

export function TopBar() {
  const device = useStudio((s) => s.device)
  const setDevice = useStudio((s) => s.setDevice)
  const sim = useStudio((s) => s.sim)
  const setSim = useStudio((s) => s.setSim)
  const simReset = useStudio((s) => s.simReset)
  const show = useToast((s) => s.show)

  return (
    <div className="topbar">
      <div className="seg" role="tablist" aria-label="Device">
        <button className={device === 'ios' ? 'on' : ''} onClick={() => setDevice('ios')}>{Icon.phone}iPhone</button>
        <button className={device === 'android' ? 'on' : ''} onClick={() => setDevice('android')}>{Icon.android}Android</button>
      </div>
      <div className="grow" />
      <button className={'btn ghost' + (sim ? ' on' : '')} onClick={() => setSim(!sim)}>
        {sim ? Icon.pause : Icon.play}{sim ? 'Editing' : 'Simulate'}
      </button>
      {sim && <button className="btn ghost" onClick={simReset}>↺ Reset</button>}
      <button className="btn ghost" onClick={() => show('Export (PNG) is being ported next')}>Copy</button>
      <button className="btn primary" onClick={() => show('Export (PNG) is being ported next')}>{Icon.download}Export</button>
    </div>
  )
}
