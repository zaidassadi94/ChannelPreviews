import { useStudio } from '@/store/useStudio'
import { channelById } from '@/channels/registry'

/** The thin left rail = the active channel's sections (Templates, Chat, …).
    Clicking one opens its panel (master/detail) — no scrolling through accordions. */
export function SectionRail() {
  const channel = useStudio((s) => s.channel)
  const section = useStudio((s) => s.section)
  const setSection = useStudio((s) => s.setSection)
  const def = channelById(channel)
  const sections = def?.sections ?? []
  const active = section || sections[0]?.id

  if (!sections.length) return <nav className="rail"><div className="rail-empty">Sections appear here once this channel is migrated.</div></nav>

  return (
    <nav className="rail" aria-label="Sections">
      {sections.map((s) => (
        <button key={s.id} className={'rail-item' + (s.id === active ? ' on' : '')} onClick={() => setSection(s.id)}>
          {s.icon}
          <span>{s.label}</span>
        </button>
      ))}
    </nav>
  )
}

/** The section panel = the active section's controls only. */
export function SectionPanel() {
  const channel = useStudio((s) => s.channel)
  const section = useStudio((s) => s.section)
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
      <div className="panel-head"><h2>{active.label}</h2></div>
      <div className="panel-body"><Panel /></div>
    </aside>
  )
}
