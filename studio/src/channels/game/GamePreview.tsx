import './game.css'
import { useEffect, useState, type CSSProperties } from 'react'
import { useAutoTemplate } from '@/lib/useAutoTemplate'
import { useStudio, type NotifyState } from '@/store/useStudio'
import { useToast } from '@/store/useToast'
import { PhoneFrame } from '@/shell/PhoneFrame'
import { AppIcon, NIcon, fmtLite } from '@/channels/notify/shared'
import { GAME_TEMPLATES, applyGameTemplate } from './templates'

type Game = NotifyState['game']

const GM_ACCENTS: Record<string, [string, string]> = {
  scratch: ['#ffd36e', '#f5a623'], wheel: ['#b79cff', '#7c6ef6'], box: ['#6ee7c7', '#22b99a'], slots: ['#ff9ec7', '#f472b6'],
}
// "#ffd36e" -> "255, 211, 110" so CSS can use rgba(var(--gm-accent-rgb), a).
function hexRgb(h: string): string {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec((h || '').trim())
  return m ? `${parseInt(m[1], 16)}, ${parseInt(m[2], 16)}, ${parseInt(m[3], 16)}` : '255, 211, 110'
}

interface Seg { label: string; win: boolean }
function gmSegList(segments: string): Seg[] {
  let rows = (segments || '').split('\n').map((s) => s.trim()).filter(Boolean).map((s) => ({ label: s.replace(/\s*\*+$/, '').trim(), win: /\*+$/.test(s) }))
  if (!rows.length) rows = [{ label: '5% off', win: false }, { label: 'Free gift', win: true }, { label: '2× points', win: false }, { label: '$10 off', win: false }, { label: 'Try again', win: false }, { label: '15% off', win: false }]
  rows = rows.slice(0, 8)
  if (!rows.some((r) => r.win)) rows[0].win = true
  else { let seen = false; rows.forEach((r) => { if (r.win && seen) r.win = false; if (r.win) seen = true }) }
  return rows
}
function gmWinLabel(g: Game): string {
  if (g.type === 'wheel') { const w = gmSegList(g.segments).find((r) => r.win); if (w) return w.label }
  return g.prize || 'You won!'
}

function GzScratch({ g, sim, onTap }: { g: Game; sim: boolean; onTap: () => void }) {
  return (
    <div className={'gz-card' + (sim ? ' clickable' : '')} onClick={onTap}>
      <div className="gz-card-prize"><div className="ic">🎁</div><div className="val">{g.prize || '20% OFF'}</div>{g.prizeCap && <div className="cap">{g.prizeCap}</div>}</div>
      <div className="gz-foil"><svg className="fic" viewBox="0 0 24 24" fill="none"><path d="M12 3c.4 2.6 1 3.2 3.6 3.6C13 7 12.4 7.6 12 10.2 11.6 7.6 11 7 8.4 6.6 11 6.2 11.6 5.6 12 3zM6 13c.3 1.7.7 2.1 2.4 2.4C6.7 15.7 6.3 16.1 6 17.8 5.7 16.1 5.3 15.7 3.6 15.4 5.3 15.1 5.7 14.7 6 13zM18 12c.2 1.3.5 1.6 1.8 1.8-1.3.2-1.6.5-1.8 1.8-.2-1.3-.5-1.6-1.8-1.8 1.3-.2 1.6-.5 1.8-1.8z" fill="currentColor" /></svg><span className="ft">Scratch to reveal</span></div>
    </div>
  )
}

function GzWheel({ g, acc, sim, onTap }: { g: Game; acc: [string, string]; sim: boolean; onTap: () => void }) {
  const segs = gmSegList(g.segments)
  const N = segs.length, a = 360 / N, R = 100, cx = 100, cy = 100
  const P = (ang: number, r: number): [number, number] => [cx + r * Math.sin(ang * Math.PI / 180), cy - r * Math.cos(ang * Math.PI / 180)]
  const paths: string[] = [], labels: { x: number; y: number; rot: number; fill: string; text: string }[] = []
  let winMid = 0
  segs.forEach((s, i) => {
    const t1 = i * a, t2 = (i + 1) * a, mid = (i + 0.5) * a
    const [x1, y1] = P(t1, R), [x2, y2] = P(t2, R)
    const fill = s.win ? 'url(#gzWin)' : (i % 2 ? '#1a1f3a' : '#131735')
    paths.push(`M${cx} ${cy} L${x1.toFixed(2)} ${y1.toFixed(2)} A${R} ${R} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z|${fill}`)
    const [lx, ly] = P(mid, 60); let rot = mid; if (mid > 90 && mid < 270) rot = mid + 180
    const lab = s.label.length > 11 ? s.label.slice(0, 11) : s.label
    labels.push({ x: lx, y: ly, rot, fill: s.win ? '#12142a' : '#ffffff', text: lab })
    if (s.win) winMid = mid
  })
  const spin = (360 * 5 - winMid).toFixed(1)
  return (
    <div className={'gz-wheelwrap' + (sim ? ' clickable' : '')} onClick={onTap}>
      <div className="gz-pointer" />
      <div className="gz-wheel" style={{ ['--spin']: `${spin}deg` } as CSSProperties}>
        <svg viewBox="0 0 200 200" width="100%" height="100%">
          <defs><linearGradient id="gzWin" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={acc[0]} /><stop offset="1" stopColor={acc[1]} /></linearGradient></defs>
          {paths.map((p, i) => { const [d, fill] = p.split('|'); return <path key={i} d={d} fill={fill} stroke="rgba(255,255,255,.09)" strokeWidth="1" /> })}
          {labels.map((l, i) => <text key={i} x={l.x.toFixed(2)} y={l.y.toFixed(2)} fill={l.fill} fontSize="8.4" fontWeight="800" textAnchor="middle" dominantBaseline="middle" transform={`rotate(${l.rot.toFixed(1)} ${l.x.toFixed(2)} ${l.y.toFixed(2)})`}>{l.text}</text>)}
        </svg>
      </div>
      <div className="gz-hub">SPIN</div>
    </div>
  )
}

function GzBox({ sim, onTap }: { sim: boolean; onTap: () => void }) {
  return <div className={'gz-box' + (sim ? ' clickable' : '')} onClick={onTap}><div className="gz-box-glow" /><div className="gz-box-pop">🎉</div><div className="gz-box-b" /><div className="gz-box-lid" /></div>
}

function GzSlots({ sim, onTap }: { sim: boolean; onTap: () => void }) {
  const jack = '💎', fill = ['🍒', '7️⃣', '⭐', '🔔', '🍋', '🪙']
  const reel = (ri: number) => {
    const syms: string[] = []
    for (let i = 0; i < 8; i++) syms.push(fill[(i + ri * 3) % fill.length])
    syms.push(jack)
    return <div className="gz-reel" key={ri}><div className="gz-strip" style={{ ['--rest']: '-74px', ['--stop']: `${-8 * 74}px` } as CSSProperties}>{syms.map((s, i) => <span key={i}>{s}</span>)}</div></div>
  }
  return <div className={'gz-slots' + (sim ? ' clickable' : '')} onClick={onTap}>{[0, 1, 2].map(reel)}</div>
}

function GzConfetti() {
  const cols = ['var(--gm-accent)', '#ffffff', '#7c6ef6', '#f472b6', '#34d399']
  const items = []
  for (let i = 0; i < 26; i++) {
    const left = (i * 11) % 100
    const dur = (2.4 + (i % 6) * 0.35).toFixed(2)
    const delay = ((i % 9) * 0.11).toFixed(2)
    const col = cols[i % cols.length]
    const w = 5 + (i % 3)
    items.push(<i key={i} style={{ left: `${left}%`, background: col, width: w, height: w + 4, animationDuration: `${dur}s`, animationDelay: `${delay}s` }} />)
  }
  return <div className="gz-confetti">{items}</div>
}

export function GamePreview() {
  const ctxId = useStudio((s) => s.ctxId())
  useAutoTemplate(ctxId, () => applyGameTemplate(GAME_TEMPLATES[0], false))

  const g = useStudio((s) => s.notify.game)
  const appName = useStudio((s) => s.notify.appName)
  const sim = useStudio((s) => s.sim)
  const show = useToast((s) => s.show)
  const [revealed, setRevealed] = useState(false)
  useEffect(() => { setRevealed(false) }, [sim, g.type, g.segments])

  const acc = GM_ACCENTS[g.type] || GM_ACCENTS.scratch
  const winLabel = gmWinLabel(g)
  const onTap = () => { if (!sim || revealed) return; setRevealed(true); show('🎉 ' + winLabel + ' — ' + appName) }
  const hint = g.type === 'wheel' ? 'Tap SPIN to play' : g.type === 'box' ? 'Tap the box to open' : g.type === 'slots' ? 'Tap to spin' : 'Scratch the card'
  const capText = g.type === 'wheel' ? '' : (g.prizeCap ? ` · ${g.prizeCap}` : '')

  const play = g.type === 'wheel' ? <GzWheel g={g} acc={acc} sim={sim} onTap={onTap} />
    : g.type === 'box' ? <GzBox sim={sim} onTap={onTap} />
    : g.type === 'slots' ? <GzSlots sim={sim} onTap={onTap} />
    : <GzScratch g={g} sim={sim} onTap={onTap} />

  return (
    <PhoneFrame bare badge="● Simulate — tap to play">
      <div className={'gz' + (revealed ? ' revealed' : '')} style={{ ['--gm-accent']: acc[0], ['--gm-accent-2']: acc[1], ['--gm-accent-rgb']: hexRgb(acc[0]) } as CSSProperties}>
        <div className="gz-top"><AppIcon cls="gz-ic" /><span className="gz-nm">{appName}</span>{g.close && <div className="gz-x">{NIcon.clear}</div>}</div>
        <div className="gz-stage">
          {g.eyebrow && <div className="gz-eyebrow">{g.eyebrow}</div>}
          {g.headline && <div className="gz-hl">{fmtLite(g.headline)}</div>}
          {g.sub && <div className="gz-sub">{g.sub}</div>}
          <div className="gz-play">{play}</div>
          <div className="gz-hint">{hint}</div>
          <div className="gz-win"><div className="gz-prize-pill"><span className="gz-star">★</span> {winLabel}{capText}</div>{g.cta && <button className="gz-cta">{g.cta}</button>}<div className="gz-terms">T&amp;Cs apply</div></div>
        </div>
        <GzConfetti />
      </div>
    </PhoneFrame>
  )
}
