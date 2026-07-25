import { useLayoutEffect, useRef, type ReactNode } from 'react'
import { useStudio } from '@/store/useStudio'
import { StatusBar } from './StatusBar'

/** Shared device frame. Scales itself down to fit the stage (so the phone is never
    cut off on shorter screens), and persists across channel switches. */
export function PhoneFrame({ children, statusLight = false }: { children: ReactNode; statusLight?: boolean }) {
  const device = useStudio((s) => s.device)
  const sim = useStudio((s) => s.sim)
  const android = device === 'android'
  const fitRef = useRef<HTMLDivElement>(null)
  const phoneRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const fit = fitRef.current
    const phone = phoneRef.current
    const stage = fit?.parentElement
    if (!fit || !phone || !stage) return
    const recompute = () => {
      const availW = stage.clientWidth - 32
      const availH = stage.clientHeight - 32
      const w = phone.offsetWidth
      const h = phone.offsetHeight
      if (!w || !h) return
      const scale = Math.max(0.35, Math.min(1, availW / w, availH / h))
      fit.style.transform = `scale(${scale})`
    }
    recompute()
    const ro = new ResizeObserver(recompute)
    ro.observe(stage)
    ro.observe(phone)
    window.addEventListener('resize', recompute)
    return () => { ro.disconnect(); window.removeEventListener('resize', recompute) }
  }, [device])

  return (
    <div className="stage-fit" ref={fitRef}>
      <div className={'phone' + (android ? ' android' : '')} id="capture" ref={phoneRef}>
        {android ? <div className="punch" /> : <div className="notch" />}
        {sim && <div className="sim-badge">● Simulate — tap the buttons</div>}
        <div className="screen">
          <StatusBar light={statusLight} />
          {children}
          <div className="home-ind" />
        </div>
      </div>
    </div>
  )
}
