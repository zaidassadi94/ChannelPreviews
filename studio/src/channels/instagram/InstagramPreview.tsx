import './instagram.css'
import { useEffect, useRef, type ReactNode } from 'react'
import { useStudio } from '@/store/useStudio'
import { useToast } from '@/store/useToast'
import { PhoneFrame } from '@/shell/PhoneFrame'
import { StatusBar } from '@/shell/StatusBar'
import { industryById } from '@/content/model'
import { brandMark, phImg, hueOf } from '@/lib/util'
import { formatText } from '@/lib/format'
import { IG_TEMPLATES, applyIgTemplate, handleFromBrand } from './templates'

const IG: Record<string, ReactNode> = {
  heart: <svg viewBox="0 0 24 24" fill="none"><path d="M12 20s-7-4.35-9.5-8.5C1 8.5 2.5 5 6 5c2 0 3.2 1.2 4 2.3C10.8 6.2 12 5 14 5c3.5 0 5 3.5 3.5 6.5C19 15.65 12 20 12 20z" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" /></svg>,
  comment: <svg viewBox="0 0 24 24" fill="none"><path d="M21 11.5a8.5 8.5 0 01-11.9 7.8L3 21l1.7-5.6A8.5 8.5 0 1121 11.5z" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" /></svg>,
  share: <svg viewBox="0 0 24 24" fill="none"><path d="M22 3L11 14M22 3l-7 19-4-8-8-4 19-7z" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" /></svg>,
  save: <svg viewBox="0 0 24 24" fill="none"><path d="M6 3h12a1 1 0 011 1v17l-7-4.5L5 21V4a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" /></svg>,
  dots: <svg viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.7" /><circle cx="12" cy="12" r="1.7" /><circle cx="19" cy="12" r="1.7" /></svg>,
  x: <svg viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>,
  chevR: <svg viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  chevUp: <svg viewBox="0 0 24 24" fill="none"><path d="M6 15l6-6 6 6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  home: <svg viewBox="0 0 24 24" fill="none"><path d="M4 11l8-6.5L20 11M6 9.5V19a1 1 0 001 1h3v-5h4v5h3a1 1 0 001-1V9.5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  search: <svg viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.9" /><path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" /></svg>,
  reels: <svg viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="4" stroke="currentColor" strokeWidth="1.9" /><path d="M3 8h18M8 3l2.5 5M14 3l2.5 5M10 12v5l4.5-2.5L10 12z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" /></svg>,
  shop: <svg viewBox="0 0 24 24" fill="none"><path d="M4 8h16l-1 12H5L4 8zM8 8V6a4 4 0 018 0v2" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" /></svg>,
}

const IgLogo = () => (
  <svg className="ig-glyph" viewBox="0 0 24 24" width="25" height="25"><defs><linearGradient id="igGrad" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#feda75" /><stop offset="0.25" stopColor="#fa7e1e" /><stop offset="0.5" stopColor="#d62976" /><stop offset="0.75" stopColor="#962fbf" /><stop offset="1" stopColor="#4f5bd5" /></linearGradient></defs><rect x="2.3" y="2.3" width="19.4" height="19.4" rx="5.6" fill="none" stroke="url(#igGrad)" strokeWidth="2.1" /><circle cx="12" cy="12" r="4.6" fill="none" stroke="url(#igGrad)" strokeWidth="2.1" /><circle cx="17.4" cy="6.6" r="1.35" fill="url(#igGrad)" /></svg>
)
const VBadge = () => (
  <svg className="vb" viewBox="0 0 24 24" width="13" height="13"><path fill="#3897f0" d="M12 1.2l2.5 1.9 3.1-.4 1.3 2.9 2.8 1.5-.9 3 .9 3-2.8 1.5-1.3 2.9-3.1-.4L12 22.8l-2.5-1.9-3.1.4-1.3-2.9L2.3 17l.9-3-.9-3 2.8-1.5 1.3-2.9 3.1.4L12 1.2z" /><path fill="#fff" d="M10.6 15.2L7.7 12.3l1.2-1.2 1.7 1.7 3.7-3.7 1.2 1.2-4.9 4.9z" /></svg>
)

function useIgSim() {
  const sim = useStudio((s) => s.sim)
  const brand = useStudio((s) => s.ig.brand)
  const show = useToast((s) => s.show)
  return { sim, onTap: (label: string) => { if (!sim) return; show('▸ ' + (label ? `"${label}" → opens ${brand}` : `Opens ${brand}`)) } }
}

const shortTime = (t: string) => { const m = /(\d+)\s*(second|minute|hour|day|week)/i.exec(t || ''); return m ? m[1] + m[2][0].toLowerCase() : (t || '2h') }

function FeedAd() {
  const g = useStudio((s) => s.ig)
  const industry = useStudio((s) => s.industry)
  const { sim, onTap } = useIgSim()
  const avatar = g.logo || brandMark(g.brand, 96)
  const src = g.media || phImg(g.brand, null, hueOf(g.brand), 800, 1000)
  const other = industryById(industry)?.biz || 'daily.feed'
  return (
    <div className="igf">
      <StatusBar light={false} />
      <div className="ig-appbar"><span className="ig-brandmark"><IgLogo /><span className="ig-wm">Instagram</span></span><span className="ig-abr">{IG.heart}{IG.share}</span></div>
      <div className="ig-feed">
        <div className="ig-post">
          <div className="ig-post-h"><img className="av" src={avatar} alt={g.brand} /><div className="pn"><div className="nm">{g.handle}{g.verified && <VBadge />}</div><div className="sp">Sponsored</div></div><span className="more">{IG.dots}</span></div>
          <div className="ig-media"><img src={src} alt="" /></div>
          <div className={'ig-cta-bar' + (sim ? ' clickable' : '')} onClick={() => onTap(g.cta)}><span>{g.cta || 'Shop Now'}</span>{IG.chevR}</div>
          <div className="ig-actions"><div className="l">{IG.heart}{IG.comment}{IG.share}</div><div className="r">{IG.save}</div></div>
          {g.likes && <div className="ig-likes">{g.likes} likes</div>}
          {g.caption && <div className="ig-cap"><b>{g.handle}</b> {formatText(g.caption)}</div>}
          {g.comments && <div className="ig-cmt">View all {g.comments} comments</div>}
          <div className="ig-time">{g.time || '2 hours ago'}</div>
          <div className="ig-peek"><img className="av" src={avatar} alt="" /><span className="nm">{handleFromBrand(other)}</span></div>
        </div>
      </div>
      <div className="ig-nav">{IG.home}{IG.search}{IG.reels}{IG.shop}<img className="pf" src={g.logo || brandMark(g.brand, 64)} alt="you" /></div>
      <div className="home-ind" />
    </div>
  )
}

function StoryAd() {
  const g = useStudio((s) => s.ig)
  const { sim, onTap } = useIgSim()
  const avatar = g.logo || brandMark(g.brand, 96)
  const src = g.media || phImg(g.brand, null, hueOf(g.brand), 800, 1400)
  return (
    <div className="igs">
      <img className="igs-media" src={src} alt="" />
      <div className="igs-scrim-t" /><div className="igs-scrim-b" />
      <StatusBar light={true} />
      <div className="igs-top">
        <div className="igs-bars"><span className="b"><i style={{ width: '42%' }} /></span><span className="b" /><span className="b" /></div>
        <div className="igs-head">
          <img className="av" src={avatar} alt={g.brand} />
          <span className="hn">{g.handle}{g.verified && <VBadge />}</span>
          <span className="sp">Sponsored</span><span className="tm">{shortTime(g.time)}</span>
          <span className="dots">{IG.dots}</span><span className="x">{IG.x}</span>
        </div>
      </div>
      <div className="igs-spacer" />
      <div className={'igs-cta' + (sim ? ' clickable' : '')} onClick={() => onTap(g.cta)}><span className="ch">{IG.chevUp}</span><span className="pill">{g.cta || 'Learn More'}</span></div>
      <div className="igs-bottom"><div className="reply">Send message</div><span className="ic">{IG.heart}</span><span className="ic">{IG.share}</span></div>
      <div className="home-ind dk" />
    </div>
  )
}

export function InstagramPreview() {
  const ctxId = useStudio((s) => s.ctxId())
  const lastCtx = useRef<string | null>(null)
  useEffect(() => {
    if (lastCtx.current === ctxId) return
    lastCtx.current = ctxId
    applyIgTemplate(IG_TEMPLATES[0], false)
  }, [ctxId])

  const format = useStudio((s) => s.ig.format)
  return <PhoneFrame bare badge="● Simulate — tap the CTA">{format === 'story' ? <StoryAd /> : <FeedAd />}</PhoneFrame>
}
