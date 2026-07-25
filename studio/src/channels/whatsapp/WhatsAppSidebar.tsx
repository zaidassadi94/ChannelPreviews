import { useEffect, useRef } from 'react'
import { AccordionGroup, Section } from '@/shell/Accordion'
import { useStudio, WA_DEFAULTS, type WAMsg, type WAType } from '@/store/useStudio'
import { useToast } from '@/store/useToast'
import { packFor } from '@/content/model'
import { WA_TEMPLATES, type WATemplate } from './templates'

const TYPES: [WAType, string][] = [
  ['text', 'Text'],
  ['image', 'Image'],
  ['template', 'Template + buttons'],
]

export function WhatsAppSidebar() {
  const ctxId = useStudio((s) => s.ctxId())
  const messages = useStudio((s) => s.wa.messages)
  const encNotice = useStudio((s) => s.wa.encNotice)
  const typing = useStudio((s) => s.wa.typing)
  const dateChip = useStudio((s) => s.dateChip)
  const brand = useStudio((s) => s.brand)

  const waSetMessages = useStudio((s) => s.waSetMessages)
  const waAdd = useStudio((s) => s.waAdd)
  const waUpdate = useStudio((s) => s.waUpdate)
  const waDelete = useStudio((s) => s.waDelete)
  const waMove = useStudio((s) => s.waMove)
  const waToggle = useStudio((s) => s.waToggle)
  const waClear = useStudio((s) => s.waClear)
  const setBrand = useStudio((s) => s.setBrand)
  const setDateChip = useStudio((s) => s.setDateChip)
  const show = useToast((s) => s.show)

  function applyTemplate(t: WATemplate, announce = true) {
    const p = packFor(ctxId)
    if (!p) return
    waSetMessages(t.build(p, ctxId))
    setBrand({ name: p.brand, sub: 'online' })
    if (announce) show('Template applied' + (t.flow ? ' · hit Simulate to branch' : ''))
  }

  // auto-apply the first template on load and whenever the industry/sub changes
  const lastCtx = useRef<string | null>(null)
  useEffect(() => {
    if (lastCtx.current === ctxId) return
    lastCtx.current = ctxId
    applyTemplate(WA_TEMPLATES[0], false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctxId])

  return (
    <AccordionGroup defaultOpen="templates">
      <Section id="templates" title="Templates">
        <div className="hint">Ready-made WhatsApp messages. Ones tagged <b style={{ color: 'var(--accent-ink)' }}>FLOW</b> branch when you hit Simulate and tap the buttons.</div>
        <div className="tpl-grid">
          {WA_TEMPLATES.map((t, i) => (
            <button key={i} className="tpl" onClick={() => applyTemplate(t)}>
              <span className="ti">{t.icon}</span>
              <span className="tc">
                <span className="tt">{t.name}{t.flow && <span className="flow">FLOW</span>}</span>
                <span className="td">{t.desc}</span>
              </span>
            </button>
          ))}
        </div>
        <button className="btn ghost block" style={{ marginTop: 11 }} onClick={() => waClear()}>Clear &amp; start blank</button>
      </Section>

      <Section id="sender" title="Sender / business">
        <label className="field"><span>Business name</span>
          <input type="text" value={brand.name} onChange={(e) => setBrand({ name: e.target.value })} />
        </label>
        <label className="field"><span>Status line</span>
          <input type="text" value={brand.sub} onChange={(e) => setBrand({ sub: e.target.value })} />
        </label>
        <div className="toggle-row"><span>Verified business badge</span>
          <label className="switch"><input type="checkbox" checked={brand.verified} onChange={(e) => setBrand({ verified: e.target.checked })} /><span className="slider" /></label>
        </div>
      </Section>

      <Section id="conversation" title="Conversation">
        <div className="hint">Each row is a bubble. Set who it's from and its type. In a button, add <code>&gt;&gt; reply</code> to make it branch in Simulate.</div>
        {messages.map((msg, idx) => (
          <MsgCard key={msg.id} msg={msg} idx={idx} count={messages.length}
            onType={(t) => waUpdate(idx, { ...WA_DEFAULTS[t], from: msg.from })}
            onFrom={(f) => waUpdate(idx, { from: f })}
            onField={(patch) => waUpdate(idx, patch)}
            onDel={() => waDelete(idx)} onMove={(d) => waMove(idx, d)} />
        ))}
        <div className="addmsg">
          {TYPES.map(([v, l]) => (
            <button key={v} onClick={() => waAdd(v)}>+ {l}</button>
          ))}
        </div>
      </Section>

      <Section id="context" title="Chat context">
        <label className="field"><span>Date chip</span>
          <input type="text" value={dateChip} onChange={(e) => setDateChip(e.target.value)} />
        </label>
        <div className="toggle-row"><span>Encryption notice</span>
          <label className="switch"><input type="checkbox" checked={encNotice} onChange={() => waToggle('encNotice')} /><span className="slider" /></label>
        </div>
        <div className="toggle-row"><span>Typing indicator</span>
          <label className="switch"><input type="checkbox" checked={typing} onChange={() => waToggle('typing')} /><span className="slider" /></label>
        </div>
      </Section>
    </AccordionGroup>
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
        <select value={msg.type} onChange={(e) => onType(e.target.value as WAType)}>
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
          <ButtonsField value={msg.buttons || ''} onChange={(v) => onField({ buttons: v })} />
        </>
      )}
      {msg.type === 'image' && (
        <>
          <label className="field"><span>Image URL (blank = placeholder)</span><input type="text" value={msg.img || ''} onChange={(e) => onField({ img: e.target.value })} /></label>
          <label className="field"><span>Caption</span><textarea value={msg.caption || ''} onChange={(e) => onField({ caption: e.target.value })} /></label>
          <ButtonsField value={msg.buttons || ''} onChange={(v) => onField({ buttons: v })} />
        </>
      )}
      {msg.type === 'template' && (
        <>
          <label className="field"><span>Header image URL (optional)</span><input type="text" value={msg.img || ''} onChange={(e) => onField({ img: e.target.value })} /></label>
          <label className="field"><span>Body (*bold* _italic_)</span><textarea value={msg.body || ''} onChange={(e) => onField({ body: e.target.value })} /></label>
          <label className="field"><span>Footer (small print)</span><input type="text" value={msg.footer || ''} onChange={(e) => onField({ footer: e.target.value })} /></label>
          <ButtonsField value={msg.buttons || ''} onChange={(v) => onField({ buttons: v })} />
        </>
      )}
    </div>
  )
}

function ButtonsField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <label className="field">
      <span>Buttons</span>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder="Label | reply | value >> branch reply" />
      <div className="hint" style={{ marginTop: 6 }}>One per line: <code>Label | reply·url·call·copy | value</code>. Add <code>&gt;&gt; reply</code> to branch in Simulate.</div>
    </label>
  )
}
