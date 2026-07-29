import { useState } from 'react'
import { CHANNELS, channelById } from '@/channels/registry'
import { useShowcase } from '@/store/useShowcase'
import { useToast } from '@/store/useToast'
import { generateSlide } from '@/lib/showcaseAi'

const BADGE_COLORS = ['#16a34a', '#635bff', '#0ea5e9', '#f59e0b', '#ef4444', '#14151a']
const STATUS_DOT: Record<string, string> = { busy: '⏳', done: '✓', error: '⚠︎' }

/** The Showcase editor panel — pick channels, drive them with one prompt (Auto plans a
    coherent story; Directed uses a brief per tile), then arrange/label and export the slide.
    Each tile stays fully editable via its ✎ Edit overlay (opens the channel's normal editor). */
export function ShowcasePanel() {
  const tiles = useShowcase((s) => s.tiles)
  const headline = useShowcase((s) => s.headline)
  const brand = useShowcase((s) => s.brand)
  const brief = useShowcase((s) => s.brief)
  const mode = useShowcase((s) => s.mode)
  const background = useShowcase((s) => s.background)
  const generating = useShowcase((s) => s.generating)
  const toggleChannel = useShowcase((s) => s.toggleChannel)
  const removeTile = useShowcase((s) => s.removeTile)
  const moveTile = useShowcase((s) => s.moveTile)
  const updateTile = useShowcase((s) => s.updateTile)
  const setHeadline = useShowcase((s) => s.setHeadline)
  const setBrand = useShowcase((s) => s.setBrand)
  const setBrief = useShowcase((s) => s.setBrief)
  const setMode = useShowcase((s) => s.setMode)
  const setBackground = useShowcase((s) => s.setBackground)
  const setActive = useShowcase((s) => s.setActive)
  const has = (c: string) => tiles.some((t) => t.channel === c)
  const [err, setErr] = useState('')

  const generate = async () => {
    if (!tiles.length || generating) return
    setErr('')
    try {
      const { ok, failed } = await generateSlide()
      useToast.getState().show(failed ? `Generated ${ok} · ${failed} failed` : `✨ Generated ${ok} tile${ok === 1 ? '' : 's'}`)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Generation failed')
    }
  }

  return (
    <aside className="panel">
      <div className="panel-head"><h2>Showcase</h2></div>
      <div className="panel-scroll">
        <div className="panel-body">
          <p className="panel-hint">Build one 16:9 slide from several channels. Pick the ones to feature, generate a coherent set for a brand, then <b>Copy</b> / <b>Export</b> the whole slide.</p>

          <div className="field"><span>Channels on the slide</span>
            <div className="sc-chips">
              {CHANNELS.map((c) => (
                <button key={c.id} type="button" className={'sc-chip' + (has(c.id) ? ' on' : '')} onClick={() => toggleChannel(c.id)}>
                  <span className="ci">{c.icon}</span>{c.label}
                </button>
              ))}
            </div>
          </div>

          <label className="field"><span>Brand</span>
            <input type="text" value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="e.g. Aura Fragrance (blank = current brand)" />
          </label>

          <div className="field"><span>How to fill the tiles</span>
            <div className="seg-in">
              <button className={mode === 'auto' ? 'on' : ''} onClick={() => setMode('auto')}>Auto — one story</button>
              <button className={mode === 'directed' ? 'on' : ''} onClick={() => setMode('directed')}>Directed — per tile</button>
            </div>
          </div>
          {mode === 'auto'
            ? <label className="field"><span>The moment (optional)</span><textarea value={brief} onChange={(e) => setBrief(e.target.value)} placeholder="e.g. a Diwali sale, a post-purchase journey, a win-back — the AI writes a coherent message per channel" /></label>
            : <p className="panel-hint">Give each tile its own brief below; leave one blank to fall back to the shared note.{brief ? '' : ''}</p>}

          <button className="btn primary block" style={{ marginTop: 4 }} disabled={generating || !tiles.length} onClick={generate}>
            {generating ? <><span className="cs-ai-spin" /> Generating…</> : `✨ Generate ${tiles.length} tile${tiles.length === 1 ? '' : 's'}`}
          </button>
          {err && <p className="panel-hint" style={{ color: 'var(--danger, #ef4444)' }}>{err}</p>}

          <label className="field" style={{ marginTop: 14 }}><span>Slide headline (optional)</span>
            <input type="text" value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="e.g. One brand, every channel" />
          </label>

          <div className="field"><span>Slide background (for Copy / Export)</span>
            <div className="seg-in">
              {(['transparent', 'white', 'slate'] as const).map((b) => (
                <button key={b} className={background === b ? 'on' : ''} onClick={() => setBackground(b)}>{b === 'transparent' ? 'Transparent' : b === 'white' ? 'White' : 'Slate'}</button>
              ))}
            </div>
          </div>

          <p className="panel-hint" style={{ marginTop: 6 }}>{tiles.length} tile{tiles.length === 1 ? '' : 's'} · reorder, caption and badge each; hit <b>✎ Edit</b> on a tile to open its full editor.</p>
          {tiles.map((t, i) => (
            <div className="msg-card" key={t.id}>
              <div className="mc-top">
                <span className="lbl">{i + 1}</span>
                <span style={{ flex: 1, fontSize: 11.5, fontWeight: 700, color: 'var(--muted)' }}>
                  {channelById(t.channel)?.label ?? t.channel}
                  {t.status && t.status !== 'idle' && <span style={{ marginLeft: 6 }}>{STATUS_DOT[t.status]}</span>}
                </span>
                <button className="icobtn" title="Edit this tile" onClick={() => setActive(t.id)}>✎</button>
                <button className="icobtn" title="Move left" onClick={() => moveTile(t.id, -1)}>↑</button>
                <button className="icobtn" title="Move right" onClick={() => moveTile(t.id, 1)}>↓</button>
                <button className="icobtn" title="Remove" onClick={() => removeTile(t.id)}>✕</button>
              </div>
              {mode === 'directed' && <label className="field"><span>Brief for this tile</span><textarea value={t.brief} onChange={(e) => updateTile(t.id, { brief: e.target.value })} placeholder={`what should the ${channelById(t.channel)?.label ?? t.channel} message say?`} /></label>}
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
