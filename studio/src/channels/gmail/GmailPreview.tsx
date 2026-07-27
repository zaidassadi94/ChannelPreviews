import './gmail.css'
import { type ReactNode } from 'react'
import { useAutoTemplate } from '@/lib/useAutoTemplate'
import { useStudio, type GmailState } from '@/store/useStudio'
import { PhoneFrame } from '@/shell/PhoneFrame'
import { DesktopFrame } from '@/shell/DesktopFrame'
import { brandMark, avColor } from '@/lib/util'
import { GI, GmailLogo } from './icons'
import { buildAiEmail } from './emails'
import { GMAIL_TEMPLATES, applyGmailTemplate } from './templates'

interface Row { name: string; email: string; subject: string; snippet: string; time: string; unread: boolean; cat: string; hero?: boolean; starred?: boolean; important?: boolean; logo?: string | null }

const FILLER: Row[] = [
  { name: 'Workline', email: 'jobs@workline.com', subject: '5 new jobs for "Product Marketing"', snippet: 'Based on your profile and searches, these roles may interest you…', time: '8:42 AM', unread: true, cat: 'updates' },
  { name: 'Nimbus Cloud', email: 'no-reply@nimbuscloud.com', subject: 'Security alert', snippet: 'A new sign-in on Mac. If this was you, no action is needed.', time: '8:10 AM', unread: false, cat: 'updates' },
  { name: 'Kanbanly', email: 'team@kanbanly.com', subject: 'Your workspace weekly digest', snippet: 'Here is what happened across your teamspaces this week…', time: 'Wed', unread: true, cat: 'updates' },
  { name: 'QuickBite', email: 'offers@quickbite.app', subject: 'Craving something? 40% off today 🍔', snippet: 'Order now and get free delivery on your next 3 orders.', time: 'Tue', unread: false, cat: 'promotions' },
  { name: 'Nova Market', email: 'deals@novamarket.com', subject: 'Deals of the Day — up to 70% off electronics', snippet: 'Handpicked deals ending tonight. Shop before they are gone.', time: 'Tue', unread: true, cat: 'promotions' },
  { name: 'The Daily Read', email: 'hello@dailyread.co', subject: 'Stories for you: The art of writing tight', snippet: '6 min read · Recommended based on your reading history.', time: 'Mon', unread: false, cat: 'updates' },
  { name: 'Deck Studio', email: 'notify@deckstudio.com', subject: 'Comment on "Q3 Campaign Mocks"', snippet: 'Jordan: Can we make the CTA a bit larger on mobile?', time: 'Mon', unread: false, cat: 'social' },
]

function inboxRows(g: GmailState): Row[] {
  const hero: Row = { name: g.senderName, email: g.senderEmail, subject: g.subject, snippet: g.snippet, time: g.timestamp, unread: g.unread, starred: g.starred, important: g.important, logo: g.logo, hero: true, cat: g.category }
  if (!g.filler.on) return [hero]
  let pool = FILLER.filter((f) => (g.category === 'primary' ? f.cat !== 'promotions' : true))
  if (g.category !== 'primary') pool = FILLER.filter((f) => f.cat === g.category || f.cat === 'updates')
  pool = pool.slice(0, 6)
  const pos = Math.min(g.filler.position, pool.length)
  const rows = pool.slice()
  rows.splice(pos, 0, hero)
  return rows
}

function Avatar({ name, logo, cls }: { name: string; logo?: string | null; cls: string }) {
  return <div className={cls} style={{ overflow: 'hidden' }}><img src={logo || brandMark(name, 96)} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} /></div>
}

function resolveBody(g: GmailState): string {
  // "Compose" (plain) builds the same rich layout as a generated email, but live from
  // the editable fields — so the AI email's copy and image can be edited in place.
  if (g.bodyMode === 'plain')
    return buildAiEmail({ brand: g.senderName, logo: g.logo || undefined, accent: g.plain.accent, image: g.plain.image, heading: g.plain.heading, body: g.plain.body, btn: g.plain.btn })
  return g.html || '<div style="padding:40px;text-align:center;color:#888;font-family:Arial">No email body loaded.</div>'
}
function EmailBody() {
  const g = useStudio((s) => s.gmail)
  return <div className="email-body" dangerouslySetInnerHTML={{ __html: resolveBody(g) }} />
}

function Annot() {
  const g = useStudio((s) => s.gmail)
  if (!g.annot.on) return null
  const imgs = g.annot.img.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 3)
  return (
    <div className="annot">
      <div className="annot-head">
        <img className="alogo" src={g.logo || brandMark(g.senderName, 96)} alt={g.senderName} />
        <div className="abrand">{g.senderName}</div>
        <div className="adeal">{g.annot.deal}</div>
      </div>
      <div className="annot-body">
        {imgs.length ? imgs.map((u, i) => <div className="annot-card" key={i}><img src={u} alt="" /><div className="ac-t">{g.annot.deal}</div></div>)
          : <div className="annot-card" style={{ padding: '14px 12px' }}><div className="ac-t" style={{ fontSize: 13 }}>{g.annot.deal || 'Special offer'}</div></div>}
      </div>
      {(g.annot.code || g.annot.expiry) && <div className="annot-code">{g.annot.code && <>Code <b>{g.annot.code}</b></>} {g.annot.expiry && `· ${g.annot.expiry}`}</div>}
    </div>
  )
}

/* ---------- Mobile ---------- */
function MobileInbox() {
  const g = useStudio((s) => s.gmail)
  const rows = inboxRows(g)
  return (
    <div className="gml">
      <div className="gm-m-search"><span className="hamb">{GI.menu}</span><span className="q">Search in mail</span><div className="av" style={{ background: avColor('You') }}>Y</div></div>
      <div className="gm-tabs mob">
        <div className={'gm-tab' + (g.category === 'primary' ? ' on' : '')}><span className="tdot" style={{ background: '#ea4335' }} />Primary</div>
        <div className={'gm-tab' + (g.category === 'promotions' ? ' on' : '')}><span className="tdot" style={{ background: '#34a853' }} />Promotions</div>
        <div className={'gm-tab' + (g.category === 'social' ? ' on' : '')}><span className="tdot" style={{ background: '#1a73e8' }} />Social</div>
      </div>
      <div className="gm-list">
        {rows.map((r, i) => (
          <div key={i}>
            <div className={'gm-row' + (r.unread ? ' unread' : '')}>
              <Avatar name={r.name} logo={r.hero ? r.logo : null} cls="avatar" />
              <div className="rbody">
                <div className="line1"><span className="sender">{r.name}</span>{r.hero && r.important && <span className="imp">{GI.imp}</span>}<span className="time">{r.time}</span></div>
                <div className="subject">{r.subject}</div>
                <div className="snippet">{r.snippet}</div>
              </div>
              <span className={'star' + (r.hero && r.starred ? ' on' : '')}>{r.hero && r.starred ? GI.starOn : GI.star}</span>
            </div>
            {r.hero && <Annot />}
          </div>
        ))}
      </div>
      <div className="fab">{GI.compose}Compose</div>
    </div>
  )
}

function MobileOpen() {
  const g = useStudio((s) => s.gmail)
  return (
    <div className="gml">
      <div className="gm-m-openbar"><span className="oact">{GI.back}</span><span className="sp" /><span className="oact">{GI.archive}</span><span className="oact">{GI.trash}</span><span className="oact">{GI.unread}</span><span className="oact">{GI.more}</span></div>
      <div className="gm-open-scroll">
        <div className="gm-open-subject">{g.subject}</div>
        <div className="gm-open-label">{g.labelChip || 'Inbox'}</div>
        <div className="gm-open-from">
          <Avatar name={g.senderName} logo={g.logo} cls="avatar" />
          <div className="meta">
            <div className="nm">{g.senderName} {g.starred && <span style={{ color: 'var(--gm-yellow)' }}>{GI.starOn}</span>}<span className="t">{g.timestamp}</span></div>
            <div className="to">{g.toLine} {GI.chevron}</div>
          </div>
        </div>
        <EmailBody />
      </div>
      <div className="gm-open-actions"><button>{GI.reply}Reply</button><button>{GI.replyAll}Reply all</button><button>{GI.forward}Forward</button></div>
    </div>
  )
}

/* ---------- Desktop ---------- */
function DesktopTop() {
  return (
    <div className="gm-d-top">
      <div className="gm-d-logo"><span className="ni" style={{ width: 24, height: 24, color: 'var(--g-muted)' }}>{GI.menu}</span><GmailLogo h={22} /><span>Gmail</span></div>
      <div className="gm-d-search">{GI.search}<span>Search mail</span></div>
      <div className="spacer" />
      <div className="tavatar" style={{ background: avColor('You') }}>Y</div>
    </div>
  )
}
function DesktopNav() {
  const item = (ic: ReactNode, label: string, on: boolean, cnt?: string) => (
    <div className={'nav-item' + (on ? ' on' : '')}><span className="ni">{ic}</span>{label}{cnt && <span className="cnt">{cnt}</span>}</div>
  )
  return (
    <div className="gm-d-nav">
      <div className="compose-btn">{GI.compose}Compose</div>
      {item(GI.inbox, 'Inbox', true, '1,248')}
      {item(GI.dstar, 'Starred', false)}
      {item(GI.snooze, 'Snoozed', false)}
      {item(GI.sent, 'Sent', false)}
      {item(GI.draft, 'Drafts', false, '23')}
    </div>
  )
}
function DesktopInbox() {
  const g = useStudio((s) => s.gmail)
  const rows = inboxRows(g)
  return (
    <div className="gml">
      <div className="gm-d">
        <DesktopTop />
        <div className="gm-d-main">
          <DesktopNav />
          <div className="gm-d-content">
            <div className="gm-d-toolbar"><span className="tb">{GI.check}</span><span className="tb">{GI.refresh}</span><span className="tb">{GI.more}</span><span className="sp" /><span className="pg">1–50 of 1,248</span></div>
            <div className="gm-d-tabs">
              <div className={'gm-d-tab' + (g.category === 'primary' ? ' on' : '')}><span className="ni" style={{ width: 20 }}>{GI.inbox}</span>Primary</div>
              <div className={'gm-d-tab' + (g.category === 'promotions' ? ' on' : '')}>🏷️ Promotions</div>
              <div className={'gm-d-tab' + (g.category === 'social' ? ' on' : '')}>👥 Social</div>
            </div>
            <div className="gm-d-rows">
              {rows.map((r, i) => (
                <div className={'gm-d-row' + (r.unread ? ' unread' : '')} key={i}>
                  <span className="ck">{GI.check}</span>
                  <span className={'st' + (r.hero && r.starred ? ' on' : '')}>{r.hero && r.starred ? GI.starOn : GI.dstar}</span>
                  <span className="im" style={r.hero && r.important ? { color: 'var(--gm-yellow)' } : undefined}>{r.hero && r.important ? GI.imp : GI.impOff}</span>
                  <span className="dsender">{r.name}</span>
                  <span className="dmid"><span className="dsub">{r.subject}</span> <span className="dsnip">— {r.snippet}</span></span>
                  <span className="dtime">{r.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
function DesktopOpen() {
  const g = useStudio((s) => s.gmail)
  return (
    <div className="gml">
      <div className="gm-d">
        <DesktopTop />
        <div className="gm-d-main">
          <DesktopNav />
          <div className="gm-d-content">
            <div className="gm-d-toolbar"><span className="tb">{GI.back}</span><span className="tb">{GI.archive}</span><span className="tb">{GI.trash}</span><span className="tb">{GI.unread}</span><span className="tb">{GI.snooze}</span><span className="sp" /><span className="pg">1 of 1,248</span></div>
            <div className="gm-d-open">
              <div className="gm-d-open-sub">{g.subject} <span className="lb">{g.labelChip || 'Inbox'}</span></div>
              <div className="gm-d-open-from">
                <Avatar name={g.senderName} logo={g.logo} cls="avatar" />
                <div>
                  <div className="nm">{g.senderName} <span className="em">&lt;{g.senderEmail}&gt;</span></div>
                  <div className="to">{g.toLine} {GI.chevron}</div>
                </div>
                <div className="rgt"><span>{g.timestamp}</span><span style={{ width: 20 }}>{g.starred ? GI.starOn : GI.dstar}</span><span style={{ width: 20 }}>{GI.reply}</span><span style={{ width: 20 }}>{GI.more}</span></div>
              </div>
              <div className="gm-d-open-body"><EmailBody /></div>
              <div className="gm-d-reply"><button>{GI.reply}Reply</button><button>{GI.forward}Forward</button></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function GmailPreview() {
  const ctxId = useStudio((s) => s.ctxId())
  useAutoTemplate(ctxId, () => applyGmailTemplate(GMAIL_TEMPLATES[0], false))

  const skin = useStudio((s) => s.gmail.skin)
  const view = useStudio((s) => s.gmail.view)

  if (skin === 'desktop') {
    return <DesktopFrame url="mail.google.com/mail/u/0/#inbox">{view === 'open' ? <DesktopOpen /> : <DesktopInbox />}</DesktopFrame>
  }
  return <PhoneFrame>{view === 'open' ? <MobileOpen /> : <MobileInbox />}</PhoneFrame>
}
