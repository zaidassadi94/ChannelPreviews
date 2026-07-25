import { useStudio } from '@/store/useStudio'
import { channelById } from '@/channels/registry'
import { TopBar } from './TopBar'
import { PhoneFrame } from './PhoneFrame'
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
          <PhoneFrame>
            {Preview ? <Preview /> : <StubPreview label={def?.label ?? channel} />}
          </PhoneFrame>
        </div>
      </div>
    </div>
  )
}
