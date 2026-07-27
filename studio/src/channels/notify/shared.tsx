import './notify.css'
import type { ReactNode } from 'react'
import { useStudio } from '@/store/useStudio'
import { packFor, cap } from '@/content/model'
import { brandMark, avColor, phImg, hueOf } from '@/lib/util'
import { StatusBar } from '@/shell/StatusBar'

/* Inline icons used by the notify surfaces (lock screen, app backdrop, in-app). */
export const NIcon: Record<string, ReactNode> = {
  lock: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 10V8a6 6 0 0112 0v2h1a1 1 0 011 1v9a1 1 0 01-1 1H5a1 1 0 01-1-1v-9a1 1 0 011-1h1zm2 0h8V8a4 4 0 00-8 0v2z" /></svg>,
  flash: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 2h6l-1 7h4l-9 13 2-9H7z" /></svg>,
  cam: <svg viewBox="0 0 24 24" fill="none"><path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 011 1v9a1 1 0 01-1 1H4a1 1 0 01-1-1V9a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" /><circle cx="12" cy="13" r="3.4" stroke="currentColor" strokeWidth="1.9" /></svg>,
  menu: <svg viewBox="0 0 24 24" fill="none"><path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>,
  search: <svg viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" /><path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>,
  bell: <svg viewBox="0 0 24 24" fill="none"><path d="M6 9a6 6 0 0112 0c0 5 2 6 2 6H4s2-1 2-6zM9.5 20a2.5 2.5 0 005 0" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" /></svg>,
  clear: <svg viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>,
  home: <svg viewBox="0 0 24 24" fill="none"><path d="M4 11l8-6.5L20 11M6 9.5V19a1 1 0 001 1h3v-5h4v5h3a1 1 0 001-1V9.5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  bag: <svg viewBox="0 0 24 24" fill="none"><path d="M6 8h12l1 12H5L6 8zM9 8V6a3 3 0 016 0v2" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  user: <svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="3.4" stroke="currentColor" strokeWidth="1.9" /><path d="M5 20a7 7 0 0114 0" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" /></svg>,
}

/** *bold* + newlines only (matches the notify tool's fmtLite). */
export function fmtLite(s: string): ReactNode {
  return String(s == null ? '' : s).split('\n').map((line, i) => <span key={i}>{i > 0 && <br />}{boldParts(line)}</span>)
}
function boldParts(line: string): ReactNode[] {
  const out: ReactNode[] = []
  let last = 0, k = 0
  const re = /\*([^*]+)\*/g
  let m: RegExpExecArray | null
  while ((m = re.exec(line))) { if (m.index > last) out.push(line.slice(last, m.index)); out.push(<b key={k++}>{m[1]}</b>); last = m.index + m[0].length }
  if (last < line.length) out.push(line.slice(last))
  return out
}
export function oneLine(s: string): string { return (s || '').replace(/[*_~]/g, '').replace(/\s*\n\s*/g, ' ').trim() }

export const WALLS: Record<string, string> = {
  aurora: 'linear-gradient(155deg,#3a1c71,#8a2387 46%,#e94057 82%,#f27121)',
  ocean: 'linear-gradient(160deg,#0f2027,#203a43 50%,#2c5364)',
  dusk: 'linear-gradient(160deg,#5f4b8b,#6a7fbf 42%,#a8c0d8)',
  sunset: 'linear-gradient(160deg,#ee9ca7,#ff746c 50%,#c94b4b)',
  forest: 'linear-gradient(160deg,#134e5e,#3c8c74 55%,#71b280)',
  mono: 'linear-gradient(160deg,#232526,#414345)',
}
export function wallBg(w: string): string {
  if (w && /^(data:|https?:)/.test(w)) return "url('" + w.replace(/'/g, '%27') + "') center/cover"
  return WALLS[w] || WALLS.aurora
}

/** The shared app icon (uploaded logo or generated monogram). */
export function AppIcon({ cls }: { cls: string }) {
  const appName = useStudio((s) => s.notify.appName)
  const appLogo = useStudio((s) => s.notify.appLogo)
  return <img className={cls} src={appLogo || brandMark(appName, 96)} alt={appName} />
}

/** A realistic app home for the current vertical (brand promo + product grid + tab bar). */
export function AppBackdrop() {
  const appName = useStudio((s) => s.notify.appName)
  const ctxId = useStudio((s) => s.ctxId())
  const p = packFor(ctxId)
  const brandColor = useStudio((s) => s.brandColor)
  const bc = brandColor || avColor(appName)
  const tiles = (p?.carousel || []).slice(0, 3)
  return (
    <div className="appbd">
      <StatusBar light={false} />
      <div className="abd-top"><span className="m">{NIcon.menu}</span><span className="tl">{appName}</span><span className="ic">{NIcon.search}{NIcon.bell}</span></div>
      <div className="abd-body">
        <div className="abd-search">{NIcon.search}<span>Search {appName}</span></div>
        <div className="abd-chips"><span className="abd-chip on">For you</span><span className="abd-chip">New</span><span className="abd-chip">Popular</span><span className="abd-chip">Deals</span></div>
        <div className="abd-promo" style={{ backgroundColor: bc }}><span className="orb" /><span className="orb two" /><div className="ey">{appName}</div><div className="hl">{cap(p?.offer || '') || 'New arrivals just dropped'}</div><span className="cta">Shop now</span></div>
        <div className="abd-sec"><span className="t">Popular right now</span><span className="a">See all</span></div>
        <div className="abd-grid">
          {tiles.map((pr, i) => (
            <div key={i} className="abd-tile"><img className="ph" src={phImg(pr[0], null, hueOf(pr[0]), 320, 240)} alt={pr[0]} /><div className="mt"><div className="nm">{pr[0]}</div><div className="pr">{pr[1]}</div></div></div>
          ))}
          <div className="abd-tile more" style={{ backgroundColor: bc }}>View all</div>
        </div>
      </div>
      <div className="abd-nav"><span className="it on">{NIcon.home}<span>Home</span></span><span className="it">{NIcon.search}<span>Search</span></span><span className="it">{NIcon.bag}<span>Bag</span></span><span className="it">{NIcon.user}<span>You</span></span></div>
      <div className="home-ind" />
    </div>
  )
}

export function NeutralAppBackdrop() {
  return (
    <div className="napp"><StatusBar light={false} /><div className="napp-top"><i className="a" /><i className="b" /><i className="c" /></div><div className="napp-hero" /><div className="napp-grid"><i /><i /><i /><i /></div><div className="home-ind" /></div>
  )
}

/** In-App background: branded app home / uploaded screenshot / neutral wireframe (+ blur). */
export function InappBackdrop({ intrusive }: { intrusive: boolean }) {
  const appBg = useStudio((s) => s.notify.appBg)
  let inner: ReactNode
  if (appBg.mode === 'upload' && appBg.image) inner = <div className="ia-shot" style={{ backgroundImage: `url('${appBg.image.replace(/'/g, '%27')}')` }} />
  else if (appBg.mode === 'neutral') inner = <NeutralAppBackdrop />
  else inner = <AppBackdrop />
  return <div className={'ia-bd' + (intrusive && appBg.blur ? ' ia-blur' : '')}>{inner}</div>
}
