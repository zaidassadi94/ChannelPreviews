import { useStudio, type MMsg, type MType } from '@/store/useStudio'
import { Icon } from '@/lib/icons'
import type { SectionDef } from '@/channels/registry'
import { ImageField } from '@/shell/ImageField'
import { ButtonsEditor } from '@/shell/ButtonsEditor'
import { CarouselEditor } from '@/shell/CarouselEditor'
import { RCS_TEMPLATES, applyRcsTemplate } from './templates'

const CH = 'rcs'
const TYPES: [MType, string][] = [
  ['text', 'Text'],
  ['image', 'Image'],
  ['card', 'Rich card'],
  ['carousel', 'Carousel'],
]

function TemplatesPanel() {
  const msgClear = useStudio((s) => s.msgClear)
  return (
    <>
      <p className="panel-hint">Ready-made RCS messages — rich cards, carousels and suggestion chips. Ones tagged <b>FLOW</b> branch when you hit Simulate and tap the chips.</p>
      <div className="tpl-grid">
        {RCS_TEMPLATES.map((t, i) => (
          <button key={i} className="tpl" onClick={() => applyRcsTemplate(t)}>
            <span className="ti">{t.icon}</span>
            <span className="tc">
              <span className="tt">{t.name}{t.flow && <span className="flow">FLOW</span>}</span>
              <span className="td">{t.desc}</span>
            </span>
          </button>
        ))}
      </div>
      <button className="btn ghost block" style={{ marginTop: 12 }} onClick={() => msgClear(CH)}>{Icon.refresh}Clear &amp; start blank</button>
    </>
  )
}

function ConversationPanel() {
  const messages = useStudio((s) => s.msg[CH].messages)
  const msgAdd = useStudio((s) => s.msgAdd)
  const msgReplaceType = useStudio((s) => s.msgReplaceType)
  const msgUpdate = useStudio((s) => s.msgUpdate)
  const msgDelete = useStudio((s) => s.msgDelete)
  const msgMove = useStudio((s) => s.msgMove)
  return (
    <>
      <p className="panel-hint">Each row is a bubble. Rich cards, carousels and chips are RCS-only. Add <code>&gt;&gt; reply</code> after a chip to make it branch in Simulate.</p>
      {messages.map((msg, idx) => (
        <MsgCard key={msg.id} msg={msg} idx={idx} count={messages.length}
          onType={(t) => msgReplaceType(CH, idx, t)}
          onFrom={(f) => msgUpdate(CH, idx, { from: f })}
          onField={(patch) => msgUpdate(CH, idx, patch)}
          onDel={() => msgDelete(CH, idx)} onMove={(d) => msgMove(CH, idx, d)} />
      ))}
      <div className="addmsg">
        {TYPES.map(([v, l]) => <button key={v} onClick={() => msgAdd(CH, v)}>+ {l}</button>)}
      </div>
    </>
  )
}

function SenderPanel() {
  const brand = useStudio((s) => s.brand)
  const setBrand = useStudio((s) => s.setBrand)
  return (
    <>
      <label className="field"><span>Business name</span>
        <input type="text" value={brand.name} onChange={(e) => setBrand({ name: e.target.value })} />
      </label>
      <label className="field"><span>Agent description</span>
        <input type="text" value={brand.desc} onChange={(e) => setBrand({ desc: e.target.value })} />
      </label>
      <div className="toggle-row"><span>Verified business badge</span>
        <label className="switch"><input type="checkbox" checked={brand.verified} onChange={(e) => setBrand({ verified: e.target.checked })} /><span className="slider" /></label>
      </div>
      <div className="toggle-row"><span>RBM verified-agent banner</span>
        <label className="switch"><input type="checkbox" checked={brand.agentCard} onChange={(e) => setBrand({ agentCard: e.target.checked })} /><span className="slider" /></label>
      </div>
    </>
  )
}

function ContextPanel() {
  const typing = useStudio((s) => s.msg[CH].typing)
  const dateChip = useStudio((s) => s.dateChip)
  const msgToggleTyping = useStudio((s) => s.msgToggleTyping)
  const setDateChip = useStudio((s) => s.setDateChip)
  return (
    <>
      <label className="field"><span>Date chip</span>
        <input type="text" value={dateChip} onChange={(e) => setDateChip(e.target.value)} />
      </label>
      <div className="toggle-row"><span>Typing indicator</span>
        <label className="switch"><input type="checkbox" checked={typing} onChange={() => msgToggleTyping(CH)} /><span className="slider" /></label>
      </div>
    </>
  )
}

function MsgCard({ msg, idx, count, onType, onFrom, onField, onDel, onMove }: {
  msg: MMsg; idx: number; count: number
  onType: (t: MType) => void
  onFrom: (f: 'business' | 'customer') => void
  onField: (patch: Partial<MMsg>) => void
  onDel: () => void
  onMove: (d: -1 | 1) => void
}) {
  return (
    <div className="msg-card">
      <div className="mc-top">
        <span className="lbl">{idx + 1}</span>
        <select value={msg.type} onChange={(e) => onType(e.target.value as MType)}>
          {TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <button className="icobtn" title="Move up" onClick={() => onMove(-1)} disabled={idx === 0}>↑</button>
        <button className="icobtn" title="Move down" onClick={() => onMove(1)} disabled={idx === count - 1}>↓</button>
        <button className="icobtn" title="Delete" onClick={onDel}>✕</button>
      </div>
      <div className="seg-from">
        <button className={msg.from === 'business' ? 'on' : ''} onClick={() => onFrom('business')}>Business · in</button>
        <button className={msg.from !== 'business' ? 'on' : ''} onClick={() => onFrom('customer')}>Customer · out</button>
      </div>

      {msg.type === 'text' && (
        <>
          <label className="field"><span>Message text</span><textarea value={msg.text || ''} onChange={(e) => onField({ text: e.target.value })} /></label>
          <ChipsField value={msg.chips || ''} onChange={(v) => onField({ chips: v })} />
        </>
      )}
      {msg.type === 'image' && (
        <>
          <div className="field"><span>Image</span><ImageField pick value={msg.img || ''} onChange={(v) => onField({ img: v })} placeholder="or paste an image URL (blank = placeholder)" /></div>
          <label className="field"><span>Caption</span><textarea value={msg.caption || ''} onChange={(e) => onField({ caption: e.target.value })} /></label>
        </>
      )}
      {msg.type === 'card' && (
        <>
          <div className="field"><span>Image</span><ImageField pick value={msg.img || ''} onChange={(v) => onField({ img: v })} placeholder="or paste an image URL (blank = placeholder)" /></div>
          <label className="field"><span>Title</span><input type="text" value={msg.title || ''} onChange={(e) => onField({ title: e.target.value })} /></label>
          <label className="field"><span>Description</span><textarea value={msg.desc || ''} onChange={(e) => onField({ desc: e.target.value })} /></label>
          <ButtonsField value={msg.buttons || ''} onChange={(v) => onField({ buttons: v })} />
          <ChipsField value={msg.chips || ''} onChange={(v) => onField({ chips: v })} />
        </>
      )}
      {msg.type === 'carousel' && (
        <>
          <div className="field"><span>Products</span>
            <CarouselEditor value={msg.cards || ''} onChange={(v) => onField({ cards: v })} />
          </div>
          <ChipsField value={msg.chips || ''} onChange={(v) => onField({ chips: v })} />
        </>
      )}
    </div>
  )
}

function ButtonsField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return <ButtonsEditor value={value} onChange={onChange} max={4} />
}

function ChipsField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <label className="field">
      <span>Suggested replies (chips)</span>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder="Chip label >> branch reply" />
      <div className="panel-hint" style={{ marginTop: 6 }}>One per line. Add <code>&gt;&gt; reply</code> to branch in Simulate.</div>
    </label>
  )
}

export const rcsSections: SectionDef[] = [
  { id: 'templates', label: 'Presets', icon: Icon.templates, Panel: TemplatesPanel },
  { id: 'conversation', label: 'Chat', icon: Icon.convo, Panel: ConversationPanel },
  { id: 'sender', label: 'Sender', icon: Icon.sender, Panel: SenderPanel },
  { id: 'context', label: 'Context', icon: Icon.context, Panel: ContextPanel },
]
