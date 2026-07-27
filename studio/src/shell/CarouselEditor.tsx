import { useEffect, useRef, useState } from 'react'
import { Icon } from '@/lib/icons'
import { ImageField } from '@/shell/ImageField'
import { parseCards, type Card } from '@/lib/util'

/** Per-card editor for a product carousel (WhatsApp + RCS). Each card gets its own
 *  image (upload / drop / paste / pick a photo — the ImageField picker is seeded with
 *  the product title) plus title, price, button and link. Serialises back to the
 *  `image | title | price | button | link` string the preview parses. */
const serializeCards = (cards: Card[]): string =>
  cards.map((c) => `${c.img} | ${c.title} | ${c.sub} | ${c.btn} | ${c.val}`).join('\n')
const blankCard = (): Card => ({ img: '', title: '', sub: '', btn: 'Shop', val: '' })

export function CarouselEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const seed = () => { const c = parseCards(value); return c.length ? c : [blankCard()] }
  const [cards, setCards] = useState<Card[]>(seed)
  // Re-seed only on EXTERNAL changes (preset / AI / New image); typing round-trips
  // through the same string, so we must not fight the cursor by re-parsing our own writes.
  const lastStr = useRef(value)
  useEffect(() => {
    if (value !== lastStr.current) { const c = parseCards(value); setCards(c.length ? c : [blankCard()]); lastStr.current = value }
  }, [value])

  const commit = (next: Card[]) => { setCards(next); const str = serializeCards(next); lastStr.current = str; onChange(str) }
  const update = (i: number, patch: Partial<Card>) => commit(cards.map((c, j) => (j === i ? { ...c, ...patch } : c)))
  const remove = (i: number) => commit(cards.filter((_, j) => j !== i))
  const add = () => commit([...cards, blankCard()])

  return (
    <div className="wa-cards">
      {cards.map((c, i) => (
        <div className="wa-cardedit" key={i}>
          <div className="wa-cardedit-top"><span className="lbl">Product {i + 1}</span><span className="grow" />
            <button className="icobtn" title="Remove product" onClick={() => remove(i)} disabled={cards.length <= 1}>✕</button>
          </div>
          <ImageField pick query={c.title} value={c.img} onChange={(v) => update(i, { img: v })} placeholder="or paste an image URL (blank = placeholder)" />
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
