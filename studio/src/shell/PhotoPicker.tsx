import { useEffect, useRef, useState } from 'react'
import { Icon } from '@/lib/icons'
import { photoCandidates } from '@/lib/media'

/** A reusable "pick a photo" control: a search box that queries Pexels, a grid of
 *  results, and a refresh for a fresh batch. Shown inline (expanded) so it's obvious
 *  images can be swapped. `query` pre-fills the search (e.g. a product title); with
 *  `autoLoad` it fetches that query on mount (used right after an AI generation).
 *  Clicking a result calls `onPick(url)`. */
export function PhotoPicker({ query = '', onPick, orientation = 'landscape', autoLoad = false }: {
  query?: string
  onPick: (url: string) => void
  orientation?: string
  autoLoad?: boolean
}) {
  const [q, setQ] = useState(query)
  const [urls, setUrls] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [touched, setTouched] = useState(false)
  const seedBase = useRef(0)

  async function run(text: string, base: number) {
    const phrase = text.trim()
    if (!phrase) return
    setLoading(true); setTouched(true)
    try { setUrls(await photoCandidates(undefined, phrase, orientation, 8, undefined, base)) }
    finally { setLoading(false) }
  }

  // On mount, show results immediately only when asked (post-generation). When the subject
  // then CHANGES — a new generation, or an edited product title — re-seed the box and
  // re-fetch (debounced, so typing doesn't thrash) instead of leaving the old suggestions.
  const first = useRef(true)
  useEffect(() => {
    if (first.current) {
      first.current = false
      if (autoLoad && query.trim()) run(query, 0)
      return
    }
    const id = setTimeout(() => {
      setQ(query); seedBase.current = 0
      if (autoLoad && query.trim()) run(query, 0)
      else setUrls([])
    }, 350)
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])

  const search = () => { seedBase.current = 0; run(q, 0) }
  const refresh = () => { seedBase.current += 8; run(q, seedBase.current) }

  return (
    <div className="pick">
      <div className="pick-bar">
        <input
          className="pick-search" type="text" value={q} spellCheck={false}
          placeholder="Search photos — e.g. white leather sneakers"
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); search() } }}
        />
        <button type="button" className="pick-btn" onClick={search} disabled={loading || !q.trim()}>Search</button>
        {urls.length > 0 && (
          <button type="button" className="pick-btn icon" title="More options" onClick={refresh} disabled={loading}>{Icon.refresh}</button>
        )}
      </div>
      {loading
        ? <div className="pick-status">Finding photos…</div>
        : urls.length
          ? <div className="pick-grid">{urls.map((u) => (
              <button key={u} type="button" className="pick-thumb" title="Use this photo" onClick={() => onPick(u)}><img src={u} alt="" loading="lazy" /></button>
            ))}</div>
          : touched
            ? <div className="pick-status">No photos found — try different words.</div>
            : null}
    </div>
  )
}
