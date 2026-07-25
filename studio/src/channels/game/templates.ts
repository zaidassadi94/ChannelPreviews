import { useStudio } from '@/store/useStudio'
import { useToast } from '@/store/useToast'
import { type Pack, packFor } from '@/content/model'

export interface GameBuild { type: string; eyebrow: string; headline: string; sub: string; prize: string; prizeCap: string; cta: string; segments?: string }
export interface GameTemplate {
  name: string
  type: string
  icon: string
  desc: string
  build: (p: Pack) => GameBuild
}

export const GAME_TEMPLATES: GameTemplate[] = [
  {
    name: 'Scratch card', type: 'scratch', icon: '🎟️', desc: 'Scratch the foil to reveal a prize',
    build: (p) => ({ type: 'scratch', eyebrow: 'A card with your name on it', headline: 'Scratch. Reveal. Smile.', sub: `We tucked a reward under the foil — see what ${p.brand} saved for you.`, prize: '20% OFF', prizeCap: p.code ? `use ${p.code}` : 'your next order', cta: 'Reveal my reward' }),
  },
  {
    name: 'Spin the wheel', type: 'wheel', icon: '🎡', desc: 'Give the wheel a spin',
    build: () => ({ type: 'wheel', eyebrow: 'Your daily spin is ready', headline: 'One spin. You always win.', sub: 'Every wedge is a reward — the only question is which one lands.', prize: 'Free delivery', prizeCap: 'unlocked for you', segments: '5% off\nFree delivery *\n2× points\n$10 off\nMystery gift\n15% off', cta: 'Spin the wheel' }),
  },
  {
    name: 'Mystery box', type: 'box', icon: '🎁', desc: 'Tap to unwrap your gift',
    build: (p) => ({ type: 'box', eyebrow: 'Something just landed for you', headline: 'A little gift, just because', sub: `Tap to unwrap — no catch, all yours from ${p.brand}.`, prize: '500 points', prizeCap: 'added instantly', cta: 'Open my gift' }),
  },
  {
    name: 'Slot machine', type: 'slots', icon: '🎰', desc: 'Match three to hit the jackpot',
    build: () => ({ type: 'slots', eyebrow: 'Feeling lucky today?', headline: 'Line up three. Win big.', sub: 'One pull — match the reels and the jackpot is yours.', prize: '$50 off', prizeCap: 'jackpot', cta: 'Pull to win' }),
  },
]

export function applyGameTemplate(t: GameTemplate, announce = true) {
  const s = useStudio.getState()
  const p = packFor(s.ctxId())
  if (!p) return
  const f = t.build(p)
  s.setNotify({ appName: p.brand })
  s.setGame({ type: f.type, eyebrow: f.eyebrow, headline: f.headline, sub: f.sub, prize: f.prize, prizeCap: f.prizeCap, cta: f.cta, close: true, ...(f.segments != null ? { segments: f.segments } : {}) })
  if (announce) useToast.getState().show('Template applied · hit Simulate to play')
}
