import type { ReactNode } from 'react'
import { useStudio } from '@/store/useStudio'
import { StatusBar } from './StatusBar'

/** Phone device chrome (notch/punch, status bar, home indicator, simulate badge).
    A channel Preview wraps its screen in this. Scaling to fit is handled by <StageFit>.
    `bare` skips the shared status bar + home indicator (the channel draws its own full
    screen — e.g. the notify lock screen / app backdrop); `badge` overrides the sim label. */
export function PhoneFrame({ children, statusLight = false, bare = false, badge }: {
  children: ReactNode; statusLight?: boolean; bare?: boolean; badge?: string
}) {
  const device = useStudio((s) => s.device)
  const sim = useStudio((s) => s.sim)
  const android = device === 'android'
  return (
    <div className={'phone' + (android ? ' android' : '') + (bare ? ' bare' : '')} id="capture">
      {android ? <div className="punch" /> : <div className="notch" />}
      {sim && <div className="sim-badge">{badge || '● Simulate — tap the buttons'}</div>}
      <div className="screen">
        {bare ? children : (<><StatusBar light={statusLight} />{children}<div className="home-ind" /></>)}
      </div>
    </div>
  )
}
