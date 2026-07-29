import { useEffect } from 'react'
import type { CSSProperties } from 'react'
import { useAutoTemplate } from '@/lib/useAutoTemplate'
import { useStudio, type PushItem } from '@/store/useStudio'
import { useToast } from '@/store/useToast'
import { avColor } from '@/lib/util'
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

/** `item` renders a specific notification (a stacked extra); omit it for the primary from
    the store. `secondary` forces the collapsed look regardless of the global Expanded toggle. */
function PushCardIOS({ item, secondary }: { item?: PushItem; secondary?: boolean } = {}) {
  const appName = useStudio((s) => s.notify.appName)
  const primary = useStudio((s) => s.notify.push)
  const expandedG = useStudio((s) => s.notify.expanded)
  const sim = useStudio((s) => s.sim)
  const onTap = usePushSim()
  const p = item || primary
  const expanded = secondary ? false : expandedG
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

function PushCardAnd({ inShade, item, secondary }: { inShade?: boolean; item?: PushItem; secondary?: boolean }) {
  const appName = useStudio((s) => s.notify.appName)
  const primary = useStudio((s) => s.notify.push)
  const expandedG = useStudio((s) => s.notify.expanded)
  const sim = useStudio((s) => s.sim)
  const onTap = usePushSim()
  const p = item || primary
  const expanded = secondary ? false : expandedG
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
  const stack = useStudio((s) => s.notify.stack)
  return (
    <div className="ls" style={{ background: wallBg(wallpaper) }}>
      <StatusBar light={true} />
      <div className="ls-clock"><div className="lk">{NIcon.lock}</div><div className="dt">Monday, July 14</div><div className="tm">9:41</div></div>
      <div className="ls-notifs">
        <PushCardIOS />
        {stack.map((it, i) => <PushCardIOS key={i} item={it} secondary />)}
      </div>
      <div className="ls-bottom"><div className="ls-btn">{NIcon.flash}</div><div className="ls-btn">{NIcon.cam}</div></div>
      <div className="home-ind dk" />
    </div>
  )
}

function AndShade() {
  const wallpaper = useStudio((s) => s.notify.wallpaper)
  const stack = useStudio((s) => s.notify.stack)
  return (
    <div className="shade" style={{ background: `linear-gradient(rgba(14,16,22,.82),rgba(14,16,22,.9)), ${wallBg(wallpaper)}` }}>
      <StatusBar light={true} />
      <div className="shade-head"><div className="tm">9:41</div><div className="dt">Monday, July 14</div></div>
      <div className="shade-list">
        <PushCardAnd inShade />
        {stack.length
          ? stack.map((it, i) => <PushCardAnd key={i} inShade item={it} secondary />)
          : <div className="pn-and shade-card collapsed"><div className="row"><div className="txt"><div className="hd"><div className="icon mono" style={{ background: '#ea4335', fontSize: 9 }}>G</div><span className="appn">Gmail</span><span className="dot">·</span><span className="time">8:12</span></div><div className="title">Weekly report is ready</div><div className="body">Your dashboard summary for this week…</div></div></div></div>}
      </div>
      <div className="shade-clear"><span>{NIcon.clear}</span></div>
      <div className="home-ind dk" />
    </div>
  )
}

/** The system "Allow notifications?" opt-in — native iOS/Android alert or a branded two-step ask. */
function PushOptin() {
  const device = useStudio((s) => s.device)
  const n = useStudio((s) => s.notify)
  const sim = useStudio((s) => s.sim)
  const show = useToast((s) => s.show)
  const tap = (l: string) => { if (sim) show('▸ ' + l) }
  const cls = (extra: string) => extra + (sim ? ' clickable' : '')
  const native = n.optinStyle === 'native'
  let card
  if (native && device === 'ios') {
    card = (
      <div className="po-ios">
        <div className="hd">
          <div className="ttl">“{n.appName}” Would Like to Send You Notifications</div>
          <div className="sub">Notifications may include alerts, sounds, and icon badges. These can be configured in Settings.</div>
        </div>
        <div className="btns">
          <button className={cls('deny')} onClick={() => tap(n.optinDeny || "Don't Allow")}>{n.optinDeny || "Don't Allow"}</button>
          <button className={cls('allow')} onClick={() => tap(n.optinAllow || 'Allow')}>{n.optinAllow || 'Allow'}</button>
        </div>
      </div>
    )
  } else if (native) {
    card = (
      <div className="po-and">
        <div className="ic"><AppIcon cls="ai" /></div>
        <div className="q">Allow {n.appName} to send you notifications?</div>
        <div className="btns">
          <button className={cls('allow')} onClick={() => tap(n.optinAllow || 'Allow')}>{n.optinAllow || 'Allow'}</button>
          <button className={cls('deny')} onClick={() => tap(n.optinDeny || "Don't allow")}>{(n.optinDeny || "Don't allow") === "Don't Allow" ? "Don't allow" : (n.optinDeny || "Don't allow")}</button>
        </div>
      </div>
    )
  } else {
    card = (
      <div className="po-two" style={{ ['--brand']: avColor(n.appName) } as CSSProperties}>
        <div className="bell">{NIcon.bell}</div>
        {n.optinTitle && <div className="ti">{n.optinTitle}</div>}
        {n.optinBody && <div className="bd">{fmtLite(n.optinBody)}</div>}
        <div className="acts">
          <button className={cls('allow')} onClick={() => tap(n.optinAllow || 'Allow')}>{n.optinAllow || 'Allow'}</button>
          <button className={cls('deny')} onClick={() => tap(n.optinDeny || 'Not now')}>{n.optinDeny || 'Not now'}</button>
        </div>
      </div>
    )
  }
  return (
    <div className="po-wrap">
      <AppBackdrop />
      <div className="po-scrim" />
      <div className="po-center">{card}</div>
    </div>
  )
}

export function PushPreview() {
  const ctxId = useStudio((s) => s.ctxId())
  useAutoTemplate(ctxId, () => applyPushTemplate(PUSH_TEMPLATES[0], false))

  const device = useStudio((s) => s.device)
  const surface = useStudio((s) => s.notify.surface)
  const setNotify = useStudio((s) => s.setNotify)
  // keep the surface valid for the current device (lock/banner ↔ heads/shade · optin shared)
  useEffect(() => {
    const opts = device === 'ios' ? ['lock', 'banner', 'optin'] : ['heads', 'shade', 'optin']
    if (!opts.includes(surface)) setNotify({ surface: opts[0] })
  }, [device, surface, setNotify])

  let screen
  if (surface === 'optin') screen = <PushOptin />
  else if (device === 'ios') screen = surface === 'banner' ? <><AppBackdrop /><div className="ovl banner-top"><PushCardIOS /></div></> : <IosLock />
  else screen = surface === 'shade' ? <AndShade /> : <><AppBackdrop /><div className="ovl heads-top"><PushCardAnd /></div></>

  return <PhoneFrame bare>{screen}</PhoneFrame>
}
