import './showcase.css'
import { useShowcase } from '@/store/useShowcase'
import { ShowcaseTile } from './ShowcaseTile'

/** The 16:9 transparent board — a headline plus a row of channel tiles. `id="capture"` so the
    existing TopBar Copy / Export rasterise the whole slide (html2canvas uses a null background,
    so it exports transparent). The board is fit to the stage by the shared <StageFit>. */
export function ShowcaseStage() {
  const tiles = useShowcase((s) => s.tiles)
  const headline = useShowcase((s) => s.headline)
  return (
    <div className="sc-board" id="capture">
      {headline && <div className="sc-headline">{headline}</div>}
      <div className="sc-row">
        {tiles.length
          ? tiles.map((t) => <ShowcaseTile key={t.id} tile={t} />)
          : <div className="sc-empty">Pick channels in the panel to build your slide.</div>}
      </div>
    </div>
  )
}
