import { useEffect, useState } from 'react'
import { useStudio } from '@/store/useStudio'
import { useShowcase, SHOWCASE_ENABLED } from '@/store/useShowcase'
import { channelById } from '@/channels/registry'
import { TopBar } from './TopBar'
import { StageFit } from './StageFit'
import { SectionRail, SectionPanel } from './SectionNav'
import { StubPreview } from './Stub'
import { ShowcasePanel } from './Showcase/ShowcasePanel'
import { ShowcaseStage } from './Showcase/ShowcaseStage'
import { useAutoBrandColor } from '@/lib/useAutoBrandColor'
import { useAiChannelSync } from '@/lib/aiCampaign'

export function AppShell() {
  const channel = useStudio((s) => s.channel)
  const setChannel = useStudio((s) => s.setChannel)
  const sim = useStudio((s) => s.sim)
  const panelOpen = useStudio((s) => s.panelOpen)
  const aiBusy = useStudio((s) => s.aiBusyChannel === s.channel)
  const def = channelById(channel)
  const Preview = def?.Preview
  // On phones the editor and preview can't share the width — toggle between them.
  const [mView, setMView] = useState<'edit' | 'preview'>('preview')
  useAutoBrandColor()
  useAiChannelSync()

  // Showcase mode: a 16:9 board of several channels. Clicking ✎ Edit on a tile drops into
  // that channel's normal editor (leaves the board, which the store preserves).
  const showcaseOpen = useShowcase((s) => s.open) && SHOWCASE_ENABLED
  const activeTileId = useShowcase((s) => s.activeTileId)
  const scTiles = useShowcase((s) => s.tiles)
  const editReturn = useShowcase((s) => s.editReturn)
  const setScOpen = useShowcase((s) => s.setOpen)
  const setScActive = useShowcase((s) => s.setActive)
  const setEditReturn = useShowcase((s) => s.setEditReturn)
  useEffect(() => {
    if (!activeTileId) return
    const t = scTiles.find((x) => x.id === activeTileId)
    if (t) { setChannel(t.channel); setScOpen(false); setEditReturn(true) }
    setScActive(null)
  }, [activeTileId, scTiles, setChannel, setScOpen, setScActive, setEditReturn])

  return (
    <div className="app">
      <TopBar />
      <div className="mobile-tabs" role="tablist" aria-label="View">
        <button role="tab" aria-selected={mView === 'edit'} className={mView === 'edit' ? 'on' : ''} onClick={() => setMView('edit')}>Editor</button>
        <button role="tab" aria-selected={mView === 'preview'} className={mView === 'preview' ? 'on' : ''} onClick={() => setMView('preview')}>Preview</button>
      </div>
      <div className={'body mobile-' + mView + (panelOpen ? '' : ' panel-collapsed') + (showcaseOpen ? ' showcase' : '')}>
        {showcaseOpen ? (
          <>
            <ShowcasePanel />
            <div className={'stage' + (sim ? ' sim-on' : '')}>
              <StageFit><ShowcaseStage /></StageFit>
            </div>
          </>
        ) : (
          <>
            <SectionRail />
            <SectionPanel />
            <div className={'stage' + (sim ? ' sim-on' : '')}>
              {editReturn && (
                <button className="sc-back-pill" onClick={() => { setScOpen(true); setEditReturn(false) }} title="Back to the Showcase board">
                  ← Back to Showcase
                </button>
              )}
              {Preview ? <StageFit><Preview /></StageFit> : <StubPreview label={def?.label ?? channel} />}
              {aiBusy && (
                <div className="stage-ai-busy" role="status" aria-live="polite">
                  <span className="cs-ai-spin" /> Generating for this channel…
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
