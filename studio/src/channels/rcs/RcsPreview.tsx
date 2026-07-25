import { useStudio } from '@/store/useStudio'
import { useAutoTemplate } from '@/lib/useAutoTemplate'
import { PhoneFrame } from '@/shell/PhoneFrame'
import { GoogleMessages, IOSMessages } from '@/channels/messaging/screen'
import { RCS_TEMPLATES, applyRcsTemplate } from './templates'

export function RcsPreview() {
  const ctxId = useStudio((s) => s.ctxId())
  useAutoTemplate(ctxId, () => applyRcsTemplate(RCS_TEMPLATES[0], false))

  const device = useStudio((s) => s.device)
  return (
    <PhoneFrame>
      {device === 'android'
        ? <GoogleMessages channel="rcs" isSms={false} />
        : <IOSMessages channel="rcs" isRcs={true} />}
    </PhoneFrame>
  )
}
