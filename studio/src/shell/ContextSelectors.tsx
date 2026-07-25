import { useStudio, INDUSTRIES } from '@/store/useStudio'
import { industryById } from '@/content/model'

/** Shared Industry / Sub-industry selectors at the top of the sidebar. */
export function ContextSelectors() {
  const industry = useStudio((s) => s.industry)
  const sub = useStudio((s) => s.sub)
  const setIndustry = useStudio((s) => s.setIndustry)
  const setSub = useStudio((s) => s.setSub)
  const ind = industryById(industry)
  const subs = ind ? ind.subs : []

  return (
    <div className="ctx">
      <div className="sel-wrap">
        <label>Industry</label>
        <select className="sel" value={industry} onChange={(e) => setIndustry(e.target.value)}>
          {INDUSTRIES.map((i) => (
            <option key={i.id} value={i.id}>{i.name}</option>
          ))}
        </select>
      </div>
      {subs.length > 0 && (
        <div className="sel-wrap">
          <label>Sub-industry</label>
          <select className="sel" value={sub ?? ''} onChange={(e) => setSub(e.target.value)}>
            {subs.map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  )
}
