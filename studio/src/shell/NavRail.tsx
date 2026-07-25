import { CHANNELS } from '@/channels/registry'
import { useStudio } from '@/store/useStudio'
import { Icon } from '@/lib/icons'

export function NavRail() {
  const channel = useStudio((s) => s.channel)
  const setChannel = useStudio((s) => s.setChannel)
  return (
    <nav className="rail" aria-label="Channels">
      <div className="rail-brand">
        <div className="mark">{Icon.chat}</div>
      </div>
      {CHANNELS.map((c) => (
        <button
          key={c.id}
          className={'rail-item' + (c.id === channel ? ' on' : '')}
          onClick={() => setChannel(c.id)}
          title={c.label}
          aria-current={c.id === channel}
        >
          {c.icon}
          <span className="lbl">{c.label}</span>
        </button>
      ))}
    </nav>
  )
}
