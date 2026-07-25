import { useLayoutEffect, useRef, type ReactNode } from 'react'
import { useStudio } from '@/store/useStudio'

/** Scales whatever frame a channel renders (phone, desktop, ad card…) down to fit
    the stage, so nothing is ever cut off. The frame itself is channel-owned. */
export function StageFit({ children }: { children: ReactNode }) {
  const device = useStudio((s) => s.device)
  const channel = useStudio((s) => s.channel)
  const fitRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const fit = fitRef.current
    const stage = fit?.parentElement
    if (!fit || !stage) return
    const recompute = () => {
      const availW = stage.clientWidth - 32
      const availH = stage.clientHeight - 32
      const w = fit.offsetWidth
      const h = fit.offsetHeight
      if (!w || !h) return
      const scale = Math.max(0.3, Math.min(1, availW / w, availH / h))
      fit.style.transform = `scale(${scale})`
    }
    recompute()
    const ro = new ResizeObserver(recompute)
    ro.observe(stage)
    ro.observe(fit)
    window.addEventListener('resize', recompute)
    return () => { ro.disconnect(); window.removeEventListener('resize', recompute) }
  }, [device, channel])

  return <div className="stage-fit" ref={fitRef}>{children}</div>
}
