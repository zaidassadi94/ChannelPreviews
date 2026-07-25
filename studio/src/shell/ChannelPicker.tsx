import { useState } from 'react'
import { CHANNELS, channelById, type ChannelDef } from '@/channels/registry'
import { useStudio } from '@/store/useStudio'
import { Icon } from '@/lib/icons'

const GROUPS: ChannelDef['group'][] = ['Messaging', 'Email', 'Notify', 'Web', 'Ads']

export function ChannelPicker() {
  const channel = useStudio((s) => s.channel)
  const setChannel = useStudio((s) => s.setChannel)
  const [open, setOpen] = useState(false)
  const cur = channelById(channel)

  return (
    <div className={'chpick' + (open ? ' open' : '')}>
      <button className="chpick-btn" onClick={() => setOpen((o) => !o)}>
        <span className="em">{cur?.icon}</span>
        <span className="nm">{cur?.label ?? channel}</span>
        <span className="cv">{Icon.chevron}</span>
      </button>
      {open && (
        <>
          <div className="backdrop" onClick={() => setOpen(false)} />
          <div className="chpick-menu">
            {GROUPS.map((g) => {
              const items = CHANNELS.filter((c) => c.group === g)
              if (!items.length) return null
              return (
                <div key={g}>
                  <div className="chpick-grp">{g}</div>
                  {items.map((c) => (
                    <button key={c.id} className={'chpick-item' + (c.id === channel ? ' on' : '')}
                      onClick={() => { setChannel(c.id); setOpen(false) }}>
                      <span className="em">{c.icon}</span>
                      <span className="nm">{c.label}</span>
                      <span className="dot" />
                    </button>
                  ))}
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
