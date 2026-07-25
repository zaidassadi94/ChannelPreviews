import { useEffect, useRef } from 'react'
import { useStudio } from '@/store/useStudio'

/** Auto-apply a channel's first template on load and whenever the industry/sub (ctxId)
 *  changes — the behaviour every channel Preview shares.
 *
 *  Studio gotcha it solves: an AI generation sets the industry AND the slice content. The
 *  industry change would fire this effect and the default template would clobber the AI
 *  copy. `aiSuppressCtx` (set by the AI adapter before it changes the industry) makes this
 *  deterministic: whichever runs first — this effect or the AI content write — the default
 *  template is skipped for that one ctx, so AI content always wins regardless of ordering. */
export function useAutoTemplate(ctxId: string, apply: () => void) {
  const lastCtx = useRef<string | null>(null)
  const applyRef = useRef(apply)
  applyRef.current = apply
  useEffect(() => {
    if (lastCtx.current === ctxId) return
    lastCtx.current = ctxId
    const st = useStudio.getState()
    if (st.aiSuppressCtx === ctxId) { st.clearAiSuppress(); return }
    applyRef.current()
  }, [ctxId])
}
