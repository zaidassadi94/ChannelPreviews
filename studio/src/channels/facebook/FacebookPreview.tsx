import './facebook.css'
import { useEffect, useRef, type ReactNode } from 'react'
import { useStudio } from '@/store/useStudio'
import { useToast } from '@/store/useToast'
import { PhoneFrame } from '@/shell/PhoneFrame'
import { StatusBar } from '@/shell/StatusBar'
import { packFor } from '@/content/model'
import { brandMark, phImg, hueOf } from '@/lib/util'
import { formatText } from '@/lib/format'
import { FB_TEMPLATES, applyFbTemplate } from './templates'

const FB: Record<string, ReactNode> = {
  like: <svg viewBox="0 0 24 24" fill="none"><path d="M7 10v10H4a1 1 0 01-1-1v-8a1 1 0 011-1h3zm0 0l4-7a2 2 0 012 2v3h5.5a2 2 0 011.95 2.45l-1.6 7A2 2 0 0117 20H7" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" /></svg>,
  comment: <svg viewBox="0 0 24 24" fill="none"><path d="M21 11.5a8.5 8.5 0 01-11.9 7.8L3 21l1.7-5.6A8.5 8.5 0 1121 11.5z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" /></svg>,
  share: <svg viewBox="0 0 24 24" fill="none"><path d="M4 12a8 8 0 018-8v-3l7 6-7 6v-3a5 5 0 00-5 5v1H4v-4z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" /></svg>,
  thumb: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 10l3.5-6a1.5 1.5 0 012.9.5V8h3.4a1.4 1.4 0 011.37 1.72l-1.3 6A1.6 1.6 0 0116.3 17H8v-7zM4 10h2v7H4a1 1 0 01-1-1v-5a1 1 0 011-1z" /></svg>,
  heart: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 20s-7-4.35-9.5-8.5C1 8.5 2.5 5 6 5c2 0 3.2 1.2 4 2.3C10.8 6.2 12 5 14 5c3.5 0 5 3.5 3.5 6.5C19 15.65 12 20 12 20z" /></svg>,
  globe: <svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.6" /><path d="M3.5 12h17M12 3.5c2.5 2.4 2.5 14.6 0 17M12 3.5c-2.5 2.4-2.5 14.6 0 17" stroke="currentColor" strokeWidth="1.4" /></svg>,
  dots: <svg viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.7" /><circle cx="12" cy="12" r="1.7" /><circle cx="19" cy="12" r="1.7" /></svg>,
  x: <svg viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>,
  chevR: <svg viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  search: <svg viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" /><path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>,
  dm: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.2 2 2 6.3 2 11.8c0 3 1.4 5.6 3.7 7.4V23l3.4-1.9c.9.25 1.9.4 2.9.4 5.8 0 10-4.3 10-9.7C22 6.3 17.8 2 12 2zm1 13l-2.6-2.7L5.5 15l5.4-5.7 2.6 2.7L18.3 9 13 15z" /></svg>,
  home: <svg viewBox="0 0 24 24" fill="none"><path d="M4 11l8-6.5L20 11M6 9.5V19a1 1 0 001 1h3v-5h4v5h3a1 1 0 001-1V9.5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  video: <svg viewBox="0 0 24 24" fill="none"><rect x="3" y="6" width="18" height="12" rx="3" stroke="currentColor" strokeWidth="1.9" /><path d="M10 9.5l4 2.5-4 2.5z" fill="currentColor" /></svg>,
  shop: <svg viewBox="0 0 24 24" fill="none"><path d="M4 8h16l-1 12H5L4 8zM8 8V6a4 4 0 018 0v2" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  bell: <svg viewBox="0 0 24 24" fill="none"><path d="M6 9a6 6 0 0112 0c0 5 2 6 2 6H4s2-1 2-6zM9.5 20a2.5 2.5 0 005 0" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" /></svg>,
  menu: <svg viewBox="0 0 24 24" fill="none"><path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>,
}
const VBadge = () => (
  <svg className="vb" viewBox="0 0 24 24" width="13" height="13"><path fill="#1877f2" d="M12 1.2l2.5 1.9 3.1-.4 1.3 2.9 2.8 1.5-.9 3 .9 3-2.8 1.5-1.3 2.9-3.1-.4L12 22.8l-2.5-1.9-3.1.4-1.3-2.9L2.3 17l.9-3-.9-3 2.8-1.5 1.3-2.9 3.1.4L12 1.2z" /><path fill="#fff" d="M10.6 15.2L7.7 12.3l1.2-1.2 1.7 1.7 3.7-3.7 1.2 1.2-4.9 4.9z" /></svg>
)

const MKT_LOCS = ['Miami, FL', 'Austin, TX', 'Denver, CO', 'Seattle, WA']

function useFbSim() {
  const sim = useStudio((s) => s.sim)
  const page = useStudio((s) => s.fb.page)
  const show = useToast((s) => s.show)
  return { sim, onTap: (label: string) => { if (!sim) return; show('▸ ' + (label ? `"${label}" → opens ${page}` : `Opens ${page}`)) } }
}

function FeedAd() {
  const f = useStudio((s) => s.fb)
  const { sim, onTap } = useFbSim()
  const avatar = f.logo || brandMark(f.page, 96)
  const src = f.media || phImg(f.page, null, hueOf(f.page), 800, 1000)
  const hasLink = f.headline || f.desc || f.url
  return (
    <div className="fbf">
      <StatusBar light={false} />
      <div className="fb-appbar"><span className="fb-wm">facebook</span><span className="fb-abr"><span className="c">{FB.search}</span><span className="c">{FB.dm}</span></span></div>
      <div className="fb-feed">
        <div className="fb-post">
          <div className="fb-post-h"><img className="av" src={avatar} alt={f.page} /><div className="pn"><div className="nm">{f.page}{f.verified && <VBadge />}</div><div className="sub">Sponsored · {FB.globe}</div></div><span className="more">{FB.dots}{FB.x}</span></div>
          {f.primary && <div className="fb-primary">{formatText(f.primary)}</div>}
          <div className="fb-media"><img src={src} alt="" /></div>
          {hasLink && <div className="fb-link"><div className="lx"><div className="url">{f.url}</div>{f.headline && <div className="hl">{f.headline}</div>}{f.desc && <div className="ds">{f.desc}</div>}</div><div className={'fb-cta' + (sim ? ' clickable' : '')} onClick={() => onTap(f.cta)}>{f.cta || 'Shop Now'}</div></div>}
          <div className="fb-counts">
            <div className="rx"><span className="fb-rc"><span className="like">{FB.thumb}</span><span className="love">{FB.heart}</span></span><span>{f.reactions || '0'}</span></div>
            <div>{f.comments || '0'} comments · {f.shares || '0'} shares</div>
          </div>
          <div className="fb-actions"><div className="fb-act">{FB.like}Like</div><div className="fb-act">{FB.comment}Comment</div><div className="fb-act">{FB.share}Share</div></div>
        </div>
      </div>
      <div className="fb-nav"><span className="on">{FB.home}</span>{FB.video}{FB.shop}{FB.bell}{FB.menu}</div>
      <div className="home-ind" />
    </div>
  )
}

function StoryAd() {
  const f = useStudio((s) => s.fb)
  const { sim, onTap } = useFbSim()
  const avatar = f.logo || brandMark(f.page, 96)
  const src = f.media || phImg(f.page, null, hueOf(f.page), 800, 1400)
  return (
    <div className="fbs">
      <img className="fbs-media" src={src} alt="" />
      <div className="fbs-scrim-t" /><div className="fbs-scrim-b" />
      <StatusBar light={true} />
      <div className="fbs-top">
        <div className="fbs-bars"><span className="b"><i style={{ width: '42%' }} /></span><span className="b" /><span className="b" /></div>
        <div className="fbs-head"><img className="av" src={avatar} alt={f.page} /><span className="hn">{f.page}{f.verified && <VBadge />}</span><span className="sp">Sponsored</span><span className="dots">{FB.dots}</span><span className="x">{FB.x}</span></div>
      </div>
      <div className="fbs-spacer" />
      <div className="fbs-ctawrap"><div className={'fbs-cta' + (sim ? ' clickable' : '')} onClick={() => onTap(f.cta)}><span>{f.cta || 'Learn More'}</span><span className="ar">{FB.chevR}</span></div></div>
      <div className="fbs-bottom"><div className="reply">Send message</div><span className="ic">{FB.like}</span><span className="ic">{FB.share}</span></div>
      <div className="home-ind dk" />
    </div>
  )
}

function MarketplaceAd() {
  const f = useStudio((s) => s.fb)
  const ctxId = useStudio((s) => s.ctxId())
  const { sim, onTap } = useFbSim()
  const p = packFor(ctxId)
  const src = f.media || phImg(f.page, null, hueOf(f.page), 800, 800)
  const fillers = (p?.carousel || []).slice(0, 3)
  return (
    <div className="fbm">
      <StatusBar light={false} />
      <div className="fbm-head"><span className="tl">Marketplace</span><span className="ic"><span className="c">{FB.search}</span><span className="c">{FB.menu}</span></span></div>
      <div className="fbm-search">{FB.search}<span>Search Marketplace</span></div>
      <div className="fbm-sec">Today's picks</div>
      <div className="fbm-grid">
        <div className="fbm-card ad"><img className="img" src={src} alt="" /><div className="pr">{f.price}</div><div className="ti">{f.headline || f.page}</div><div className="sp">Sponsored · {f.page}</div><div className={'cta' + (sim ? ' clickable' : '')} onClick={() => onTap(f.cta)}>{f.cta || 'Shop Now'}</div></div>
        {fillers.map((c, i) => <div className="fbm-card" key={i}><img className="img" src={phImg(c[0], null, hueOf(c[0]), 400, 400)} alt={c[0]} /><div className="pr">{c[1] || '$—'}</div><div className="ti">{c[0]}</div><div className="lo">{MKT_LOCS[i % MKT_LOCS.length]}</div></div>)}
      </div>
      <div className="home-ind" />
    </div>
  )
}

export function FacebookPreview() {
  const ctxId = useStudio((s) => s.ctxId())
  const lastCtx = useRef<string | null>(null)
  useEffect(() => {
    if (lastCtx.current === ctxId) return
    lastCtx.current = ctxId
    applyFbTemplate(FB_TEMPLATES[0], false)
  }, [ctxId])

  const format = useStudio((s) => s.fb.format)
  const inner = format === 'story' ? <StoryAd /> : format === 'marketplace' ? <MarketplaceAd /> : <FeedAd />
  return <PhoneFrame bare badge="● Simulate — tap the CTA">{inner}</PhoneFrame>
}
