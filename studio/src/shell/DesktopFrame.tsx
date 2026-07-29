import type { ReactNode } from 'react'
import { useStudio } from '@/store/useStudio'
import { useFrameCtx } from './FrameContext'

/** Desktop browser chrome (traffic lights + URL pill). A web channel (Gmail desktop,
    OSM) wraps its screen in this; the shell scales it via <StageFit>. */
export function DesktopFrame({ children, url = 'mail.google.com/mail/u/0/#inbox', width = 1180 }: {
  children: ReactNode; url?: string; width?: number
}) {
  const sim = useStudio((s) => s.sim)
  const { captureId } = useFrameCtx()
  return (
    <div className="deskframe" id={captureId} style={{ width }}>
      <div className="browser-bar">
        <div className="traffic"><i className="r" /><i className="y" /><i className="g" /></div>
        <div className="url-pill">🔒 {url}</div>
      </div>
      {sim && <div className="sim-badge">● Simulate — tap the buttons</div>}
      <div className="deskframe-body">{children}</div>
    </div>
  )
}
