import { useEffect, useRef } from 'react'
import { useStudio } from '@/store/useStudio'
import { PhoneFrame } from '@/shell/PhoneFrame'
import { GoogleMessages, IOSMessages } from '@/channels/messaging/screen'
import { RCS_TEMPLATES, applyRcsTemplate } from './templates'

export function RcsPreview() {
  const ctxId = useStudio((s) => s.ctxId())
  const lastCtx = useRef<string | null>(null)
  useEffect(() => {
    if (lastCtx.current === ctxId) return
    lastCtx.current = ctxId
    applyRcsTemplate(RCS_TEMPLATES[0], false)
  }, [ctxId])

  const device = useStudio((s) => s.device)
  return (
    <PhoneFrame>
      {device === 'android'
        ? <GoogleMessages channel="rcs" isSms={false} />
        : <IOSMessages channel="rcs" isRcs={true} />}
    </PhoneFrame>
  )
}
