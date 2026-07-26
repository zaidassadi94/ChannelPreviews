import { useState } from 'react'
import { useStudio } from '@/store/useStudio'
import { channelById } from '@/channels/registry'
import { TopBar } from './TopBar'
import { StageFit } from './StageFit'
import { SectionRail, SectionPanel } from './SectionNav'
import { StubPreview } from './Stub'

export function AppShell() {
  const channel = useStudio((s) => s.channel)
  const sim = useStudio((s) => s.sim)
  const panelOpen = useStudio((s) => s.panelOpen)
  const setPanelOpen = useStudio((s) => s.setPanelOpen)
  const def = channelById(channel)
  const Preview = def?.Preview
  // On phones the editor and preview can't share the width — toggle between them.
  const [mView, setMView] = useState<'edit' | 'preview'>('preview')

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
        </div>
        <button
          className="panel-toggle"
          title={panelOpen ? 'Collapse panel' : 'Expand panel'}
          aria-label={panelOpen ? 'Collapse panel' : 'Expand panel'}
          onClick={() => setPanelOpen(!panelOpen)}
        >
          <svg viewBox="0 0 24 24" fill="none">
            {panelOpen
              ? <path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              : <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />}
          </svg>
        </button>
      </div>
    </div>
  )
}
