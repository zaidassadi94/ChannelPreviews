import { useEffect } from 'react'
import { useStudio } from '@/store/useStudio'
import { dominantColor } from '@/lib/dominantColor'

/** The logo image that represents the brand on the active channel. */
export function currentLogo(s: ReturnType<typeof useStudio.getState>): string | null {
  switch (s.channel) {
    case 'inapp':
    case 'push':
    case 'game': return s.notify.appLogo
    case 'webpush': return s.webpush.logo
    case 'osm': return s.osm.logo
    case 'gmail': return s.gmail.logo
    case 'cards': return s.cards.logo
    case 'instagram': return s.ig.logo
    case 'facebook': return s.fb.logo
    default: return s.brand.logo   // whatsapp / rcs / sms
  }
}

/** While the brand color is in auto mode, keep it matched to the current logo's
    dominant color. Runs once (mounted in AppShell); re-derives whenever the
    active logo changes or auto is re-enabled. Falls back to whatever the color
    already is when a logo is absent or can't be read. */
export function useAutoBrandColor() {
  const channel = useStudio((s) => s.channel)
  const logo = useStudio(currentLogo)
  const auto = useStudio((s) => s.brandColorAuto)
  const autoSetBrandColor = useStudio((s) => s.autoSetBrandColor)

  useEffect(() => {
    if (!auto || !logo) return
    let cancelled = false
    dominantColor(logo).then((c) => { if (c && !cancelled) autoSetBrandColor(c) })
    return () => { cancelled = true }
  }, [channel, logo, auto, autoSetBrandColor])
}
