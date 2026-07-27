import './osm.css'
import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { useAutoTemplate } from '@/lib/useAutoTemplate'
import { useStudio, type OsmState } from '@/store/useStudio'
import { useToast } from '@/store/useToast'
import { PhoneFrame } from '@/shell/PhoneFrame'
import { DesktopFrame } from '@/shell/DesktopFrame'
import { StatusBar } from '@/shell/StatusBar'
import { packFor, cap } from '@/content/model'
import { avColor, brandMark, phImg, hueOf } from '@/lib/util'
import { fmtLite } from '@/channels/notify/shared'
import { OSM_TEMPLATES, applyOsmTemplate } from './templates'

const OI: Record<string, ReactNode> = {
  menu: <svg viewBox="0 0 24 24" fill="none"><path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>,
  search: <svg viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" /><path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>,
  cart: <svg viewBox="0 0 24 24" fill="none"><path d="M4 5h2l2 12h10l2-8H7" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" /><circle cx="9" cy="20" r="1.4" fill="currentColor" /><circle cx="18" cy="20" r="1.4" fill="currentColor" /></svg>,
  user: <svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="3.4" stroke="currentColor" strokeWidth="1.9" /><path d="M5 20a7 7 0 0114 0" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" /></svg>,
  lock: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 10V8a6 6 0 0112 0v2h1a1 1 0 011 1v9a1 1 0 01-1 1H5a1 1 0 01-1-1v-9a1 1 0 011-1h1zm2 0h8V8a4 4 0 00-8 0v2z" /></svg>,
  x: <svg viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>,
}

const INTRUSIVE: Record<string, boolean> = { popup: true, full: true, survey: true }

function useOsmSim() {
  const sim = useStudio((s) => s.sim)
  const show = useToast((s) => s.show)
  return { sim, onTap: (label: string) => { if (!sim) return; show('▸ ' + (label ? `"${label}"` : 'Interacted')) } }
}

/* ---------- countdown ---------- */
function parseSecs(v: string): number | null { const m = /(\d{1,2}):(\d{2}):(\d{2})/.exec(v || ''); return m ? +m[1] * 3600 + +m[2] * 60 + +m[3] : null }
function Countdown({ value }: { value: string }) {
  const secs = parseSecs(value)
  const [rem, setRem] = useState(secs ?? 0)
  useEffect(() => {
    const s = parseSecs(value); setRem(s ?? 0)
    if (s == null) return
    const t = setInterval(() => setRem((r) => Math.max(0, r - 1)), 1000)
    return () => clearInterval(t)
  }, [value])
  if (secs == null) return null
  const pad = (n: number) => String(n).padStart(2, '0')
  const h = Math.floor(rem / 3600), mn = Math.floor((rem % 3600) / 60), sc = rem % 60
  return <div className="osm-cd-wrap"><div className="osm-cd-unit"><b>{pad(h)}</b><span>Hrs</span></div><div className="osm-cd-unit"><b>{pad(mn)}</b><span>Min</span></div><div className="osm-cd-unit"><b>{pad(sc)}</b><span>Sec</span></div></div>
}

/* ---------- backdrops ---------- */
function SiteBackdrop({ mobile }: { mobile: boolean }) {
  const o = useStudio((s) => s.osm)
  const ctxId = useStudio((s) => s.ctxId())
  const p = packFor(ctxId)
  const bc = avColor(o.site)
  const cards = (p?.carousel || []).slice(0, mobile ? 2 : 4)
  return (
    <div className={'site' + (mobile ? ' mob' : '')} style={{ ['--bc']: bc } as CSSProperties}>
      <div className="site-nav"><div className="lg"><img src={o.logo || brandMark(o.site, 96)} alt="" /><b>{o.site}</b></div>
        <div className="links"><a>Shop</a><a>New</a><a>Sale</a><a>About</a></div>
        <div className="act">{OI.search}{OI.user}{OI.cart}</div></div>
      <div className="site-hero" style={{ backgroundColor: bc }}><span className="orb" /><span className="orb two" />
        <div className="ey">{o.site}</div><div className="hl">{cap(p?.offer || '') || 'New season, new arrivals'}</div><span className="cta">Shop now</span></div>
      <div className="site-sec"><span className="t">Popular right now</span><span className="a">View all</span></div>
      <div className="site-grid">{cards.map((pr, i) => <div className="site-card" key={i}><img className="ph" src={phImg(pr[0], null, hueOf(pr[0]), 320, 240)} alt={pr[0]} /><div className="mt"><div className="nm">{pr[0]}</div><div className="pr">{pr[1] || ''}</div></div></div>)}</div>
    </div>
  )
}
function NeutralBackdrop({ mobile }: { mobile: boolean }) {
  const cells = Array.from({ length: mobile ? 4 : 8 })
  return <div className="neu"><div className="neu-bar"><div className="b1" /><div className="b2" /><div className="b3" /></div><div className="neu-hero" /><div className={'neu-grid' + (mobile ? ' mob' : '')}>{cells.map((_, i) => <div className="neu-cell" key={i} />)}</div></div>
}
function Backdrop({ mobile }: { mobile: boolean }) {
  const o = useStudio((s) => s.osm)
  if (o.bg === 'upload' && o.bgImage) return <div className="shot" style={{ backgroundImage: `url('${o.bgImage.replace(/'/g, '%27')}')` }} />
  if (o.bg === 'neutral') return <NeutralBackdrop mobile={mobile} />
  return <SiteBackdrop mobile={mobile} />
}

/* ---------- overlay pieces ---------- */
function XBtn({ dark }: { dark?: boolean }) { const { sim, onTap } = useOsmSim(); return <div className={'osm-x ' + (dark ? 'dark' : '') + (sim ? ' clickable' : '')} onClick={() => onTap('Dismiss')}>{OI.x}</div> }
function CtaBtn({ o, block }: { o: OsmState; block?: boolean }) { const { sim, onTap } = useOsmSim(); return o.cta ? <button className={'osm-btn ' + (block ? 'block' : '') + (sim ? ' clickable' : '')} onClick={() => onTap(o.cta)}>{o.cta}</button> : null }
function Cta2Link({ o }: { o: OsmState }) { const { sim, onTap } = useOsmSim(); return o.cta2 ? <div className={'osm-btn2' + (sim ? ' clickable' : '')} onClick={() => onTap(o.cta2)}>{o.cta2}</div> : null }
function InputRow({ o }: { o: OsmState }) { const { sim, onTap } = useOsmSim(); if (!o.input) return null; return <div className="osm-input"><input type="text" placeholder="Enter your email" readOnly />{o.cta && <button className={'osm-btn' + (sim ? ' clickable' : '')} onClick={() => onTap(o.cta)}>{o.cta}</button>}</div> }

function OvPopup() {
  const o = useStudio((s) => s.osm)
  return (
    <div className="osm-center"><div className="osm-modal"><XBtn dark={!o.image} />{o.image && <img className="img" src={o.image} alt="" />}<div className="bd">
      {o.headline && <div className="hl">{o.headline}</div>}
      {o.body && <div className="tx">{fmtLite(o.body)}</div>}
      {o.code && <div className="osm-code">{o.code}</div>}
      {o.countdown && <Countdown value={o.countdown} />}
      {o.input ? <InputRow o={o} /> : (o.cta ? <div style={{ marginTop: 18 }}><CtaBtn o={o} block /></div> : null)}
      <Cta2Link o={o} />
    </div></div></div>
  )
}
function OvBanner({ pos }: { pos: string }) {
  const o = useStudio((s) => s.osm)
  const { sim, onTap } = useOsmSim()
  return (
    <div className={'osm-banner ' + pos}>
      <div className="msg">{o.headline && <span>{fmtLite(o.headline)}</span>}{o.countdown && <Countdown value={o.countdown} />}</div>
      {o.cta && <div className={'cta' + (sim ? ' clickable' : '')} onClick={() => onTap(o.cta)}>{o.cta}</div>}
      {o.cta2 && <div className={'cta ghost' + (sim ? ' clickable' : '')} onClick={() => onTap(o.cta2)}>{o.cta2}</div>}
      <div className={'bx' + (sim ? ' clickable' : '')} onClick={() => onTap('Dismiss')}>{OI.x}</div>
    </div>
  )
}
function OvNudge() {
  const o = useStudio((s) => s.osm)
  const { sim, onTap } = useOsmSim()
  return (
    <div className="osm-nudge"><div className={'nx' + (sim ? ' clickable' : '')} onClick={() => onTap('Dismiss')}>{OI.x}</div>
      <div className="row">{o.image && <img className="thumb" src={o.image} alt="" />}<div className="tx">
        {o.headline && <div className="hl">{o.headline}</div>}
        {o.body && <div className="bd">{fmtLite(o.body)}</div>}
        {o.cta && <span className={'cta' + (sim ? ' clickable' : '')} onClick={() => onTap(o.cta)}>{o.cta}</span>}
        <Cta2Link o={o} />
      </div></div>
    </div>
  )
}
function OvFull() {
  const o = useStudio((s) => s.osm)
  const src = o.image || phImg(o.site, null, hueOf(o.site), 1200, 900)
  return (
    <div className="osm-full"><img className="osm-full-img" src={src} alt="" /><div className="scrim" /><XBtn />
      <div className="in">{o.headline && <div className="hl">{o.headline}</div>}{o.body && <div className="tx">{fmtLite(o.body)}</div>}{o.countdown && <Countdown value={o.countdown} />}<div><CtaBtn o={o} /></div><Cta2Link o={o} /></div>
    </div>
  )
}
function OvSurvey() {
  const o = useStudio((s) => s.osm)
  const { sim, onTap } = useOsmSim()
  const [rated, setRated] = useState<number | null>(null)
  const emo = ['😞', '🙁', '😐', '🙂', '😍']
  const active = rated ?? o.rating
  return (
    <div className="osm-center"><div className="osm-modal sm"><XBtn dark /><div className="bd">
      {o.headline && <div className="hl">{o.headline}</div>}
      {o.body && <div className="tx">{fmtLite(o.body)}</div>}
      <div className="osm-rate">{emo.map((e, i) => <span key={i} className={'e' + (sim && i + 1 === active ? ' on' : '') + (sim ? ' clickable' : '')} onClick={() => { if (!sim) return; setRated(i + 1); onTap('Rated ' + (i + 1) + '/5') }}>{e}</span>)}</div>
      <div className="osm-scale"><span>{o.scaleLo || 'Not likely'}</span><span>{o.scaleHi || 'Very likely'}</span></div>
      <div style={{ marginTop: 20 }}><CtaBtn o={o} block /></div>
    </div></div></div>
  )
}

function Overlay() {
  const f = useStudio((s) => s.osm.format)
  if (f === 'bannerTop') return <OvBanner pos="top" />
  if (f === 'bannerBottom') return <OvBanner pos="bottom" />
  if (f === 'nudge') return <OvNudge />
  if (f === 'full') return <OvFull />
  if (f === 'survey') return <OvSurvey />
  return <OvPopup />
}

function StageInner({ mobile }: { mobile: boolean }) {
  const o = useStudio((s) => s.osm)
  const intrusive = !!INTRUSIVE[o.format]
  const brand = o.accent || avColor(o.site)
  return (
    <div className="osm-brand" style={{ position: 'absolute', inset: 0, ['--brand']: brand } as CSSProperties}>
      {o.format !== 'full' && <><div className={'osm-canvas' + (intrusive ? ' dim' + (o.blur ? ' blurred' : '') : '')}><Backdrop mobile={mobile} /></div>{intrusive && <div className="osm-scrim" />}</>}
      <Overlay />
    </div>
  )
}

export function OsmPreview() {
  const ctxId = useStudio((s) => s.ctxId())
  useAutoTemplate(ctxId, () => applyOsmTemplate(OSM_TEMPLATES[0], false))

  const device = useStudio((s) => s.osm.device)
  const url = useStudio((s) => s.osm.url)

  if (device === 'mobile') {
    return (
      <PhoneFrame bare>
        <StatusBar light={false} />
        <div className="osm-mbar"><span>{OI.lock}</span><div className="u">{OI.lock}<span>{url || 'example.com'}</span></div><span>{OI.menu}</span></div>
        <div className="osm-mview"><StageInner mobile={true} /></div>
        <div className="home-ind" />
      </PhoneFrame>
    )
  }
  return (
    <DesktopFrame url={url || 'example.com'} width={1040}>
      <div className="osm-view"><StageInner mobile={false} /></div>
    </DesktopFrame>
  )
}
