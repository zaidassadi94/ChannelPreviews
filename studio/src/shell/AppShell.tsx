import { useState } from 'react'
import { useStudio } from '@/store/useStudio'
import { channelById } from '@/channels/registry'
import { TopBar } from './TopBar'
import { StageFit } from './StageFit'
import { SectionRail, SectionPanel } from './SectionNav'
import { StubPreview } from './Stub'
import { useAutoBrandColor } from '@/lib/useAutoBrandColor'
import { useAiChannelSync } from '@/lib/aiCampaign'

export function AppShell() {
  const channel = useStudio((s) => s.channel)
  const sim = useStudio((s) => s.sim)
  const panelOpen = useStudio((s) => s.panelOpen)
  const aiBusy = useStudio((s) => s.aiBusyChannel === s.channel)
  const def = channelById(channel)
  const Preview = def?.Preview
  // On phones the editor and preview can't share the width — toggle between them.
  const [mView, setMView] = useState<'edit' | 'preview'>('preview')
  useAutoBrandColor()
  useAiChannelSync()

  return (
    <div className="app">
      <TopBar />
      <div className="mobile-tabs" role="tablist" aria-label="View">
        <button role="tab" aria-selected={mView === 'edit'} className={mView === 'edit' ? 'on' : ''} onClick={() => setMView('edit')}>Editor</button>
        <button role="tab" aria-selected={mView === 'preview'} className={mView === 'preview' ? 'on' : ''} onClick={() => setMView('preview')}>Preview</button>
      </div>
      <div className={'body mobile-' + mView + (panelOpen ? '' : ' panel-collapsed')}>
        <SectionRail />
        <SectionPanel />
        <div className={'stage' + (sim ? ' sim-on' : '')}>
          {Preview ? <StageFit><Preview /></StageFit> : <StubPreview label={def?.label ?? channel} />}
          {aiBusy && (
            <div className="stage-ai-busy" role="status" aria-live="polite">
              <span className="cs-ai-spin" /> Generating for this channel…
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
