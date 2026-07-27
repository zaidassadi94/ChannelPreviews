import { parseButtons, type Btn } from '@/lib/util'

/* Structured button editor: each button is a Type dropdown + label + one
 * contextual field (URL / phone / code / auto-reply), with add + reorder.
 * Reads and writes the same `Label | type | value >> response` string the
 * previews already parse, so there's no stored-format change. */

const TYPES: [Btn['type'], string][] = [
  ['reply', 'Quick reply'],
  ['url', 'Visit URL'],
  ['call', 'Call'],
  ['copy', 'Copy code'],
]
const PLACEHOLDER: Partial<Record<Btn['type'], string>> = {
  url: 'https://example.com',
  call: '+1 800 555 0199',
  copy: 'SAVE20',
}

function serialize(btns: Btn[]): string {
  return btns
    .map((b) => {
      const main = [b.label, b.type, b.value].join(' | ')
      return b.response ? `${main} >> ${b.response}` : main
    })
    .join('\n')
}

export function ButtonsEditor({ value, onChange, max = 3, label = 'Buttons', hint }: {
  value: string
  onChange: (v: string) => void
  max?: number
  label?: string
  hint?: string
}) {
  const btns = parseButtons(value)
  const commit = (next: Btn[]) => onChange(serialize(next))
  const update = (i: number, patch: Partial<Btn>) => { const n = btns.slice(); n[i] = { ...n[i], ...patch }; commit(n) }
  const del = (i: number) => commit(btns.filter((_, j) => j !== i))
  const move = (i: number, d: -1 | 1) => { const j = i + d; if (j < 0 || j >= btns.length) return; const n = btns.slice();[n[i], n[j]] = [n[j], n[i]]; commit(n) }
  const add = () => commit([...btns, { label: 'Button', type: 'reply', value: '', response: '' }])

  return (
    <div className="field">
      <span>{label}</span>
      <div className="btns-ed">
        {btns.map((b, i) => (
          <div className="btn-row" key={i}>
            <div className="btn-row-top">
              <select value={b.type} onChange={(e) => update(i, { type: e.target.value as Btn['type'], value: '' })}>
                {TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
              <input className="btn-label" type="text" value={b.label} placeholder="Button label" onChange={(e) => update(i, { label: e.target.value })} />
              <button className="icobtn" title="Move up" onClick={() => move(i, -1)} disabled={i === 0}>↑</button>
              <button className="icobtn" title="Move down" onClick={() => move(i, 1)} disabled={i === btns.length - 1}>↓</button>
              <button className="icobtn" title="Delete" onClick={() => del(i)}>✕</button>
            </div>
            {b.type !== 'reply'
              ? <input type="text" value={b.value} placeholder={PLACEHOLDER[b.type] || ''} onChange={(e) => update(i, { value: e.target.value })} />
              : <input type="text" value={b.response} placeholder="Auto-reply when tapped (optional — branches in Simulate)" onChange={(e) => update(i, { response: e.target.value })} />}
          </div>
        ))}
        {btns.length < max && <div className="addmsg"><button onClick={add}>+ Add button</button></div>}
        {hint && <div className="panel-hint" style={{ marginTop: 2 }}>{hint}</div>}
      </div>
    </div>
  )
}
