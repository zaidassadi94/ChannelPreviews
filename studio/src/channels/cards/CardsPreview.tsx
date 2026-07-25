import './cards.css'
import type { ReactNode } from 'react'
import { useStudio, type CardItem } from '@/store/useStudio'
import { useToast } from '@/store/useToast'
import { useAutoTemplate } from '@/lib/useAutoTemplate'
import { PhoneFrame } from '@/shell/PhoneFrame'
import { brandMark } from '@/lib/util'
import { fmtLite } from '@/channels/notify/shared'
import { CARDS_TEMPLATES, applyCardsTemplate } from './templates'

const CI: Record<string, ReactNode> = {
  back: <svg viewBox="0 0 24 24" fill="none"><path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  dots: <svg viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" /></svg>,
  bell: <svg viewBox="0 0 24 24" fill="none"><path d="M6 9a6 6 0 0112 0c0 5 2 6 2 6H4s2-1 2-6zM9.5 20a2.5 2.5 0 005 0" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" /></svg>,
}

function useCardSim() {
  const sim = useStudio((s) => s.sim)
  const show = useToast((s) => s.show)
  return { sim, onTap: (t: string) => { if (!sim) return; show('▸ ' + (t ? `Opened "${t}"` : 'Opened card')) } }
}

function Card({ c }: { c: CardItem }) {
  const { sim, onTap } = useCardSim()
  return (
    <div className={'cd-card' + (c.unread ? ' unread' : '') + (sim ? ' clickable' : '')} onClick={() => onTap(c.title)}>
      {c.image && <img className="cd-img" src={c.image} alt="" />}
      <div className="cd-b">
        <div className="cd-meta">
          {c.tag && <span className="cd-tag">{c.tag}</span>}
          <span className="cd-time">{c.time}</span>
          {c.unread && <span className="cd-dot" />}
        </div>
        {c.title && <div className="cd-t">{c.title}</div>}
        {c.body && <div className="cd-x">{fmtLite(c.body)}</div>}
      </div>
    </div>
  )
}

export function CardsPreview() {
  const ctxId = useStudio((s) => s.ctxId())
  useAutoTemplate(ctxId, () => applyCardsTemplate(CARDS_TEMPLATES[0], false))

  const cards = useStudio((s) => s.cards)
  const icon = cards.logo || brandMark(cards.appName, 96)
  const unread = cards.items.filter((i) => i.unread).length

  return (
    <PhoneFrame>
      <div className="cd-app">
        <div className="cd-head">
          <span className="ic">{CI.back}</span>
          <div className="ttl"><span className="tl">{cards.screenTitle || 'Updates'}</span>{unread > 0 && <span className="cnt">{unread} new</span>}</div>
          <img className="app-ic" src={icon} alt={cards.appName} />
        </div>
        <div className="cd-list">
          {cards.items.length === 0
            ? <div className="cd-empty">No cards yet — add one from the editor.</div>
            : cards.items.map((c, i) => <Card key={i} c={c} />)}
        </div>
      </div>
    </PhoneFrame>
  )
}
