import './webpush.css'
import type { ReactNode, CSSProperties } from 'react'
import { useStudio } from '@/store/useStudio'
import { useToast } from '@/store/useToast'
import { useAutoTemplate } from '@/lib/useAutoTemplate'
import { DesktopFrame } from '@/shell/DesktopFrame'
import { packFor, cap } from '@/content/model'
import { brandMark, avColor, phImg, hueOf } from '@/lib/util'
import { fmtLite } from '@/channels/notify/shared'
import { WEBPUSH_TEMPLATES, applyWebpushTemplate } from './templates'

const WI: Record<string, ReactNode> = {
  x: <svg viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>,
  chrome: (
    <svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="10" fill="#fff" /><circle cx="24" cy="24" r="6" fill="#4285f4" />
      <path d="M24 4a20 20 0 0117.3 10H24a10 10 0 00-8.66 5L6.7 14A20 20 0 0124 4z" fill="#ea4335" />
      <path d="M4 24a20 20 0 019.34-16.9l8.66 15A10 10 0 0024 34a10 10 0 002.5-.32L18 45.6A20 20 0 014 24z" fill="#34a853" />
      <path d="M41.3 14A20 20 0 0126.5 45.6L33 30a10 10 0 00-1-14z" fill="#fbbc05" /></svg>
  ),
  search: <svg viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" /><path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>,
  cart: <svg viewBox="0 0 24 24" fill="none"><path d="M4 5h2l2 12h10l2-8H7" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" /><circle cx="9" cy="20" r="1.4" fill="currentColor" /><circle cx="18" cy="20" r="1.4" fill="currentColor" /></svg>,
  user: <svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="3.4" stroke="currentColor" strokeWidth="1.9" /><path d="M5 20a7 7 0 0114 0" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" /></svg>,
  bell: <svg viewBox="0 0 24 24" fill="none"><path d="M6 9a6 6 0 0112 0c0 5 2 6 2 6H4s2-1 2-6zM9.5 20a2.5 2.5 0 005 0" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" /></svg>,
}

const parseActions = (raw: string) => (raw || '').split('\n').map((s) => s.trim()).filter(Boolean).slice(0, 2)

function useWpSim() {
  const sim = useStudio((s) => s.sim)
  const site = useStudio((s) => s.webpush.site)
  const show = useToast((s) => s.show)
  return { sim, onTap: (label: string) => { if (!sim) return; show('▸ ' + (label ? `"${label}" → opens ${site}` : `Opens ${site}`)) } }
}

/** A calm, generic website behind the notification so the card is the focus. */
function SiteBackdrop() {
  const w = useStudio((s) => s.webpush)
  const ctxId = useStudio((s) => s.ctxId())
  const p = packFor(ctxId)
  const bc = avColor(w.site)
  const cards = (p?.carousel || []).slice(0, 4)
  return (
    <div className="wp-site">
      <div className="wp-nav">
        <div className="lg"><img src={w.logo || brandMark(w.site, 96)} alt="" /><b>{w.site}</b></div>
        <div className="links"><a>Shop</a><a>New</a><a>Sale</a><a>About</a></div>
        <div className="act">{WI.search}{WI.user}{WI.cart}</div>
      </div>
      <div className="wp-hero" style={{ backgroundColor: bc }}>
        <span className="orb" /><span className="orb two" />
        <div className="ey">{w.site}</div><div className="hl">{cap(p?.offer || '') || 'New season, new arrivals'}</div><span className="cta">Shop now</span>
      </div>
      <div className="wp-sec"><span className="t">Popular right now</span><span className="a">View all</span></div>
      <div className="wp-grid">{cards.map((pr, i) => <div className="wp-c" key={i}><img className="ph" src={phImg(pr[0], null, hueOf(pr[0]), 320, 240)} alt={pr[0]} /><div className="mt"><div className="nm">{pr[0]}</div><div className="pr">{pr[1] || ''}</div></div></div>)}</div>
    </div>
  )
}

function NotifCard() {
  const w = useStudio((s) => s.webpush)
  const { sim, onTap } = useWpSim()
  const acts = parseActions(w.actions)
  const icon = w.logo || brandMark(w.site, 96)
  const mac = w.os === 'mac'
  const origin = (w.url || 'example.com').replace(/^https?:\/\//, '').replace(/\/.*$/, '')
  return (
    <div className={'wp-card ' + (mac ? 'mac' : 'win') + (sim ? ' clickable' : '')} onClick={() => onTap('')}>
      <div className="wp-head">
        {mac ? <img className="ic" src={icon} alt="" /> : <span className="chr">{WI.chrome}</span>}
        <div className="src">{mac ? <><b>{origin}</b><span>now</span></> : <><b>Google Chrome</b><span>{origin} · now</span></>}</div>
        <span className="x">{WI.x}</span>
      </div>
      <div className="wp-b">
        <div className="tb">
          <div className="wp-t">{w.title || 'Notification title'}</div>
          {w.body && <div className="wp-x">{fmtLite(w.body)}</div>}
        </div>
        {!mac && <img className="ic-win" src={icon} alt="" />}
      </div>
      {w.image && <img className="wp-img" src={w.image} alt="" />}
      {acts.length > 0 && (
        <div className="wp-acts">
          {acts.map((a, i) => <div key={i} className={'wp-act' + (sim ? ' clickable' : '')} onClick={(e) => { e.stopPropagation(); onTap(a) }}>{a}</div>)}
        </div>
      )}
    </div>
  )
}

/** The "Allow notifications?" opt-in — native browser prompt or a branded two-step ask. */
function OptinOverlay() {
  const w = useStudio((s) => s.webpush)
  const { sim, onTap } = useWpSim()
  const icon = w.logo || brandMark(w.site, 96)
  const origin = (w.url || 'example.com').replace(/^https?:\/\//, '').replace(/\/.*$/, '')
  if (w.optinStyle === 'native') {
    return (
      <div className="wp-native-wrap">
        <div className="wp-native">
          <div className="hd"><img className="fav" src={icon} alt="" /><b>{origin} wants to</b></div>
          <div className="perm"><span className="bi">{WI.bell}</span>Show notifications</div>
          <div className="btns">
            <button className={'block' + (sim ? ' clickable' : '')} onClick={() => onTap('Block')}>{w.optinDeny || 'Block'}</button>
            <button className={'allow' + (sim ? ' clickable' : '')} onClick={() => onTap('Allow')}>{w.optinAllow || 'Allow'}</button>
          </div>
        </div>
      </div>
    )
  }
  return (
    <div className="wp-optin-scrim">
      <div className="wp-optin" style={{ ['--brand']: avColor(w.site) } as CSSProperties}>
        <div className="bell">{WI.bell}</div>
        {w.optinTitle && <div className="ti">{w.optinTitle}</div>}
        {w.optinBody && <div className="bd">{fmtLite(w.optinBody)}</div>}
        <div className="acts">
          <button className={'allow' + (sim ? ' clickable' : '')} onClick={() => onTap('Allow')}>{w.optinAllow || 'Allow'}</button>
          <button className={'deny' + (sim ? ' clickable' : '')} onClick={() => onTap('Dismiss')}>{w.optinDeny || 'Maybe later'}</button>
        </div>
      </div>
    </div>
  )
}

export function WebPushPreview() {
  const ctxId = useStudio((s) => s.ctxId())
  useAutoTemplate(ctxId, () => applyWebpushTemplate(WEBPUSH_TEMPLATES[0], false))
  const os = useStudio((s) => s.webpush.os)
  const url = useStudio((s) => s.webpush.url)
  const mode = useStudio((s) => s.webpush.mode)
  return (
    <DesktopFrame url={url || 'example.com'} width={1040}>
      <div className={'wp-view ' + (os === 'mac' ? 'mac' : 'win')}>
        <SiteBackdrop />
        {mode === 'optin'
          ? <OptinOverlay />
          : <div className={'wp-slot ' + (os === 'mac' ? 'tr' : 'br')}><NotifCard /></div>}
      </div>
    </DesktopFrame>
  )
}
