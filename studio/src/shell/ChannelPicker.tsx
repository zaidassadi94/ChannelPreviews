import { useEffect, useRef, useState } from 'react'
import { CHANNELS, channelById, type ChannelDef } from '@/channels/registry'
import { useStudio } from '@/store/useStudio'
import { Icon } from '@/lib/icons'

const GROUPS: ChannelDef['group'][] = ['Messaging', 'Email', 'Notify', 'Web', 'Ads']

export function ChannelPicker() {
  const channel = useStudio((s) => s.channel)
  const setChannel = useStudio((s) => s.setChannel)
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const cur = channelById(channel)

  // Close on an outside click / Escape rather than rendering a full-viewport
  // overlay div to catch the click. A fixed full-screen element is fragile: a
  // browser "auto dark mode" or a dark-mode extension can paint a background
  // onto it, which then reads as a grey scrim over the whole app whenever the
  // menu is open. A document listener has no such element.
  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className={'chpick' + (open ? ' open' : '')} ref={rootRef}>
      <button className="chpick-btn" onClick={() => setOpen((o) => !o)} aria-haspopup="menu" aria-expanded={open}>
        <span className="em">{cur?.icon}</span>
        <span className="nm">{cur?.label ?? channel}</span>
        <span className="cv">{Icon.chevron}</span>
      </button>
      {open && (
        <div className="chpick-menu" role="menu">
          {GROUPS.map((g) => {
            const items = CHANNELS.filter((c) => c.group === g)
            if (!items.length) return null
            return (
              <div key={g}>
                <div className="chpick-grp">{g}</div>
                {items.map((c) => (
                  <button key={c.id} role="menuitem" className={'chpick-item' + (c.id === channel ? ' on' : '')}
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
      )}
    </div>
  )
}
