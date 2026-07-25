import { useEffect, useRef } from 'react'
import { useStudio } from '@/store/useStudio'
import { useToast } from '@/store/useToast'

const RECORD_SVG = '<svg viewBox="0 0 24 24" fill="currentColor" style="width:12px;height:12px"><circle cx="12" cy="12" r="7"/></svg>'

/** Attaches the shared vanilla screen-recorder (`public/recorder.js`) to a button and
 *  returns a ref to spread onto a CHILDLESS `<button className="btn ghost">`.
 *
 *  The recorder owns that button imperatively: it fills the innerHTML (Record ⇄
 *  "Stop · 0:12" timer), toggles the red `.cs-recording` class, and injects its review
 *  studio (filmstrip trim + WebM/GIF export) on stop. So React must NOT manage the
 *  button's children or className — keep them static/empty and React never clobbers the
 *  recorder's DOM on re-render.
 *
 *  Degrades gracefully: when the recorder isn't present (artifact CSP, or the `<script>`
 *  didn't load) the button still shows "Record" and toasts a friendly note. Filename and
 *  toast read LIVE store state (init runs once), so the download name always matches the
 *  channel/industry/device visible at record time. */
export function useRecorder() {
  const ref = useRef<HTMLButtonElement>(null)
  const inited = useRef(false)

  useEffect(() => {
    if (inited.current) return // guard React StrictMode's double-invoke (dev) — attach once
    const btn = ref.current
    if (!btn) return
    inited.current = true

    const R = window.ChannelStudioRecorder
    if (R && R.init) {
      R.init({
        button: btn,
        getEl: () => document.getElementById('capture'),
        filename: () => {
          const s = useStudio.getState()
          return `${s.channel}-${s.sub || s.industry}-${s.device}`
        },
        toast: (m) => useToast.getState().show(m),
      })
    } else {
      btn.innerHTML = RECORD_SVG + 'Record'
      btn.onclick = () => useToast.getState().show('Screen recording runs in the deployed app (Chrome or Edge).')
    }
  }, [])

  return ref
}
