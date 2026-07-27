import { useStudio, type CardItem } from '@/store/useStudio'
import { Icon } from '@/lib/icons'
import type { SectionDef } from '@/channels/registry'
import { ImageField } from '@/shell/ImageField'
import { CARDS_TEMPLATES, applyCardsTemplate } from './templates'

function TemplatesPanel() {
  const setCards = useStudio((s) => s.setCards)
  return (
    <>
      <p className="panel-hint">Ready-made inbox feeds. Ones tagged <b>FLOW</b> open a card in Simulate.</p>
      <div className="tpl-grid">
        {CARDS_TEMPLATES.map((t, i) => (
          <button key={i} className="tpl" onClick={() => applyCardsTemplate(t)}>
            <span className="ti">{t.icon}</span>
            <span className="tc"><span className="tt">{t.name}{t.flow && <span className="flow">FLOW</span>}</span><span className="td">{t.desc}</span></span>
          </button>
        ))}
      </div>
      <button className="btn ghost block" style={{ marginTop: 12 }} onClick={() => setCards({ items: [] })}>{Icon.refresh}Clear all cards</button>
    </>
  )
}

const blank: CardItem = { image: '', title: 'New card', body: 'Card body goes here.', tag: '', time: 'now', unread: false }

function CardsPanel() {
  const items = useStudio((s) => s.cards.items)
  const setCards = useStudio((s) => s.setCards)
  const upd = (i: number, patch: Partial<CardItem>) => setCards({ items: items.map((c, j) => (j === i ? { ...c, ...patch } : c)) })
  const del = (i: number) => setCards({ items: items.filter((_, j) => j !== i) })
  const move = (i: number, d: -1 | 1) => { const j = i + d; if (j < 0 || j >= items.length) return; const n = items.slice(); [n[i], n[j]] = [n[j], n[i]]; setCards({ items: n }) }
  return (
    <>
      <p className="panel-hint">The list of cards in the app inbox. Drag order with the arrows; the dot marks a card as unread.</p>
      {items.map((c, i) => (
        <div className="msg-card" key={i}>
          <div className="mc-top">
            <span className="lbl">{i + 1}</span>
            <span style={{ flex: 1, fontSize: 11.5, fontWeight: 700, color: 'var(--muted)' }}>Card</span>
            <button className="icobtn" title="Move up" onClick={() => move(i, -1)}>↑</button>
            <button className="icobtn" title="Move down" onClick={() => move(i, 1)}>↓</button>
            <button className="icobtn" title="Delete" onClick={() => del(i)}>✕</button>
          </div>
          <label className="field"><span>Title</span><input type="text" value={c.title} onChange={(e) => upd(i, { title: e.target.value })} /></label>
          <label className="field"><span>Body</span><textarea value={c.body} onChange={(e) => upd(i, { body: e.target.value })} /></label>
          <div className="mc-row">
            <label className="field"><span>Tag / label</span><input type="text" value={c.tag} onChange={(e) => upd(i, { tag: e.target.value })} placeholder="e.g. Offer" /></label>
            <label className="field"><span>Time</span><input type="text" value={c.time} onChange={(e) => upd(i, { time: e.target.value })} placeholder="e.g. 2h" /></label>
          </div>
          <div className="field"><span>Banner image</span><ImageField pick value={c.image} onChange={(v) => upd(i, { image: v })} placeholder="or paste an image URL (optional)" /></div>
          <div className="toggle-row"><span>Unread</span>
            <label className="switch"><input type="checkbox" checked={c.unread} onChange={(e) => upd(i, { unread: e.target.checked })} /><span className="slider" /></label>
          </div>
        </div>
      ))}
      <div className="addmsg"><button onClick={() => setCards({ items: [...items, { ...blank }] })}>+ Add card</button></div>
    </>
  )
}

function AppPanel() {
  const cards = useStudio((s) => s.cards)
  const setCards = useStudio((s) => s.setCards)
  return (
    <>
      <label className="field"><span>App name</span><input type="text" value={cards.appName} onChange={(e) => setCards({ appName: e.target.value })} /></label>
      <label className="field"><span>Screen title</span><input type="text" value={cards.screenTitle} onChange={(e) => setCards({ screenTitle: e.target.value })} placeholder="Updates" /></label>
      <div className="field"><span>App icon</span><ImageField value={cards.logo || ''} onChange={(v) => setCards({ logo: v || null })} placeholder="or paste an icon URL (blank = monogram)" /></div>
    </>
  )
}

export const cardsSections: SectionDef[] = [
  { id: 'templates', label: 'Presets', icon: Icon.templates, Panel: TemplatesPanel },
  { id: 'cards', label: 'Cards', icon: Icon.convo, Panel: CardsPanel },
  { id: 'app', label: 'App', icon: Icon.sender, Panel: AppPanel },
]
