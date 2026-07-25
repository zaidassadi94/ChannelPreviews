import { useEffect, useRef } from 'react'
import { useStudio } from '@/store/useStudio'
import { useToast } from '@/store/useToast'
import { PhoneFrame } from '@/shell/PhoneFrame'
import { StatusBar } from '@/shell/StatusBar'
import { AppIcon, AppBackdrop, NIcon, fmtLite, wallBg } from '@/channels/notify/shared'
import { PUSH_TEMPLATES, applyPushTemplate } from './templates'

const pushActions = (raw: string) => (raw || '').split('\n').map((s) => s.trim()).filter(Boolean).slice(0, 3)

function usePushSim() {
  const sim = useStudio((s) => s.sim)
  const appName = useStudio((s) => s.notify.appName)
  const show = useToast((s) => s.show)
  return (label: string) => { if (!sim) return; show('▸ ' + (label ? `"${label}" → opens ${appName}` : `Opens ${appName}`)) }
}

function PushCardIOS() {
  const appName = useStudio((s) => s.notify.appName)
  const p = useStudio((s) => s.notify.push)
  const expanded = useStudio((s) => s.notify.expanded)
  const sim = useStudio((s) => s.sim)
  const onTap = usePushSim()
  const acts = pushActions(p.actions)
  const hasImg = !!p.image
  return (
    <div className={'pn-ios ' + (expanded ? '' : 'collapsed')}>
      <div className="row">
        <AppIcon cls="icon" />
        <div className="txt">
          <div className="top"><span className="appn">{appName}</span><span className="time">{p.time || 'now'}</span></div>
          {p.title && <div className="title">{p.title}</div>}
          {p.body && <div className="body">{fmtLite(p.body)}</div>}
        </div>
        {!expanded && hasImg && <img className="thumb" src={p.image} alt="" />}
      </div>
      {expanded && hasImg && <img className="big" src={p.image} alt="" />}
      {expanded && acts.length > 0 && <div className="acts">{acts.map((a, i) => <div key={i} className={'act' + (sim ? ' clickable' : '')} onClick={() => onTap(a)}>{a}</div>)}</div>}
    </div>
  )
}

function PushCardAnd({ inShade }: { inShade?: boolean }) {
  const appName = useStudio((s) => s.notify.appName)
  const p = useStudio((s) => s.notify.push)
  const expanded = useStudio((s) => s.notify.expanded)
  const sim = useStudio((s) => s.sim)
  const onTap = usePushSim()
  const acts = pushActions(p.actions)
  const hasImg = !!p.image
  return (
    <div className={'pn-and ' + (inShade ? 'shade-card ' : '') + (expanded ? '' : 'collapsed')}>
      <div className="row">
        <div className="txt">
          <div className="hd"><AppIcon cls="icon" /><span className="appn">{appName}</span><span className="dot">·</span><span className="time">{p.time || 'now'}</span><span className="chev">⌄</span></div>
          {p.title && <div className="title">{p.title}</div>}
          {p.body && <div className="body">{fmtLite(p.body)}</div>}
        </div>
        {!expanded && hasImg && <img className="thumb" src={p.image} alt="" />}
      </div>
      {expanded && hasImg && <img className="big" src={p.image} alt="" />}
      {expanded && acts.length > 0 && <div className="acts">{acts.map((a, i) => <div key={i} className={'act' + (sim ? ' clickable' : '')} onClick={() => onTap(a)}>{a}</div>)}</div>}
    </div>
  )
}

function IosLock() {
  const wallpaper = useStudio((s) => s.notify.wallpaper)
  return (
    <div className="ls" style={{ background: wallBg(wallpaper) }}>
      <StatusBar light={true} />
      <div className="ls-clock"><div className="lk">{NIcon.lock}</div><div className="dt">Monday, July 14</div><div className="tm">9:41</div></div>
      <div className="ls-notifs"><PushCardIOS /></div>
      <div className="ls-bottom"><div className="ls-btn">{NIcon.flash}</div><div className="ls-btn">{NIcon.cam}</div></div>
      <div className="home-ind dk" />
    </div>
  )
}

function AndShade() {
  const wallpaper = useStudio((s) => s.notify.wallpaper)
  return (
    <div className="shade" style={{ background: `linear-gradient(rgba(14,16,22,.82),rgba(14,16,22,.9)), ${wallBg(wallpaper)}` }}>
      <StatusBar light={true} />
      <div className="shade-head"><div className="tm">9:41</div><div className="dt">Monday, July 14</div></div>
      <div className="shade-list">
        <PushCardAnd inShade />
        <div className="pn-and shade-card collapsed"><div className="row"><div className="txt"><div className="hd"><div className="icon mono" style={{ background: '#ea4335', fontSize: 9 }}>G</div><span className="appn">Gmail</span><span className="dot">·</span><span className="time">8:12</span></div><div className="title">Weekly report is ready</div><div className="body">Your dashboard summary for this week…</div></div></div></div>
      </div>
      <div className="shade-clear"><span>{NIcon.clear}</span></div>
      <div className="home-ind dk" />
    </div>
  )
}

export function PushPreview() {
  const ctxId = useStudio((s) => s.ctxId())
  const lastCtx = useRef<string | null>(null)
  useEffect(() => {
    if (lastCtx.current === ctxId) return
    lastCtx.current = ctxId
    applyPushTemplate(PUSH_TEMPLATES[0], false)
  }, [ctxId])

  const device = useStudio((s) => s.device)
  const surface = useStudio((s) => s.notify.surface)
  const setNotify = useStudio((s) => s.setNotify)
  // keep the surface valid for the current device (lock/banner ↔ heads/shade)
  useEffect(() => {
    const opts = device === 'ios' ? ['lock', 'banner'] : ['heads', 'shade']
    if (!opts.includes(surface)) setNotify({ surface: opts[0] })
  }, [device, surface, setNotify])

  let screen
  if (device === 'ios') screen = surface === 'banner' ? <><AppBackdrop /><div className="ovl banner-top"><PushCardIOS /></div></> : <IosLock />
  else screen = surface === 'shade' ? <AndShade /> : <><AppBackdrop /><div className="ovl heads-top"><PushCardAnd /></div></>

  return <PhoneFrame bare>{screen}</PhoneFrame>
}
