import { useStudio } from '@/store/useStudio'
import { channelById } from '@/channels/registry'

/** The thin left rail = the active channel's sections (Templates, Chat, …).
    Clicking one opens its panel; clicking the already-open one collapses it (Canva-style). */
/** Global brand-color swatch, pinned to the bottom of the rail. Themes buttons
    & accents across the own-brand channels; auto-seeded, click to edit. */
function BrandSwatch() {
  const brandColor = useStudio((s) => s.brandColor)
  const auto = useStudio((s) => s.brandColorAuto)
  const setBrandColor = useStudio((s) => s.setBrandColor)
  const resetBrandColorAuto = useStudio((s) => s.resetBrandColorAuto)
  return (
    <div className="rail-brand">
      <label className="rb-pick" title="Brand color — themes buttons & accents on your own-brand channels (In-App, Push, Web Push, Onsite, Gmail, Gamification). Auto-matches the logo; pick to override.">
        <span className="sw" style={{ background: brandColor }} />
        <span>Brand</span>
        <input type="color" value={brandColor} onChange={(e) => setBrandColor(e.target.value)} aria-label="Brand color" />
      </label>
      {!auto && <button type="button" className="rb-auto" title="Match the logo automatically" onClick={resetBrandColorAuto}>Auto</button>}
    </div>
  )
}

export function SectionRail() {
  const channel = useStudio((s) => s.channel)
  const section = useStudio((s) => s.section)
  const panelOpen = useStudio((s) => s.panelOpen)
  const setSection = useStudio((s) => s.setSection)
  const setPanelOpen = useStudio((s) => s.setPanelOpen)
  const def = channelById(channel)
  const sections = def?.sections ?? []
  const active = section || sections[0]?.id

  if (!sections.length) return <nav className="rail"><div className="rail-empty">Sections appear here once this channel is migrated.</div><BrandSwatch /></nav>

  const onClick = (id: string) => {
    if (panelOpen && id === active) setPanelOpen(false) // click the open section again → collapse
    else { setSection(id); setPanelOpen(true) }
  }

  return (
    <nav className="rail" aria-label="Sections">
      {sections.map((s) => (
        <button
          key={s.id}
          className={'rail-item' + (panelOpen && s.id === active ? ' on' : '')}
          aria-expanded={panelOpen && s.id === active}
          onClick={() => onClick(s.id)}
        >
          {s.icon}
          <span>{s.label}</span>
        </button>
      ))}
      <BrandSwatch />
    </nav>
  )
}

/** The collapse chevron — lives on the panel's right seam so it moves with the
    panel and disappears with it when collapsed (re-open by clicking a rail
    section). Attaching it to the panel avoids the old floating pill that had to
    be hand-synced to the grid at every breakpoint. */
function CollapseTab() {
  const setPanelOpen = useStudio((s) => s.setPanelOpen)
  return (
    <button
      className="panel-toggle"
      title="Collapse panel"
      aria-label="Collapse panel"
      onClick={() => setPanelOpen(false)}
    >
      <svg viewBox="0 0 24 24" fill="none">
        <path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  )
}

/** The section panel = the active section's controls only, with a collapse chevron. */
export function SectionPanel() {
  const channel = useStudio((s) => s.channel)
  const section = useStudio((s) => s.section)
  const def = channelById(channel)
  const sections = def?.sections ?? []

  if (!sections.length) {
    return (
      <aside className="panel">
        <div className="panel-scroll">
          <div className="panel-body">
            <p className="panel-hint" style={{ margin: 0 }}>
              The <b>{def?.label ?? channel}</b> editor is being ported into this app. The channel
              dropdown and the shared shell already work — this channel's controls land next.
            </p>
          </div>
        </div>
        <CollapseTab />
      </aside>
    )
  }

  const active = sections.find((s) => s.id === (section || sections[0].id)) ?? sections[0]
  const Panel = active.Panel
  return (
    <aside className="panel">
      <div className="panel-scroll">
        <div className="panel-head"><h2>{active.label}</h2></div>
        <div className="panel-body"><Panel /></div>
      </div>
      <CollapseTab />
    </aside>
  )
}
