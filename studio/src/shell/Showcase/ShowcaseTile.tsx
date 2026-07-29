import { useLayoutEffect, useRef } from 'react'
import { channelById } from '@/channels/registry'
import { FrameContext } from '@/shell/FrameContext'
import { useShowcase, type ShowcaseTile as Tile } from '@/store/useShowcase'

/** Target rendered height (px) of a device on the board — every frame is scaled to this so a
    row of mixed devices sits on a common baseline. The board itself is then fit to the stage. */
const TILE_H = 470

/** One board tile: the channel's real Preview (live, editable via its normal panels), scaled
    to a common height, with an optional segment badge + caption and a click-to-edit overlay. */
export function ShowcaseTile({ tile }: { tile: Tile }) {
  const def = channelById(tile.channel)
  const Preview = def?.Preview
  const setActive = useShowcase((s) => s.setActive)
  const innerRef = useRef<HTMLDivElement>(null)
  const boxRef = useRef<HTMLDivElement>(null)

  // Scale the frame down to TILE_H and size the flow box to the scaled dimensions (a CSS
  // transform doesn't shrink the layout box on its own, so tiles would otherwise overlap).
  useLayoutEffect(() => {
    const inner = innerRef.current
    const box = boxRef.current
    if (!inner || !box) return
    const fit = () => {
      const w = inner.offsetWidth
      const h = inner.offsetHeight
      if (!w || !h) return
      const scale = TILE_H / h
      inner.style.transform = `scale(${scale})`
      box.style.width = `${Math.round(w * scale)}px`
      box.style.height = `${Math.round(h * scale)}px`
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(inner)
    return () => ro.disconnect()
  }, [])

  if (!Preview) return null
  return (
    <div className="sc-tile">
      {tile.badge && <div className="sc-badge" style={{ background: tile.badgeColor }}>{tile.badge}</div>}
      <div className="sc-frame-box" ref={boxRef}>
        <div className="sc-frame-inner" ref={innerRef}>
          <FrameContext.Provider value={{ captureId: undefined, inShowcase: true }}>
            <Preview />
          </FrameContext.Provider>
        </div>
        {/* Edit overlay — click to open this channel's normal editor (kept out of exports). */}
        <button className="sc-edit-hit" data-html2canvas-ignore="true" onClick={() => setActive(tile.id)} title={`Edit ${def?.label}`}>
          <span>✎ Edit</span>
        </button>
      </div>
      {tile.caption && <div className="sc-caption">{tile.caption}</div>}
    </div>
  )
}
