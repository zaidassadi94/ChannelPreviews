import { useStudio } from '@/store/useStudio'
import { Icon } from '@/lib/icons'
import type { SectionDef } from '@/channels/registry'
import { ImageField } from '@/shell/ImageField'
import { GMAIL_TEMPLATES, applyGmailTemplate } from './templates'

function ViewPanel() {
  const g = useStudio((s) => s.gmail)
  const setGmail = useStudio((s) => s.setGmail)
  return (
    <>
      <p className="panel-hint">Switch <b>Mobile / Desktop</b> from the top bar. Here, choose the inbox list or an opened email.</p>
      <div className="field"><span>View</span>
        <div className="seg-in"><button className={g.view === 'inbox' ? 'on' : ''} onClick={() => setGmail({ view: 'inbox' })}>Inbox list</button><button className={g.view === 'open' ? 'on' : ''} onClick={() => setGmail({ view: 'open' })}>Open email</button></div>
      </div>
    </>
  )
}

function TemplatesPanel() {
  const setGmail = useStudio((s) => s.setGmail)
  return (
    <>
      <p className="panel-hint">Ready-made email mockups — promotional &amp; transactional. Pick one, then tweak any field.</p>
      <div className="tpl-grid">
        {GMAIL_TEMPLATES.map((t, i) => (
          <button key={i} className="tpl" onClick={() => applyGmailTemplate(t)}>
            <span className="ti">{t.icon}</span>
            <span className="tc"><span className="tt">{t.name} <span className={'kind ' + t.kind}>{t.kind === 'Promotional' ? 'PROMO' : 'TXN'}</span></span><span className="td">{t.desc}</span></span>
          </button>
        ))}
      </div>
      <button className="btn ghost block" style={{ marginTop: 12 }} onClick={() => setGmail({ bodyMode: 'plain', subject: 'Your subject here', snippet: 'Preview text…' })}>{Icon.refresh}Clear &amp; start blank</button>
    </>
  )
}

function SenderPanel() {
  const g = useStudio((s) => s.gmail)
  const setGmail = useStudio((s) => s.setGmail)
  return (
    <>
      <label className="field"><span>Sender name</span><input type="text" value={g.senderName} onChange={(e) => setGmail({ senderName: e.target.value })} /></label>
      <label className="field"><span>Sender email</span><input type="email" value={g.senderEmail} onChange={(e) => setGmail({ senderEmail: e.target.value })} /></label>
      <div className="field"><span>Sender logo</span><ImageField logo logoQuery={g.senderName} value={g.logo || ''} onChange={(v) => setGmail({ logo: v || null })} placeholder="or paste a logo URL (blank = monogram)" /></div>
    </>
  )
}

/* Everything you write for the email, in one place: the subject & preview, the body,
   then how it appears in the inbox row. (Previously split as "Message" + "Body".) */
function ContentPanel() {
  const g = useStudio((s) => s.gmail)
  const setGmail = useStudio((s) => s.setGmail)
  const setGmailPlain = useStudio((s) => s.setGmailPlain)
  return (
    <>
      <label className="field"><span>Subject</span><input type="text" value={g.subject} onChange={(e) => setGmail({ subject: e.target.value })} /></label>
      <label className="field"><span>Preview / snippet text</span><input type="text" value={g.snippet} onChange={(e) => setGmail({ snippet: e.target.value })} /></label>
      <div className="field"><span>Email body</span>
        <div className="seg-in">
          <button className={g.bodyMode === 'template' ? 'on' : ''} onClick={() => setGmail({ bodyMode: 'template' })}>Template</button>
          <button className={g.bodyMode === 'plain' ? 'on' : ''} onClick={() => setGmail({ bodyMode: 'plain' })}>Compose</button>
          <button className={g.bodyMode === 'html' ? 'on' : ''} onClick={() => setGmail({ bodyMode: 'html' })}>HTML</button>
        </div>
      </div>
      {g.bodyMode === 'template' && (
        <p className="panel-hint">The email body is the applied preset. Switch to <b>Compose</b> to edit the heading, copy, image and button, or <b>HTML</b> to paste your own markup.</p>
      )}
      {g.bodyMode === 'plain' && (
        <>
          <div className="field"><span>Header logo / wordmark</span>
            <ImageField logo logoQuery={g.senderName} value={g.wordmark || ''} onChange={(v) => setGmail({ wordmark: v })} placeholder="or paste a logo URL (blank = brand name as text)" />
            <div className="panel-hint" style={{ marginTop: 6 }}>Shown at the top of the email. Leave blank to use the brand name as a text wordmark. (The round sender avatar keeps the brand icon.)</div>
          </div>
          <div className="field"><span>Image</span><ImageField pick query={g.plain.imageQuery} value={g.plain.image || ''} onChange={(v) => setGmailPlain({ image: v })} placeholder="or paste an image URL (blank = no image)" /></div>
          <label className="field"><span>Heading</span><input type="text" value={g.plain.heading} onChange={(e) => setGmailPlain({ heading: e.target.value })} /></label>
          <label className="field"><span>Body text</span><textarea value={g.plain.body} onChange={(e) => setGmailPlain({ body: e.target.value })} /></label>
          <label className="field"><span>Button label</span><input type="text" value={g.plain.btn} onChange={(e) => setGmailPlain({ btn: e.target.value })} /></label>
          <label className="field"><span>Accent color</span><input type="text" value={g.plain.accent} onChange={(e) => setGmailPlain({ accent: e.target.value })} /></label>
          <label className="field"><span>Unsubscribe / footer</span><textarea value={g.footer} onChange={(e) => setGmail({ footer: e.target.value })} /></label>
        </>
      )}
      {g.bodyMode === 'html' && (
        <>
          <label className="field"><span>Email HTML</span>
            <textarea value={g.html} onChange={(e) => setGmail({ html: e.target.value })}
              spellCheck={false} placeholder="Paste your full email HTML here — it renders in the preview exactly as written."
              style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12, minHeight: 200, whiteSpace: 'pre' }} />
          </label>
          <p className="panel-hint">Paste a complete email's HTML and it renders as-is. Inline <code>style="…"</code> works most reliably (many inboxes strip <code>&lt;style&gt;</code> blocks). Switching to <b>Template</b> and applying a preset will overwrite it.</p>
        </>
      )}
      <p className="panel-hint" style={{ marginTop: 8 }}>How it appears in the inbox row:</p>
      <label className="field"><span>Timestamp</span><input type="text" value={g.timestamp} onChange={(e) => setGmail({ timestamp: e.target.value })} /></label>
      <label className="field"><span>"to" line</span><input type="text" value={g.toLine} onChange={(e) => setGmail({ toLine: e.target.value })} /></label>
      <div className="toggle-row"><span>Unread (bold)</span><label className="switch"><input type="checkbox" checked={g.unread} onChange={(e) => setGmail({ unread: e.target.checked })} /><span className="slider" /></label></div>
      <div className="toggle-row"><span>Starred</span><label className="switch"><input type="checkbox" checked={g.starred} onChange={(e) => setGmail({ starred: e.target.checked })} /><span className="slider" /></label></div>
      <div className="toggle-row"><span>Important marker</span><label className="switch"><input type="checkbox" checked={g.important} onChange={(e) => setGmail({ important: e.target.checked })} /><span className="slider" /></label></div>
      <label className="field" style={{ marginTop: 12 }}><span>Inbox category tab</span>
        <select value={g.category} onChange={(e) => setGmail({ category: e.target.value })} style={{ width: '100%', padding: '9px 11px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--panel-2)', fontFamily: 'inherit', fontSize: 13 }}>
          <option value="primary">Primary</option><option value="promotions">Promotions</option><option value="social">Social</option><option value="updates">Updates</option>
        </select>
      </label>
      <label className="field"><span>Open-email label chip</span><input type="text" value={g.labelChip} onChange={(e) => setGmail({ labelChip: e.target.value })} /></label>
    </>
  )
}

function ExtrasPanel() {
  const g = useStudio((s) => s.gmail)
  const setGmailAnnot = useStudio((s) => s.setGmailAnnot)
  const setGmailFiller = useStudio((s) => s.setGmailFiller)
  return (
    <>
      <p className="panel-hint">Gmail shows a rich "deal" card under Promotions emails, and realistic filler rows around your email.</p>
      <div className="toggle-row"><span>Promotions annotation</span><label className="switch"><input type="checkbox" checked={g.annot.on} onChange={(e) => setGmailAnnot({ on: e.target.checked })} /><span className="slider" /></label></div>
      {g.annot.on && (
        <>
          <label className="field"><span>Deal / offer text</span><input type="text" value={g.annot.deal} onChange={(e) => setGmailAnnot({ deal: e.target.value })} /></label>
          <label className="field"><span>Promo code (optional)</span><input type="text" value={g.annot.code} onChange={(e) => setGmailAnnot({ code: e.target.value })} /></label>
          <label className="field"><span>Expiry note (optional)</span><input type="text" value={g.annot.expiry} onChange={(e) => setGmailAnnot({ expiry: e.target.value })} /></label>
          <label className="field"><span>Hero image URL(s), comma-separated</span><input type="text" value={g.annot.img} onChange={(e) => setGmailAnnot({ img: e.target.value })} /></label>
        </>
      )}
      <div className="toggle-row" style={{ marginTop: 8 }}><span>Show filler emails</span><label className="switch"><input type="checkbox" checked={g.filler.on} onChange={(e) => setGmailFiller({ on: e.target.checked })} /><span className="slider" /></label></div>
      <label className="field"><span>Your email's position</span>
        <select value={g.filler.position} onChange={(e) => setGmailFiller({ position: +e.target.value })} style={{ width: '100%', padding: '9px 11px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--panel-2)', fontFamily: 'inherit', fontSize: 13 }}>
          <option value={0}>Top of inbox</option><option value={2}>After 2 emails</option><option value={4}>Middle</option>
        </select>
      </label>
    </>
  )
}

export const gmailSections: SectionDef[] = [
  { id: 'view', label: 'View', icon: Icon.phone, Panel: ViewPanel },
  { id: 'templates', label: 'Presets', icon: Icon.templates, Panel: TemplatesPanel },
  { id: 'sender', label: 'Brand', icon: Icon.sender, Panel: SenderPanel },
  { id: 'content', label: 'Content', icon: Icon.convo, Panel: ContentPanel },
  { id: 'extras', label: 'Extras', icon: Icon.templates, Panel: ExtrasPanel },
]
