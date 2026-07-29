import { createContext, useContext } from 'react'

/** Context the device frames (PhoneFrame / DesktopFrame) read so the SAME Preview can be
    rendered either as the single-channel stage (default: it owns `id="capture"`) or as one
    of several tiles on the Showcase board (no id — the board itself is the capture target,
    and `inShowcase` lets per-Preview effects like the auto-first-template opt out). */
export interface FrameCtx {
  /** id set on the frame's root; `undefined` inside a Showcase tile so ids don't collide. */
  captureId?: string
  /** true when the frame is a Showcase tile (not the single-channel stage). */
  inShowcase: boolean
}

export const FrameContext = createContext<FrameCtx>({ captureId: 'capture', inShowcase: false })
export const useFrameCtx = () => useContext(FrameContext)
