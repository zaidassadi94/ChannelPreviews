import type { ReactNode } from 'react'
import { useStudio } from '@/store/useStudio'
import { StatusBar } from './StatusBar'

/** Shared device frame (notch/punch, status bar, home indicator, simulate badge).
    Persists across channel switches — only its children change. */
export function PhoneFrame({ children, statusLight = false }: { children: ReactNode; statusLight?: boolean }) {
  const device = useStudio((s) => s.device)
  const sim = useStudio((s) => s.sim)
  const android = device === 'android'
  return (
    <div className={'phone' + (android ? ' android' : '')} id="capture">
      {android ? <div className="punch" /> : <div className="notch" />}
      {sim && <div className="sim-badge">● Simulate — tap the buttons</div>}
      <div className="screen">
        <StatusBar light={statusLight} />
        {children}
        <div className="home-ind" />
      </div>
    </div>
  )
}
