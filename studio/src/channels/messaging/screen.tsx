import './messaging.css'
import type { ReactNode } from 'react'
import { useStudio, type MMsg } from '@/store/useStudio'
import { useToast } from '@/store/useToast'
import { parseButtons, parseCards, parseChips, brandMark, avColor, phImg, hueOf, type Card } from '@/lib/util'
import { formatText } from '@/lib/format'
import { Icon, btnIcon } from '@/lib/icons'

/* Shared render for the messaging channels. RCS uses the full feature set (rich
   cards, carousels, suggestion chips, verified-agent card); SMS is the same chrome
   with text/MMS only, a phone-number subtitle, and no agent card or chips. */

type OptKind = 'reply' | 'url' | 'call' | 'copy' | 'map'

function useMsgSim(channel: string) {
  const sim = useStudio((s) => s.sim)
  const tap = useStudio((s) => s.msgTapReply)
  const show = useToast((s) => s.show)
  const onOpt = (kind: OptKind, reply: string, response: string, value: string) => {
    if (!sim) return
    if (kind === 'url') show('🔗 Opens ' + (value || 'link'))
    else if (kind === 'call') show('📞 Calls ' + (value || ''))
    else if (kind === 'copy') show('✓ Copied to clipboard')
    else tap(channel, reply, response)
  }
  return { sim, onOpt }
}

const cardImg = (c: { img?: string; title?: string; sub?: string }) =>
  c.img || phImg(c.title || 'Product', c.sub || null, hueOf(c.title || 'product'), 480, 300)

function effMsgs(slice: { messages: MMsg[]; played: MMsg[] }, sim: boolean): MMsg[] {
  return sim && slice.played.length ? slice.messages.concat(slice.played) : slice.messages
}

/* ---------- rich card + button pieces (shared by gm + ios) ---------- */
function RcsButtons({ msg, onOpt }: { msg: MMsg; onOpt: ReturnType<typeof useMsgSim>['onOpt'] }) {
  const btns = parseButtons(msg.buttons || '')
  if (!btns.length) return null
  return (
    <div>
      {btns.map((b, i) => {
        const kind: OptKind = b.type === 'reply' ? 'reply' : (b.type as OptKind)
        return (
          <div key={i} className={'rcs-cbtn' + (kind === 'reply' ? ' clickable' : '')} onClick={() => onOpt(kind, b.label, b.response, b.value)}>
            {btnIcon(b.type)}{b.label}
          </div>
        )
      })}
    </div>
  )
}

function CarouselCard({ c }: { c: Card }) {
  return (
    <div className="rcs-card">
      <img src={cardImg(c)} alt="" />
      <div className="cb"><div className="ct">{c.title}</div>{c.sub && <div className="cd">{c.sub}</div>}</div>
      {c.btn && <div className="rcs-cbtn">{/^\+?\d[\d ]+$/.test(c.val) ? Icon.phone : Icon.link}{c.btn}</div>}
    </div>
  )
}

/* ---------- Google Messages ---------- */
function GmMsg({ msg, biz, onOpt }: { msg: MMsg; biz: string; onOpt: ReturnType<typeof useMsgSim>['onOpt'] }) {
  const out = msg.from !== 'business'
  if (msg.type === 'text')
    return (
      <>
        <div className={'gm-msg' + (out ? ' out' : '')}><div className="gm-b"><div className="gtext">{formatText(msg.text || '')}</div></div></div>
        <div className="gm-stamp" style={{ textAlign: out ? 'right' : 'left' }}>{out ? 'Read' : biz.slice(0, 20)} · 9:41 AM</div>
      </>
    )
  if (msg.type === 'image')
    return (
      <>
        <div className={'gm-msg img' + (out ? ' out' : '')}><div className="gm-b"><div className="gm-iw"><img src={msg.img || phImg('Image', null, 210, 500, 360)} alt="" /></div></div></div>
        {msg.caption ? <div className="gm-stamp" style={{ textAlign: 'left' }}>{msg.caption}</div> : null}
      </>
    )
  if (msg.type === 'card')
    return (
      <div className="gm-msg"><div className="gm-b" style={{ background: 'transparent', padding: 0 }}>
        <div className="rcs-card">{msg.img && <img src={msg.img} alt="" />}<div className="cb"><div className="ct">{msg.title}</div>{msg.desc && <div className="cd">{msg.desc}</div>}</div><RcsButtons msg={msg} onOpt={onOpt} /></div>
      </div></div>
    )
  if (msg.type === 'carousel')
    return <div className="rcs-carousel">{parseCards(msg.cards || '').map((c, i) => <CarouselCard key={i} c={c} />)}</div>
  return null
}

export function GoogleMessages({ channel, isSms }: { channel: string; isSms: boolean }) {
  const brand = useStudio((s) => s.brand)
  const dateChip = useStudio((s) => s.dateChip)
  const slice = useStudio((s) => s.msg[channel])
  const { sim, onOpt } = useMsgSim(channel)
  const list = effMsgs(slice, sim)
  const avatar = brand.logo || brandMark(brand.name, 96)
  const verified = !isSms && brand.verified

  let chips: ReactNode = null
  if (!isSms) {
    const last = [...list].reverse().find((x) => x.from === 'business' && x.chips)
    if (last && last.chips) {
      const cs = parseChips(last.chips)
      chips = (
        <div className="rcs-chips">
          {cs.map((c, i) => {
            const a = /call/i.test(c.label) ? Icon.phone : /direction|map/i.test(c.label) ? Icon.map : null
            return <div key={i} className={'rcs-chip' + (sim ? ' clickable' : '')} onClick={() => onOpt('reply', c.label, c.response, '')}>{a}{c.label}</div>
          })}
        </div>
      )
    }
  }

  const agent = !isSms && brand.agentCard ? (
    <div className="gm-agent">
      <div className="lg" style={{ background: brand.logo ? '#fff' : avColor(brand.name) }}><img src={avatar} alt={brand.name} /></div>
      <div className="an">{brand.name}{verified && <span className="vf">{Icon.verifG}</span>}</div>
      <div className="ad">{brand.desc}</div>
      <div className="vb">{Icon.verifG} Verified business</div>
    </div>
  ) : null

  return (
    <div className="gm">
      <div className="gm-header">
        <span className="bk">{Icon.back}</span>
        <div className="gm-av" style={{ background: brand.logo ? '#fff' : avColor(brand.name) }}><img src={avatar} alt={brand.name} /></div>
        <div className="gm-h-meta">
          <div className="gm-name"><span className="nm">{brand.name}</span>{verified && <span className="vf">{Icon.verifG}</span>}</div>
          <div className="gm-sub">{isSms ? brand.phone : brand.sub || 'Verified business'}</div>
        </div>
        <div className="gm-hicons">{Icon.video}{Icon.call}</div>
      </div>
      <div className="gm-body">
        {agent}
        <div className="gm-date">{dateChip} · 9:41 AM</div>
        {list.map((m) => <GmMsg key={m.id} msg={m} biz={brand.name} onOpt={onOpt} />)}
        {slice.typing && <div className="gm-typing"><div className="d"><i /><i /><i /></div></div>}
      </div>
      {chips}
      <div className="gm-in"><span className="ic">{Icon.plus}</span><div className="fld"><span className="ph">{isSms ? 'Text message' : 'RCS message'}</span>{Icon.emoji}</div><span className="ic">{Icon.camera}</span><span className="ic">{Icon.mic}</span></div>
    </div>
  )
}

/* ---------- iOS Messages ---------- */
function IosMsg({ msg, onOpt }: { msg: MMsg; onOpt: ReturnType<typeof useMsgSim>['onOpt'] }) {
  const out = msg.from !== 'business'
  if (msg.type === 'card')
    return (
      <div className="ios-msg in"><div className="ios-rich">
        <div className="rcs-card">{msg.img && <img src={msg.img} alt="" />}<div className="cb"><div className="ct">{msg.title}</div>{msg.desc && <div className="cd">{msg.desc}</div>}</div><RcsButtons msg={msg} onOpt={onOpt} /></div>
      </div></div>
    )
  if (msg.type === 'carousel')
    return <div className="rcs-carousel" style={{ padding: '4px 12px 10px' }}>{parseCards(msg.cards || '').map((c, i) => <CarouselCard key={i} c={c} />)}</div>
  if (msg.type === 'image')
    return (
      <>
        <div className={'ios-msg' + (out ? ' out' : '')}><div className="ios-img"><img src={msg.img || phImg('Image', null, 210, 500, 360)} alt="" /></div></div>
        {msg.caption ? <div className={'ios-msg' + (out ? ' out' : '')}><div className="ios-b">{msg.caption}</div></div> : null}
      </>
    )
  return <div className={'ios-msg' + (out ? ' out' : '')}><div className="ios-b">{formatText(msg.text || msg.caption || '')}</div></div>
}

export function IOSMessages({ channel, isRcs }: { channel: string; isRcs: boolean }) {
  const brand = useStudio((s) => s.brand)
  const dateChip = useStudio((s) => s.dateChip)
  const slice = useStudio((s) => s.msg[channel])
  const { sim, onOpt } = useMsgSim(channel)
  const list = effMsgs(slice, sim)
  const avatar = brand.logo || brandMark(brand.name, 96)
  const verified = isRcs && brand.verified
  const lastOut = [...list].reverse().find((x) => x.from !== 'business')

  let chips: ReactNode = null
  if (isRcs) {
    const last = [...list].reverse().find((x) => x.from === 'business' && x.chips)
    if (last && last.chips) {
      const cs = parseChips(last.chips)
      chips = <div className="rcs-chips">{cs.map((c, i) => <div key={i} className={'rcs-chip' + (sim ? ' clickable' : '')} onClick={() => onOpt('reply', c.label, c.response, '')}>{c.label}</div>)}</div>
    }
  }

  return (
    <div className="ios">
      <div className="ios-header">
        <span className="bk">{Icon.back}</span>
        <div className="ios-av" style={{ background: brand.logo ? '#fff' : avColor(brand.name) }}><img src={avatar} alt={brand.name} /></div>
        <div className="ios-nm">{brand.name}{verified && <span className="vf">{Icon.verifG}</span>} <span className="cv">›</span></div>
      </div>
      <div className="ios-body">
        <div className="ios-time"><b>{dateChip}</b> 9:41 AM{isRcs ? ' · RCS' : ''}</div>
        {list.map((m) => <IosMsg key={m.id} msg={m} onOpt={onOpt} />)}
        {slice.typing && <div className="ios-msg in"><div className="ios-b" style={{ color: '#8e8e93' }}>•••</div></div>}
        {lastOut && <div className="ios-rcpt">Delivered</div>}
      </div>
      {chips}
      <div className="ios-in"><span className="plus">{Icon.plus}</span><div className="fld"><span className="ph">Text Message</span><span className="wv">{Icon.wave}</span></div></div>
    </div>
  )
}
