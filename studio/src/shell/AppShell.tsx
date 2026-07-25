import { useStudio } from '@/store/useStudio'
import { channelById } from '@/channels/registry'
import { NavRail } from './NavRail'
import { TopBar } from './TopBar'
import { PhoneFrame } from './PhoneFrame'
import { ContextSelectors } from './ContextSelectors'
import { StubSidebar, StubPreview } from './Stub'

export function AppShell() {
  const channel = useStudio((s) => s.channel)
  const sim = useStudio((s) => s.sim)
  const def = channelById(channel)
  const Sidebar = def?.Sidebar
  const Preview = def?.Preview

  return (
    <div className="app">
      <NavRail />

      <aside className="sidebar">
        <div className="sb-head">
          <h1>Channel Studio</h1>
          <small>{def?.label ?? channel} · mockup</small>
        </div>
        <ContextSelectors />
        <div className="divider" />
        {Sidebar ? <Sidebar /> : <StubSidebar label={def?.label ?? channel} />}
      </aside>

      <div className="stage-wrap">
        <TopBar />
        <div className={'stage' + (sim ? ' sim-on' : '')}>
          <PhoneFrame>
            {Preview ? <Preview /> : <StubPreview label={def?.label ?? channel} />}
          </PhoneFrame>
        </div>
      </div>
    </div>
  )
}
