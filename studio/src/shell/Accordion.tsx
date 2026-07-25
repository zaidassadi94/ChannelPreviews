import { createContext, useContext, useState, type ReactNode } from 'react'

/* Single-open accordion: opening one section collapses the others.
   Solves the "scroll past long open drop-downs" problem in one shared place. */
const AccCtx = createContext<{ open: string | null; setOpen: (id: string | null) => void }>({ open: null, setOpen: () => {} })

export function AccordionGroup({ children, defaultOpen }: { children: ReactNode; defaultOpen?: string }) {
  const [open, setOpen] = useState<string | null>(defaultOpen ?? null)
  return <AccCtx.Provider value={{ open, setOpen }}>{children}</AccCtx.Provider>
}

export function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  const { open, setOpen } = useContext(AccCtx)
  const isOpen = open === id
  return (
    <div className={'group' + (isOpen ? ' open' : '')}>
      <button className="ghead" onClick={() => setOpen(isOpen ? null : id)}>
        {title}
        <span className="chev">▼</span>
      </button>
      <div className="gbody">{children}</div>
    </div>
  )
}
