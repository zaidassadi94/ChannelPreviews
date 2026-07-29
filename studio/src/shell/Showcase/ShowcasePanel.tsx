import { CHANNELS, channelById } from '@/channels/registry'
import { useShowcase } from '@/store/useShowcase'

const BADGE_COLORS = ['#16a34a', '#635bff', '#0ea5e9', '#f59e0b', '#ef4444', '#14151a']

/** The Showcase editor panel — pick the channels to feature, arrange them, and decorate each
    tile with a caption + segment badge. (AI generate-all and slide export land in later commits;
    for now each tile shows its channel's current content and is editable via the ✎ Edit overlay.) */
export function ShowcasePanel() {
  const tiles = useShowcase((s) => s.tiles)
  const headline = useShowcase((s) => s.headline)
  const toggleChannel = useShowcase((s) => s.toggleChannel)
  const removeTile = useShowcase((s) => s.removeTile)
  const moveTile = useShowcase((s) => s.moveTile)
  const updateTile = useShowcase((s) => s.updateTile)
  const setHeadline = useShowcase((s) => s.setHeadline)
  const setActive = useShowcase((s) => s.setActive)
  const has = (c: string) => tiles.some((t) => t.channel === c)

  return (
    <aside className="panel">
      <div className="panel-head"><h2>Showcase</h2></div>
      <div className="panel-scroll">
        <div className="panel-body">
          <p className="panel-hint">Build a single 16:9 slide from several channels. Pick the ones to feature, arrange and label them, then <b>Copy</b> / <b>Export</b> the whole slide for your deck.</p>

          <div className="field"><span>Channels on the slide</span>
            <div className="sc-chips">
              {CHANNELS.map((c) => (
                <button key={c.id} type="button" className={'sc-chip' + (has(c.id) ? ' on' : '')} onClick={() => toggleChannel(c.id)}>
                  <span className="ci">{c.icon}</span>{c.label}
                </button>
              ))}
            </div>
          </div>

          <label className="field"><span>Slide headline (optional)</span>
            <input type="text" value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="e.g. One brand, every channel" />
          </label>

          <p className="panel-hint" style={{ marginTop: 6 }}>{tiles.length} tile{tiles.length === 1 ? '' : 's'} · reorder, caption and badge each below; hit <b>✎ Edit</b> on a tile to open its full editor.</p>
          {tiles.map((t, i) => (
            <div className="msg-card" key={t.id}>
              <div className="mc-top">
                <span className="lbl">{i + 1}</span>
                <span style={{ flex: 1, fontSize: 11.5, fontWeight: 700, color: 'var(--muted)' }}>{channelById(t.channel)?.label ?? t.channel}</span>
                <button className="icobtn" title="Edit this tile" onClick={() => setActive(t.id)}>✎</button>
                <button className="icobtn" title="Move left" onClick={() => moveTile(t.id, -1)}>↑</button>
                <button className="icobtn" title="Move right" onClick={() => moveTile(t.id, 1)}>↓</button>
                <button className="icobtn" title="Remove" onClick={() => removeTile(t.id)}>✕</button>
              </div>
              <label className="field"><span>Caption</span><input type="text" value={t.caption} onChange={(e) => updateTile(t.id, { caption: e.target.value })} placeholder="e.g. RFM segments to identify Champions" /></label>
              <div className="mc-row">
                <label className="field"><span>Badge</span><input type="text" value={t.badge} onChange={(e) => updateTile(t.id, { badge: e.target.value })} placeholder="e.g. RFM: Dormant" /></label>
                <div className="field"><span>Badge color</span>
                  <div className="sc-swatches">
                    {BADGE_COLORS.map((c) => <button key={c} type="button" className={'sc-sw' + (t.badgeColor === c ? ' on' : '')} style={{ background: c }} onClick={() => updateTile(t.id, { badgeColor: c })} />)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  )
}
