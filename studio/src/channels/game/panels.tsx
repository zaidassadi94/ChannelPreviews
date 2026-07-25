import { useStudio } from '@/store/useStudio'
import { Icon } from '@/lib/icons'
import type { SectionDef } from '@/channels/registry'
import { GAME_TEMPLATES, applyGameTemplate } from './templates'

const GM_TYPES: [string, string][] = [['scratch', 'Scratch'], ['wheel', 'Wheel'], ['box', 'Box'], ['slots', 'Slots']]

function TemplatesPanel() {
  const setGame = useStudio((s) => s.setGame)
  return (
    <>
      <p className="panel-hint">A premium <b>reward moment</b> — pick a game, then hit <b>Simulate</b> and tap it to reveal the prize.</p>
      <div className="tpl-grid">
        {GAME_TEMPLATES.map((t, i) => (
          <button key={i} className="tpl" onClick={() => applyGameTemplate(t)}>
            <span className="ti">{t.icon}</span>
            <span className="tc"><span className="tt">{t.name}<span className="flow">FLOW</span></span><span className="td">{t.desc}</span></span>
          </button>
        ))}
      </div>
      <button className="btn ghost block" style={{ marginTop: 12 }} onClick={() => setGame({ eyebrow: 'Exclusive reward', headline: "You've unlocked a reward", sub: "Play to reveal what's inside.", prize: '20% OFF', prizeCap: 'your next order', cta: 'Claim reward', segments: '5% off\nFree gift *\n2× points\n$10 off\nTry again\n15% off', close: true })}>{Icon.refresh}Clear &amp; start blank</button>
    </>
  )
}

function RewardPanel() {
  const g = useStudio((s) => s.notify.game)
  const setGame = useStudio((s) => s.setGame)
  const wheel = g.type === 'wheel'
  return (
    <>
      <div className="field"><span>Game</span>
        <div className="seg-in">{GM_TYPES.map(([v, l]) => <button key={v} className={g.type === v ? 'on' : ''} onClick={() => setGame({ type: v })}>{l}</button>)}</div>
      </div>
      <label className="field"><span>Eyebrow (small label)</span><input type="text" value={g.eyebrow} onChange={(e) => setGame({ eyebrow: e.target.value })} /></label>
      <label className="field"><span>Headline</span><input type="text" value={g.headline} onChange={(e) => setGame({ headline: e.target.value })} /></label>
      <label className="field"><span>Sub-text</span><textarea value={g.sub} onChange={(e) => setGame({ sub: e.target.value })} /></label>
      {!wheel && <label className="field"><span>Prize (the reward)</span><input type="text" value={g.prize} onChange={(e) => setGame({ prize: e.target.value })} placeholder="e.g. 20% OFF" /></label>}
      {!wheel && <label className="field"><span>Prize caption</span><input type="text" value={g.prizeCap} onChange={(e) => setGame({ prizeCap: e.target.value })} placeholder="e.g. on your next order" /></label>}
      <label className="field"><span>CTA button</span><input type="text" value={g.cta} onChange={(e) => setGame({ cta: e.target.value })} placeholder="e.g. Claim reward" /></label>
      <div className="toggle-row"><span>Close (✕) button</span>
        <label className="switch"><input type="checkbox" checked={g.close} onChange={(e) => setGame({ close: e.target.checked })} /><span className="slider" /></label>
      </div>
    </>
  )
}

function WheelPanel() {
  const g = useStudio((s) => s.notify.game)
  const setGame = useStudio((s) => s.setGame)
  return (
    <>
      <p className="panel-hint">One prize per line (5–8 works best). It spins to the winning segment — add <code>*</code> to the end of a line to make it the winner. Applies to the <b>Wheel</b> game.</p>
      <label className="field"><span>Wheel segments</span><textarea value={g.segments} onChange={(e) => setGame({ segments: e.target.value })} style={{ minHeight: 130, fontFamily: 'ui-monospace, monospace' }} /></label>
    </>
  )
}

export const gameSections: SectionDef[] = [
  { id: 'templates', label: 'Templates', icon: Icon.templates, Panel: TemplatesPanel },
  { id: 'reward', label: 'Reward', icon: Icon.convo, Panel: RewardPanel },
  { id: 'wheel', label: 'Wheel', icon: Icon.context, Panel: WheelPanel },
]
