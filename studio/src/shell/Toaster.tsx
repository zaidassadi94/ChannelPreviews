import { useToast } from '@/store/useToast'

export function Toaster() {
  const msg = useToast((s) => s.msg)
  const visible = useToast((s) => s.visible)
  return <div className={'toast' + (visible ? ' show' : '')}>{msg}</div>
}
