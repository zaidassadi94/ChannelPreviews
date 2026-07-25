import { useStudio } from '@/store/useStudio'
import { useAutoTemplate } from '@/lib/useAutoTemplate'
import { PhoneFrame } from '@/shell/PhoneFrame'
import { GoogleMessages, IOSMessages } from '@/channels/messaging/screen'
import { SMS_TEMPLATES, applySmsTemplate } from './templates'

export function SmsPreview() {
  const ctxId = useStudio((s) => s.ctxId())
  useAutoTemplate(ctxId, () => applySmsTemplate(SMS_TEMPLATES[0], false))

  const device = useStudio((s) => s.device)
  return (
    <PhoneFrame>
      {device === 'android'
        ? <GoogleMessages channel="sms" isSms={true} />
        : <IOSMessages channel="sms" isRcs={false} />}
    </PhoneFrame>
  )
}
