import { useEffect, useRef, useState } from 'react'
import { resolveBrandLogo } from '@/lib/media'

/** A "find a brand's logo" control for logo/avatar fields: type a brand or website and it
 *  fetches the real logo via /api/logo (Logo.dev → favicon) — no AI, no upload needed.
 *  `query` seeds the box (e.g. the sender/app name) and auto-searches once on mount.
 *  Clicking the result calls `onPick(url)`. Falls back to upload/paste (in ImageField)
 *  offline or when nothing is found. */
export function LogoPicker({ query = '', onPick }: { query?: string; onPick: (url: string) => void }) {
  const [q, setQ] = useState(query)
  const [url, setUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [touched, setTouched] = useState(false)

  async function run(text: string) {
    const t = text.trim()
    if (!t) return
    setLoading(true); setTouched(true)
    try { setUrl(await resolveBrandLogo({ brand: t, domain: t })) }
    finally { setLoading(false) }
  }

  // Seed + auto-search once on mount; keep the box in sync if the brand name changes (but
  // don't auto-fire on every keystroke — the user hits Search).
  const first = useRef(true)
  useEffect(() => {
    if (first.current) { first.current = false; if (query.trim()) run(query); return }
    setQ(query)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])

  return (
    <div className="pick">
      <div className="pick-bar">
        <input
          className="pick-search" type="text" value={q} spellCheck={false}
          placeholder="Find a logo — e.g. Arby's or arbys.com"
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); run(q) } }}
        />
        <button type="button" className="pick-btn" onClick={() => run(q)} disabled={loading || !q.trim()}>Search</button>
      </div>
      {loading
        ? <div className="pick-status">Finding the logo…</div>
        : url
          ? <div className="pick-grid"><button type="button" className="pick-thumb logo" title="Use this logo" onClick={() => onPick(url)}><img src={url} alt="" loading="lazy" /></button></div>
          : touched
            ? <div className="pick-status">No logo found — try the website, e.g. brand.com.</div>
            : null}
    </div>
  )
}
