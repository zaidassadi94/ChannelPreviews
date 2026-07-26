import { useStudio } from '@/store/useStudio'
import { channelById } from '@/channels/registry'
import { Icon } from '@/lib/icons'

/** The thin left rail = the active channel's sections (Templates, Chat, …).
    Clicking one opens its panel; clicking the already-open one collapses it (Canva-style). */
export function SectionRail() {
  const channel = useStudio((s) => s.channel)
  const section = useStudio((s) => s.section)
  const panelOpen = useStudio((s) => s.panelOpen)
  const setSection = useStudio((s) => s.setSection)
  const setPanelOpen = useStudio((s) => s.setPanelOpen)
  const def = channelById(channel)
  const sections = def?.sections ?? []
  const active = section || sections[0]?.id

  if (!sections.length) return <nav className="rail"><div className="rail-empty">Sections appear here once this channel is migrated.</div></nav>

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
    </nav>
  )
}

/** The section panel = the active section's controls only, with a collapse chevron. */
export function SectionPanel() {
  const channel = useStudio((s) => s.channel)
  const section = useStudio((s) => s.section)
  const setPanelOpen = useStudio((s) => s.setPanelOpen)
  const def = channelById(channel)
  const sections = def?.sections ?? []

  if (!sections.length) {
    return (
      <aside className="panel">
        <div className="panel-body">
          <p className="panel-hint" style={{ margin: 0 }}>
            The <b>{def?.label ?? channel}</b> editor is being ported into this app. The channel
            dropdown and the shared shell already work — this channel's controls land next.
          </p>
        </div>
      </aside>
    )
  }

  const active = sections.find((s) => s.id === (section || sections[0].id)) ?? sections[0]
  const Panel = active.Panel
  return (
    <aside className="panel">
      <div className="panel-head">
        <h2>{active.label}</h2>
        <button className="panel-collapse" title="Collapse panel" aria-label="Collapse panel" onClick={() => setPanelOpen(false)}>{Icon.back}</button>
      </div>
      <div className="panel-body"><Panel /></div>
    </aside>
  )
}
