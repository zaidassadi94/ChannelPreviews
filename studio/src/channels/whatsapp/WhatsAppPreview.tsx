import './whatsapp.css'
import { type ReactNode } from 'react'
import { useAutoTemplate } from '@/lib/useAutoTemplate'
import { useStudio, type WAMsg } from '@/store/useStudio'
import { useToast } from '@/store/useToast'
import { parseButtons, parseCards, brandMark, phImg, hueOf, type Btn } from '@/lib/util'
import { formatText } from '@/lib/format'
import { Icon, btnIcon } from '@/lib/icons'
import { PhoneFrame } from '@/shell/PhoneFrame'
import { WA_TEMPLATES, applyWATemplate } from './templates'

function Tail({ color }: { color: string }) {
  return (
    <svg className="tail" viewBox="0 0 9 13" fill="none">
      <path d="M9 0C4 0 0 0 0 0v13C0 6 4 0 9 0z" fill={color} />
    </svg>
  )
}

function useSimHandlers() {
  const sim = useStudio((s) => s.sim)
  const tapReply = useStudio((s) => s.simTapReply)
  const show = useToast((s) => s.show)
  const onBtn = (b: Btn) => {
    if (!sim) return
    if (b.type === 'url' || b.type === 'map') show('🔗 Opens ' + (b.value || 'link'))
    else if (b.type === 'call') show('📞 Calls ' + (b.value || ''))
    else if (b.type === 'copy') show('✓ Copied to clipboard')
    else tapReply(b.label, b.response)
  }
  return { sim, onBtn }
}

function WAMessage({ msg }: { msg: WAMsg }) {
  const { sim, onBtn } = useSimHandlers()

  // A product carousel renders as a full-width, horizontally-scrolling row of cards
  // (no chat bubble), the way WhatsApp shows a multi-product template.
  if (msg.type === 'carousel') {
    const cards = parseCards(msg.cards || '')
    return (
      <div className="wa-carousel">
        {cards.map((c, i) => (
          <div className="wa-pcard" key={i}>
            <img src={c.img || phImg(c.title || 'Product', c.sub || null, hueOf(c.title || 'product'), 300, 200)} alt="" />
            <div className="pb"><div className="pt">{c.title}</div>{c.sub && <div className="pp">{c.sub}</div>}</div>
            {c.btn && <div className="pbtn">{c.btn}</div>}
          </div>
        ))}
      </div>
    )
  }

  const out = msg.from !== 'business'
  const ck = (on: boolean) => (sim && on ? ' clickable' : '')
  const tailColor = out ? '#d9fdd3' : '#fff'
  const time = (
    <span className="wa-time">9:41 AM{out && <span className="tk">{Icon.tick}</span>}</span>
  )

  const btns = msg.type === 'text' || msg.type === 'template' ? parseButtons(msg.buttons || '') : []
  const cta = btns.filter((b) => ['url', 'call', 'copy', 'map'].includes(b.type))
  const reps = btns.filter((b) => b.type === 'reply')

  let inner: ReactNode = null
  if (msg.type === 'text') inner = <><span className="wtext">{formatText(msg.text || '')}</span>{time}</>
  else if (msg.type === 'image') inner = <><div className="wa-img"><img src={msg.img || phImg('Image', null, 210, 600, 340)} alt="" /></div>{msg.caption ? <span className="wtext">{formatText(msg.caption)}</span> : null}{time}</>
  else inner = <>{msg.img ? <div className="wa-img"><img src={msg.img} alt="" /></div> : null}<span className="wtext">{formatText(msg.body || '')}</span>{msg.footer ? <div className="wa-ft">{msg.footer}</div> : null}{time}</>

  return (
    <>
      <div className={'wa-msg ' + (out ? 'out' : 'in')}>
        <div className="wa-b">
          <Tail color={tailColor} />
          {inner}
          {cta.length > 0 && (
            <>
              <div style={{ clear: 'both' }} />
              <div className="wa-btns">
                {cta.map((b, i) => (
                  <div key={i} className={'wa-cta' + ck(true)} onClick={() => onBtn(b)}>
                    {b.type === 'copy' ? Icon.copy : btnIcon(b.type)}{b.label}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
      {reps.length > 0 && (
        <div className="wa-qr">
          {reps.map((b, i) => (
            <div key={i} className={'q' + ck(true)} onClick={() => onBtn(b)}>{b.label}</div>
          ))}
        </div>
      )}
    </>
  )
}

export function WhatsAppPreview() {
  const ctxId = useStudio((s) => s.ctxId())
  useAutoTemplate(ctxId, () => applyWATemplate(WA_TEMPLATES[0], false))

  const brand = useStudio((s) => s.brand)
  const dateChip = useStudio((s) => s.dateChip)
  const device = useStudio((s) => s.device)
  const wa = useStudio((s) => s.wa)
  const sim = useStudio((s) => s.sim)
  const msgs = sim && wa.played.length ? wa.messages.concat(wa.played) : wa.messages
  const avatar = brand.logo || brandMark(brand.name, 96)

  return (
    <PhoneFrame>
    <div className="wa">
      <div className="wa-header">
        <span className="bk">{Icon.back}</span>
        <div className="wa-av"><img src={avatar} alt={brand.name} /></div>
        <div className="wa-meta">
          <div className="wa-name">
            <span className="nm">{brand.name}</span>
            {brand.verified && <span className="vf">{Icon.verifWA}</span>}
          </div>
          <div className="wa-sub">{brand.sub || 'online'}</div>
        </div>
        <div className="wa-hicons">{Icon.video}{Icon.call}{Icon.menu}</div>
      </div>
      <div className="wa-body">
        <div className="wa-date"><span>{dateChip}</span></div>
        {wa.encNotice && (
          <div className="wa-enc"><span>🔒 Messages are end-to-end encrypted. No one outside of this chat, not even WhatsApp, can read them.</span></div>
        )}
        {msgs.map((m) => <WAMessage key={m.id} msg={m} />)}
        {wa.typing && (
          <div className="wa-typing"><div className="tb"><i /><i /><i /></div></div>
        )}
      </div>
      {device === 'android' ? (
        <div className="wa-in-a"><div className="fld">{Icon.emoji}<span className="ph">Message</span>{Icon.clip}{Icon.camera}</div><div className="fab">{Icon.mic}</div></div>
      ) : (
        <div className="wa-in-i"><span className="plus">{Icon.plus}</span><div className="fld"><span className="ph">Message</span><span className="ti">{Icon.sticker}</span></div><span className="ti">{Icon.camera}</span><span className="ti">{Icon.mic}</span></div>
      )}
    </div>
    </PhoneFrame>
  )
}
