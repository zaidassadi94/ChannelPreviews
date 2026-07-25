import { useEffect, useRef, type CSSProperties } from 'react'
import { useStudio } from '@/store/useStudio'
import { useToast } from '@/store/useToast'
import { PhoneFrame } from '@/shell/PhoneFrame'
import { AppIcon, InappBackdrop, NIcon, fmtLite, oneLine } from '@/channels/notify/shared'
import { avColor, phImg, hueOf } from '@/lib/util'
import { INAPP_TEMPLATES, applyInappTemplate } from './templates'

interface Cta { label: string; style: string }
function iaCtaList(ctas: string): Cta[] {
  return (ctas || '').split('\n').map((l) => l.trim()).filter(Boolean).map((l) => {
    const p = l.split('|').map((x) => x.trim())
    let st = (p[1] || 'primary').toLowerCase()
    if (!['primary', 'secondary', 'text'].includes(st)) st = 'primary'
    return { label: p[0] || '', style: st }
  }).filter((c) => c.label).slice(0, 2)
}

function useInappSim() {
  const sim = useStudio((s) => s.sim)
  const appName = useStudio((s) => s.notify.appName)
  const show = useToast((s) => s.show)
  return (label: string) => { if (!sim) return; show('▸ ' + (label ? `"${label}" → opens ${appName}` : `Opens ${appName}`)) }
}

function IaCtas({ ctas }: { ctas: string }) {
  const sim = useStudio((s) => s.sim)
  const onTap = useInappSim()
  const list = iaCtaList(ctas)
  if (!list.length) return null
  return <div className="ia-cta-col">{list.map((b, i) => <button key={i} className={`ia-cta ${b.style}` + (sim ? ' clickable' : '')} onClick={() => onTap(b.label)}>{b.label}</button>)}</div>
}

function IaX({ dark }: { dark?: boolean }) {
  const close = useStudio((s) => s.notify.inapp.close)
  const sim = useStudio((s) => s.sim)
  const onTap = useInappSim()
  if (!close) return null
  return <div className={'ia-x ' + (dark ? 'dark' : '') + (sim ? ' clickable' : '')} onClick={() => onTap('Dismiss')}>{NIcon.clear}</div>
}

function IaModal() {
  const a = useStudio((s) => s.notify.inapp)
  return (
    <div className="ia-modal">
      <IaX dark={!a.image} />
      {a.image && <img className="img" src={a.image} alt="" />}
      <div className="bd">{a.headline && <div className="hl">{a.headline}</div>}{a.body && <div className="tx">{fmtLite(a.body)}</div>}<IaCtas ctas={a.ctas} /></div>
    </div>
  )
}

function IaBanner() {
  const a = useStudio((s) => s.notify.inapp)
  const sim = useStudio((s) => s.sim)
  const onTap = useInappSim()
  const c = iaCtaList(a.ctas)[0]
  return (
    <div className="ia-bnr">
      <AppIcon cls="ic" />
      <div className="tx"><div className="hl">{a.headline || ''}</div>{a.body && <div className="sb">{oneLine(a.body)}</div>}</div>
      {c && <div className={'cta' + (sim ? ' clickable' : '')} onClick={() => onTap(c.label)}>{c.label}</div>}
      {a.close && <div className={'xs' + (sim ? ' clickable' : '')} onClick={() => onTap('Dismiss')}>✕</div>}
    </div>
  )
}

function IaSheet() {
  const a = useStudio((s) => s.notify.inapp)
  return (
    <div className="ia-sheet">
      <IaX dark />
      <div className="ia-grab" />
      {a.image && <img className="img" src={a.image} alt="" />}
      {a.headline && <div className="hl">{a.headline}</div>}
      {a.body && <div className="tx">{fmtLite(a.body)}</div>}
      <IaCtas ctas={a.ctas} />
    </div>
  )
}

function IaFull() {
  const a = useStudio((s) => s.notify.inapp)
  const appName = useStudio((s) => s.notify.appName)
  const src = a.image || phImg(appName, null, hueOf(appName), 700, 900)
  return (
    <div className="ia-full">
      <img className="ia-full-img" src={src} alt="" />
      <IaX />
      <div className="bd">{a.headline && <div className="hl">{a.headline}</div>}{a.body && <div className="tx">{fmtLite(a.body)}</div>}<IaCtas ctas={a.ctas} /></div>
    </div>
  )
}

function IaImage() {
  const a = useStudio((s) => s.notify.inapp)
  const appName = useStudio((s) => s.notify.appName)
  const src = a.image || phImg(appName, null, hueOf(appName), 600, 760)
  return <div className="ia-imgonly"><IaX /><img src={src} alt="" /></div>
}

export function InAppPreview() {
  const ctxId = useStudio((s) => s.ctxId())
  const lastCtx = useRef<string | null>(null)
  useEffect(() => {
    if (lastCtx.current === ctxId) return
    lastCtx.current = ctxId
    applyInappTemplate(INAPP_TEMPLATES[0], false)
  }, [ctxId])

  const a = useStudio((s) => s.notify.inapp)
  const appName = useStudio((s) => s.notify.appName)
  const brand = avColor(appName)

  let body
  if (a.type === 'full') body = <IaFull />
  else if (a.type === 'banner') body = <><InappBackdrop intrusive={false} /><div className={'ia-banner ' + a.bannerPos}><IaBanner /></div></>
  else if (a.type === 'sheet') body = <><InappBackdrop intrusive={true} /><div className="abd-scrim" /><div className="ia-sheetwrap"><IaSheet /></div></>
  else if (a.type === 'image') body = <><InappBackdrop intrusive={true} /><div className="abd-scrim" /><div className="ia-center"><IaImage /></div></>
  else body = <><InappBackdrop intrusive={true} /><div className="abd-scrim" /><div className="ia-center"><IaModal /></div></>

  return (
    <PhoneFrame bare>
      <div style={{ position: 'absolute', inset: 0, ['--brand' as string]: brand } as CSSProperties}>{body}</div>
    </PhoneFrame>
  )
}
