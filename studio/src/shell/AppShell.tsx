import { useStudio } from '@/store/useStudio'
import { channelById } from '@/channels/registry'
import { TopBar } from './TopBar'
import { StageFit } from './StageFit'
import { SectionRail, SectionPanel } from './SectionNav'
import { StubPreview } from './Stub'

export function AppShell() {
  const channel = useStudio((s) => s.channel)
  const sim = useStudio((s) => s.sim)
  const def = channelById(channel)
  const Preview = def?.Preview

  return (
    <div className="app">
      <TopBar />
      <div className="body">
        <SectionRail />
        <SectionPanel />
        <div className={'stage' + (sim ? ' sim-on' : '')}>
          {Preview ? <StageFit><Preview /></StageFit> : <StubPreview label={def?.label ?? channel} />}
        </div>
      </div>
    </div>
  )
}
