import { useEffect, useRef } from 'react'
import { useStudio } from '@/store/useStudio'
import { PhoneFrame } from '@/shell/PhoneFrame'
import { GoogleMessages, IOSMessages } from '@/channels/messaging/screen'
import { SMS_TEMPLATES, applySmsTemplate } from './templates'

export function SmsPreview() {
  const ctxId = useStudio((s) => s.ctxId())
  const lastCtx = useRef<string | null>(null)
  useEffect(() => {
    if (lastCtx.current === ctxId) return
    lastCtx.current = ctxId
    applySmsTemplate(SMS_TEMPLATES[0], false)
  }, [ctxId])

  const device = useStudio((s) => s.device)
  return (
    <PhoneFrame>
      {device === 'android'
        ? <GoogleMessages channel="sms" isSms={true} />
        : <IOSMessages channel="sms" isRcs={false} />}
    </PhoneFrame>
  )
}
