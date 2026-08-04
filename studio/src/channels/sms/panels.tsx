import { useStudio, type MMsg, type MType } from '@/store/useStudio'
import { Icon } from '@/lib/icons'
import type { SectionDef } from '@/channels/registry'
import { ImageField } from '@/shell/ImageField'
import { SMS_TEMPLATES, applySmsTemplate } from './templates'

const CH = 'sms'
const TYPES: [MType, string][] = [
  ['text', 'Text'],
  ['image', 'MMS image'],
]

function TemplatesPanel() {
  const msgClear = useStudio((s) => s.msgClear)
  return (
    <>
      <p className="panel-hint">Ready-made SMS / MMS messages — plain text with a GSM-7 segment count.</p>
      <div className="tpl-grid">
        {SMS_TEMPLATES.map((t, i) => (
          <button key={i} className="tpl" onClick={() => applySmsTemplate(t)}>
            <span className="ti">{t.icon}</span>
            <span className="tc">
              <span className="tt">{t.name}</span>
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
      <p className="panel-hint">Each row is a message. Text keeps a live segment count; MMS adds an image.</p>
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
      <label className="field"><span>Sender ID (shown as name)</span>
        <input type="text" value={brand.name} onChange={(e) => setBrand({ name: e.target.value })} />
      </label>
      <div className="field"><span>Logo</span><ImageField logo logoQuery={brand.name} value={brand.logo || ''} onChange={(v) => setBrand({ logo: v || null })} placeholder="or paste a logo URL (blank = monogram)" /></div>
      <label className="field"><span>Phone / sender number</span>
        <input type="text" value={brand.phone} onChange={(e) => setBrand({ phone: e.target.value })} />
      </label>
    </>
  )
}

function ContextPanel() {
  const messages = useStudio((s) => s.msg[CH].messages)
  const typing = useStudio((s) => s.msg[CH].typing)
  const dateChip = useStudio((s) => s.dateChip)
  const msgToggleTyping = useStudio((s) => s.msgToggleTyping)
  const setDateChip = useStudio((s) => s.setDateChip)

  const txt = messages.filter((m) => m.from === 'business').map((m) => m.text || m.caption || '').join(' ')
  const len = txt.length
  const uni = /[^\x00-\x7f]/.test(txt)
  const per = uni ? 70 : 160
  const mp = uni ? 67 : 153
  const seg = len <= per ? 1 : Math.ceil(len / mp)

  return (
    <>
      <label className="field"><span>Date chip</span>
        <input type="text" value={dateChip} onChange={(e) => setDateChip(e.target.value)} />
      </label>
      <div className="toggle-row"><span>Typing indicator</span>
        <label className="switch"><input type="checkbox" checked={typing} onChange={() => msgToggleTyping(CH)} /><span className="slider" /></label>
      </div>
      <div className="panel-hint" style={{ marginTop: 10 }}>SMS length — <b>{len}</b> chars · <b>{seg}</b> segment{seg > 1 ? 's' : ''} · {uni ? 'Unicode' : 'GSM-7'}</div>
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
        <label className="field"><span>Message text</span><textarea value={msg.text || ''} onChange={(e) => onField({ text: e.target.value })} /></label>
      )}
      {msg.type === 'image' && (
        <>
          <div className="field"><span>Image</span><ImageField pick value={msg.img || ''} onChange={(v) => onField({ img: v })} placeholder="or paste an image URL (blank = placeholder)" /></div>
          <label className="field"><span>Caption</span><textarea value={msg.caption || ''} onChange={(e) => onField({ caption: e.target.value })} /></label>
        </>
      )}
    </div>
  )
}

export const smsSections: SectionDef[] = [
  { id: 'templates', label: 'Presets', icon: Icon.templates, Panel: TemplatesPanel },
  { id: 'conversation', label: 'Chat', icon: Icon.convo, Panel: ConversationPanel },
  { id: 'sender', label: 'Brand', icon: Icon.sender, Panel: SenderPanel },
  { id: 'context', label: 'Context', icon: Icon.context, Panel: ContextPanel },
]
