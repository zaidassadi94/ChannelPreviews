import { useEffect, useRef, useState } from 'react'
import { useStudio, WA_DEFAULTS, type WAMsg, type WAType } from '@/store/useStudio'
import { Icon } from '@/lib/icons'
import type { SectionDef } from '@/channels/registry'
import { ImageField } from '@/shell/ImageField'
import { ButtonsEditor } from '@/shell/ButtonsEditor'
import { parseCards, type Card } from '@/lib/util'
import { photoCandidates } from '@/lib/media'
import { WA_TEMPLATES, applyWATemplate } from './templates'

const TYPES: [WAType, string][] = [
  ['text', 'Text'],
  ['image', 'Image'],
  ['template', 'Template + buttons'],
  ['carousel', 'Product carousel'],
]

/* ---------------- Templates ---------------- */
function TemplatesPanel() {
  const waClear = useStudio((s) => s.waClear)
  return (
    <>
      <p className="panel-hint">Ready-made WhatsApp messages. Ones tagged <b>FLOW</b> branch when you hit Simulate and tap the buttons.</p>
      <div className="tpl-grid">
        {WA_TEMPLATES.map((t, i) => (
          <button key={i} className="tpl" onClick={() => applyWATemplate(t)}>
            <span className="ti">{t.icon}</span>
            <span className="tc">
              <span className="tt">{t.name}{t.flow && <span className="flow">FLOW</span>}</span>
              <span className="td">{t.desc}</span>
            </span>
          </button>
        ))}
      </div>
      <button className="btn ghost block" style={{ marginTop: 12 }} onClick={() => waClear()}>{Icon.refresh}Clear &amp; start blank</button>
    </>
  )
}

/* ---------------- Conversation ---------------- */
function ConversationPanel() {
  const messages = useStudio((s) => s.wa.messages)
  const waAdd = useStudio((s) => s.waAdd)
  const waUpdate = useStudio((s) => s.waUpdate)
  const waDelete = useStudio((s) => s.waDelete)
  const waMove = useStudio((s) => s.waMove)
  return (
    <>
      <p className="panel-hint">Each row is a bubble. Set who it's from and its type. In a button, add <code>&gt;&gt; reply</code> to make it branch in Simulate.</p>
      {messages.map((msg, idx) => (
        <MsgCard key={msg.id} msg={msg} idx={idx} count={messages.length}
          onType={(t) => waUpdate(idx, { ...WA_DEFAULTS[t], from: msg.from })}
          onFrom={(f) => waUpdate(idx, { from: f })}
          onField={(patch) => waUpdate(idx, patch)}
          onDel={() => waDelete(idx)} onMove={(d) => waMove(idx, d)} />
      ))}
      <div className="addmsg">
        {TYPES.map(([v, l]) => <button key={v} onClick={() => waAdd(v)}>+ {l}</button>)}
      </div>
    </>
  )
}

/* ---------------- Sender ---------------- */
function SenderPanel() {
  const brand = useStudio((s) => s.brand)
  const setBrand = useStudio((s) => s.setBrand)
  return (
    <>
      <label className="field"><span>Business name</span>
        <input type="text" value={brand.name} onChange={(e) => setBrand({ name: e.target.value })} />
      </label>
      <label className="field"><span>Status line</span>
        <input type="text" value={brand.sub} onChange={(e) => setBrand({ sub: e.target.value })} />
      </label>
      <div className="toggle-row"><span>Verified business badge</span>
        <label className="switch"><input type="checkbox" checked={brand.verified} onChange={(e) => setBrand({ verified: e.target.checked })} /><span className="slider" /></label>
      </div>
    </>
  )
}

/* ---------------- Chat context ---------------- */
function ContextPanel() {
  const encNotice = useStudio((s) => s.wa.encNotice)
  const typing = useStudio((s) => s.wa.typing)
  const dateChip = useStudio((s) => s.dateChip)
  const waToggle = useStudio((s) => s.waToggle)
  const setDateChip = useStudio((s) => s.setDateChip)
  return (
    <>
      <label className="field"><span>Date chip</span>
        <input type="text" value={dateChip} onChange={(e) => setDateChip(e.target.value)} />
      </label>
      <div className="toggle-row"><span>Encryption notice</span>
        <label className="switch"><input type="checkbox" checked={encNotice} onChange={() => waToggle('encNotice')} /><span className="slider" /></label>
      </div>
      <div className="toggle-row"><span>Typing indicator</span>
        <label className="switch"><input type="checkbox" checked={typing} onChange={() => waToggle('typing')} /><span className="slider" /></label>
      </div>
    </>
  )
}

function MsgCard({ msg, idx, count, onType, onFrom, onField, onDel, onMove }: {
  msg: WAMsg; idx: number; count: number
  onType: (t: WAType) => void
  onFrom: (f: 'business' | 'customer') => void
  onField: (patch: Partial<WAMsg>) => void
  onDel: () => void
  onMove: (d: -1 | 1) => void
}) {
  return (
    <div className="msg-card">
      <div className="mc-top">
        <span className="lbl">{idx + 1}</span>
        <span className="mc-name">Message</span>
        <span className="grow" />
        <button className="icobtn" title="Move up" onClick={() => onMove(-1)} disabled={idx === 0}>↑</button>
        <button className="icobtn" title="Move down" onClick={() => onMove(1)} disabled={idx === count - 1}>↓</button>
        <button className="icobtn" title="Delete" onClick={onDel}>✕</button>
      </div>
      <div className="field"><span>Format</span>
        <div className="seg-in">{TYPES.map(([v, l]) => <button key={v} className={msg.type === v ? 'on' : ''} onClick={() => onType(v as WAType)}>{l}</button>)}</div>
      </div>
      <div className="seg-from">
        <button className={msg.from === 'business' ? 'on' : ''} onClick={() => onFrom('business')}>Business · in</button>
        <button className={msg.from !== 'business' ? 'on' : ''} onClick={() => onFrom('customer')}>Customer · out</button>
      </div>

      {msg.type === 'text' && (
        <>
          <label className="field"><span>Message text</span><textarea value={msg.text || ''} onChange={(e) => onField({ text: e.target.value })} /></label>
          <ButtonsField value={msg.buttons || ''} onChange={(v) => onField({ buttons: v })} />
        </>
      )}
      {msg.type === 'image' && (
        <>
          <div className="field"><span>Image</span><ImageField value={msg.img || ''} onChange={(v) => onField({ img: v })} placeholder="or paste an image URL (blank = placeholder)" /></div>
          <label className="field"><span>Caption</span><textarea value={msg.caption || ''} onChange={(e) => onField({ caption: e.target.value })} /></label>
          <ButtonsField value={msg.buttons || ''} onChange={(v) => onField({ buttons: v })} />
        </>
      )}
      {msg.type === 'template' && (
        <>
          <div className="field"><span>Header image (optional)</span><ImageField value={msg.img || ''} onChange={(v) => onField({ img: v })} /></div>
          <label className="field"><span>Body (*bold* _italic_)</span><textarea value={msg.body || ''} onChange={(e) => onField({ body: e.target.value })} /></label>
          <label className="field"><span>Footer (small print)</span><input type="text" value={msg.footer || ''} onChange={(e) => onField({ footer: e.target.value })} /></label>
          <ButtonsField value={msg.buttons || ''} onChange={(v) => onField({ buttons: v })} />
        </>
      )}
      {msg.type === 'carousel' && (
        <div className="field"><span>Products</span>
          <CarouselEditor value={msg.cards || ''} onChange={(v) => onField({ cards: v })} />
        </div>
      )}
    </div>
  )
}

/* Per-card carousel editor: each product gets an image (upload / drop / paste / pick
   from photos) plus title, price, button and link — no more raw pipe-delimited text. */
const serializeCards = (cards: Card[]): string =>
  cards.map((c) => `${c.img} | ${c.title} | ${c.sub} | ${c.btn} | ${c.val}`).join('\n')
const blankCard = (): Card => ({ img: '', title: '', sub: '', btn: 'Shop', val: '' })

function CarouselEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const seed = () => { const c = parseCards(value); return c.length ? c : [blankCard()] }
  const [cards, setCards] = useState<Card[]>(seed)
  const [pick, setPick] = useState<{ idx: number; urls: string[] } | null>(null)
  const [loading, setLoading] = useState<number | null>(null)
  // Re-seed only when an EXTERNAL change (preset / AI / New image) rewrites the string,
  // so typing (which round-trips through the same string) never fights the cursor.
  const lastStr = useRef(value)
  useEffect(() => {
    if (value !== lastStr.current) { const c = parseCards(value); setCards(c.length ? c : [blankCard()]); lastStr.current = value; setPick(null) }
  }, [value])

  const commit = (next: Card[]) => {
    setCards(next)
    const str = serializeCards(next)
    lastStr.current = str
    onChange(str)
  }
  const update = (i: number, patch: Partial<Card>) => commit(cards.map((c, j) => (j === i ? { ...c, ...patch } : c)))
  const remove = (i: number) => { commit(cards.filter((_, j) => j !== i)); setPick(null) }
  const add = () => commit([...cards, blankCard()])

  async function openPick(i: number) {
    if (pick?.idx === i) { setPick(null); return }
    setLoading(i)
    try { setPick({ idx: i, urls: await photoCandidates(undefined, cards[i].title || 'product', 'landscape', 8) }) }
    finally { setLoading(null) }
  }

  return (
    <div className="wa-cards">
      {cards.map((c, i) => (
        <div className="wa-cardedit" key={i}>
          <div className="wa-cardedit-top"><span className="lbl">Product {i + 1}</span><span className="grow" />
            <button className="icobtn" title="Remove product" onClick={() => remove(i)} disabled={cards.length <= 1}>✕</button>
          </div>
          <ImageField value={c.img} onChange={(v) => update(i, { img: v })} placeholder="or paste an image URL (blank = placeholder)" />
          <button type="button" className="wa-pickbtn" onClick={() => openPick(i)} disabled={loading === i}>
            {loading === i ? 'Loading…' : pick?.idx === i ? 'Hide photos' : '🖼️ Pick a photo'}
          </button>
          {pick?.idx === i && (pick.urls.length
            ? <div className="wa-pickgrid">{pick.urls.map((u) => (
                <button key={u} type="button" className="wa-pickthumb" title="Use this photo" onClick={() => { update(i, { img: u }); setPick(null) }}><img src={u} alt="" loading="lazy" /></button>
              ))}</div>
            : <div className="panel-hint" style={{ marginTop: 4 }}>No photos found for “{cards[i].title || 'this product'}”. Try a clearer name, or upload above.</div>
          )}
          <div className="wa-cardrow">
            <label className="field"><span>Title</span><input type="text" value={c.title} onChange={(e) => update(i, { title: e.target.value })} /></label>
            <label className="field"><span>Price</span><input type="text" value={c.sub} onChange={(e) => update(i, { sub: e.target.value })} /></label>
          </div>
          <div className="wa-cardrow">
            <label className="field"><span>Button</span><input type="text" value={c.btn} onChange={(e) => update(i, { btn: e.target.value })} /></label>
            <label className="field"><span>Link</span><input type="text" value={c.val} onChange={(e) => update(i, { val: e.target.value })} /></label>
          </div>
        </div>
      ))}
      <button type="button" className="btn ghost block" onClick={add}>{Icon.plus}Add product</button>
    </div>
  )
}

function ButtonsField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return <ButtonsEditor value={value} onChange={onChange} max={3} hint="Up to 3 buttons. Quick replies can auto-reply in Simulate." />
}

export const whatsappSections: SectionDef[] = [
  { id: 'templates', label: 'Presets', icon: Icon.templates, Panel: TemplatesPanel },
  { id: 'conversation', label: 'Chat', icon: Icon.convo, Panel: ConversationPanel },
  { id: 'sender', label: 'Sender', icon: Icon.sender, Panel: SenderPanel },
  { id: 'context', label: 'Context', icon: Icon.context, Panel: ContextPanel },
]
