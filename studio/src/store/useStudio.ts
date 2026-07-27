import { create } from 'zustand'
import { INDUSTRIES, industryById } from '@/content/model'

let _uid = 1
export const nid = () => 'm' + _uid++

export type WAType = 'text' | 'image' | 'template'
export interface WAMsg {
  id: string
  type: WAType
  from: 'business' | 'customer'
  text?: string
  img?: string
  caption?: string
  body?: string
  footer?: string
  buttons?: string
}

export const WA_DEFAULTS: Record<WAType, Omit<WAMsg, 'id'>> = {
  text: { type: 'text', from: 'business', text: 'Hello! 👋', buttons: '' },
  image: { type: 'image', from: 'business', img: '', caption: '', buttons: '' },
  template: { type: 'template', from: 'business', img: '', body: 'Your message *here*.', footer: '', buttons: 'Track | url | https://ex.com\nSupport | call | +100' },
}

export function makeMsg(type: WAType, over: Partial<WAMsg> = {}): WAMsg {
  return { ...JSON.parse(JSON.stringify(WA_DEFAULTS[type])), id: nid(), ...over }
}

export interface Brand { name: string; sub: string; logo: string | null; verified: boolean; phone: string; desc: string; agentCard: boolean }

/* ---- generic messaging model (RCS + SMS; a superset that also covers WA's richer types) ---- */
export type MType = 'text' | 'image' | 'card' | 'carousel' | 'template' | 'list' | 'document'
export interface MMsg {
  id: string
  type: MType
  from: 'business' | 'customer'
  text?: string
  img?: string
  caption?: string
  title?: string
  desc?: string
  body?: string
  footer?: string
  buttons?: string
  chips?: string
  cards?: string
  btnText?: string
  header?: string
  items?: string
  file?: string
  meta?: string
}
export const M_DEFAULTS: Record<MType, Omit<MMsg, 'id'>> = {
  text: { type: 'text', from: 'business', text: 'Hello! 👋', buttons: '', chips: '' },
  image: { type: 'image', from: 'business', img: '', caption: '', buttons: '' },
  card: { type: 'card', from: 'business', img: '', title: 'Card title', desc: 'Description', buttons: 'Learn more | url | https://example.com', chips: '' },
  carousel: { type: 'carousel', from: 'business', cards: ' | Product one | $19 | Shop | https://example.com\n | Product two | $24 | Shop | https://example.com', chips: '' },
  template: { type: 'template', from: 'business', img: '', body: 'Your message *here*.', footer: '', buttons: 'Track | url | https://ex.com\nSupport | call | +100' },
  list: { type: 'list', from: 'business', body: 'Pick an option:', btnText: 'View options', header: 'Options', items: 'Option A | detail\nOption B | detail', footer: '' },
  document: { type: 'document', from: 'business', file: 'Document.pdf', meta: '2 pages · 480 KB · PDF', caption: '' },
}
export function makeM(type: MType, over: Partial<MMsg> = {}): MMsg {
  return { ...JSON.parse(JSON.stringify(M_DEFAULTS[type])), id: nid(), ...over }
}
interface MsgSlice { messages: MMsg[]; played: MMsg[]; typing: boolean }

/* ---- notify model (Push / In-App / Gamification share app identity) ---- */
export interface NotifyState {
  appName: string
  appLogo: string | null
  surface: string   // ios: lock|banner · android: heads|shade · optin
  wallpaper: string
  expanded: boolean
  optinStyle: string // native | twostep
  optinTitle: string
  optinBody: string
  optinAllow: string
  optinDeny: string
  push: { title: string; body: string; image: string; actions: string; time: string }
  inapp: { type: string; image: string; headline: string; body: string; ctas: string; close: boolean; bannerPos: string }
  appBg: { mode: string; image: string; blur: boolean }
  game: { type: string; eyebrow: string; headline: string; sub: string; prize: string; prizeCap: string; cta: string; segments: string; close: boolean }
}

/* ---- gmail model ---- */
export interface GmailState {
  skin: string   // mobile | desktop
  view: string   // inbox | open
  senderName: string
  senderEmail: string
  logo: string | null
  subject: string
  snippet: string
  timestamp: string
  toLine: string
  unread: boolean
  starred: boolean
  important: boolean
  category: string
  labelChip: string
  bodyMode: string  // template | plain
  html: string
  plain: { heading: string; body: string; btn: string; accent: string }
  annot: { on: boolean; deal: string; code: string; expiry: string; img: string }
  filler: { on: boolean; position: number }
}

/* ---- osm (onsite messaging) model ---- */
export interface OsmState {
  device: string   // desktop | mobile
  format: string   // popup | bannerTop | bannerBottom | nudge | full | survey
  site: string
  url: string
  logo: string | null
  headline: string
  body: string
  image: string
  cta: string
  cta2: string
  code: string
  input: boolean
  countdown: string
  rating: number
  scaleLo: string
  scaleHi: string
  bg: string
  bgImage: string
  blur: boolean
}

/* ---- web push model (browser notification) ---- */
export interface WebpushState {
  os: string        // mac | windows
  site: string
  url: string
  logo: string | null
  title: string
  body: string
  image: string
  actions: string   // up to 2, one per line
  mode: string      // notification | optin
  bg: string        // branded | upload | neutral (the page behind the notification)
  bgImage: string   // screenshot URL when bg = upload
  blur: boolean     // dim & blur the page so the notification pops
  optinStyle: string // native | twostep
  optinTitle: string
  optinBody: string
  optinAllow: string
  optinDeny: string
}

/* ---- cards / app inbox model ---- */
export interface CardItem { image: string; title: string; body: string; tag: string; time: string; unread: boolean }
export interface CardsState {
  appName: string
  logo: string | null
  screenTitle: string
  items: CardItem[]
}

/* ---- Instagram ads model ---- */
export interface IgState {
  format: string   // feed | story
  brand: string
  handle: string
  verified: boolean
  logo: string | null
  media: string
  caption: string
  cta: string
  likes: string
  comments: string
  time: string
}

/* ---- Facebook ads model ---- */
export interface FbState {
  format: string   // feed | story | marketplace
  page: string
  verified: boolean
  logo: string | null
  media: string
  primary: string
  headline: string
  desc: string
  url: string
  price: string
  cta: string
  reactions: string
  comments: string
  shares: string
  time: string
}

interface StudioState {
  // shared context
  channel: string
  section: string
  panelOpen: boolean
  device: 'ios' | 'android'
  industry: string
  sub: string | null
  brand: Brand
  sim: boolean
  dateChip: string
  /** When an AI generation is populating a ctx's slice itself, this holds that ctxId so
      the preview's auto-apply-first-template effect skips it (deterministic, order-free). */
  aiSuppressCtx: string | null

  // whatsapp slice
  wa: { messages: WAMsg[]; played: WAMsg[]; encNotice: boolean; typing: boolean }

  // generic messaging slices, keyed by channel id (rcs, sms)
  msg: Record<string, MsgSlice>

  // notify slice (push / inapp / game)
  notify: NotifyState

  // gmail slice
  gmail: GmailState

  // osm slice
  osm: OsmState

  // ad slices
  ig: IgState
  fb: FbState

  // web push slice
  webpush: WebpushState

  // cards / app inbox slice
  cards: CardsState

  // shared actions
  setChannel: (c: string) => void
  setSection: (s: string) => void
  setPanelOpen: (v: boolean) => void
  setDevice: (d: 'ios' | 'android') => void
  setIndustry: (id: string) => void
  setSub: (s: string) => void
  setBrand: (patch: Partial<Brand>) => void
  setSim: (on: boolean) => void
  setDateChip: (v: string) => void
  setAiSuppress: (ctx: string) => void
  clearAiSuppress: () => void

  // whatsapp actions
  waSetMessages: (msgs: WAMsg[]) => void
  waAdd: (type: WAType) => void
  waUpdate: (idx: number, patch: Partial<WAMsg>) => void
  waDelete: (idx: number) => void
  waMove: (idx: number, dir: -1 | 1) => void
  waToggle: (key: 'encNotice' | 'typing') => void
  waClear: () => void

  // simulate branching
  simTapReply: (reply: string, response?: string) => void
  simReset: () => void

  // generic messaging actions (channel-scoped)
  msgSet: (ch: string, msgs: MMsg[]) => void
  msgAdd: (ch: string, type: MType) => void
  msgReplaceType: (ch: string, idx: number, type: MType) => void
  msgUpdate: (ch: string, idx: number, patch: Partial<MMsg>) => void
  msgDelete: (ch: string, idx: number) => void
  msgMove: (ch: string, idx: number, dir: -1 | 1) => void
  msgToggleTyping: (ch: string) => void
  msgClear: (ch: string) => void
  msgTapReply: (ch: string, reply: string, response?: string) => void
  msgSimReset: (ch: string) => void

  // notify actions
  setNotify: (patch: Partial<Pick<NotifyState, 'appName' | 'appLogo' | 'surface' | 'wallpaper' | 'expanded' | 'optinStyle' | 'optinTitle' | 'optinBody' | 'optinAllow' | 'optinDeny'>>) => void
  setPush: (patch: Partial<NotifyState['push']>) => void
  setInapp: (patch: Partial<NotifyState['inapp']>) => void
  setAppBg: (patch: Partial<NotifyState['appBg']>) => void
  setGame: (patch: Partial<NotifyState['game']>) => void

  // gmail actions
  setGmail: (patch: Partial<GmailState>) => void
  setGmailPlain: (patch: Partial<GmailState['plain']>) => void
  setGmailAnnot: (patch: Partial<GmailState['annot']>) => void
  setGmailFiller: (patch: Partial<GmailState['filler']>) => void

  // osm actions
  setOsm: (patch: Partial<OsmState>) => void

  // ad actions
  setIg: (patch: Partial<IgState>) => void
  setFb: (patch: Partial<FbState>) => void

  // web push actions
  setWebpush: (patch: Partial<WebpushState>) => void

  // cards actions
  setCards: (patch: Partial<CardsState>) => void

  ctxId: () => string
}

const emptyMsg = (): MsgSlice => ({ messages: [makeM('text')], played: [], typing: false })

export const useStudio = create<StudioState>((set, get) => ({
  channel: 'whatsapp',
  section: '',
  panelOpen: true,
  device: 'ios',
  industry: 'ecom',
  sub: 'fashion',
  brand: { name: 'Nova', sub: 'online', logo: null, verified: true, phone: '+1 (800) 555-0199', desc: 'Official account · Customer care', agentCard: true },
  sim: false,
  dateChip: 'Today',
  aiSuppressCtx: null,
  wa: { messages: [makeMsg('text')], played: [], encNotice: true, typing: false },
  msg: { rcs: emptyMsg(), sms: emptyMsg() },
  notify: {
    appName: 'Nova', appLogo: null, surface: 'lock', wallpaper: 'aurora', expanded: true,
    optinStyle: 'twostep', optinTitle: 'Turn on notifications', optinBody: 'Get order updates and members-only offers the moment they go live.', optinAllow: 'Turn on notifications', optinDeny: 'Not now',
    push: { title: '', body: '', image: '', actions: '', time: 'now' },
    inapp: { type: 'modal', image: '', headline: '', body: '', ctas: '', close: true, bannerPos: 'top' },
    appBg: { mode: 'branded', image: '', blur: true },
    game: { type: 'scratch', eyebrow: 'Exclusive reward', headline: '', sub: '', prize: '', prizeCap: '', cta: '', segments: '', close: true },
  },
  gmail: {
    skin: 'desktop', view: 'open', senderName: 'Nova', senderEmail: 'hello@nova.shop', logo: null,
    subject: '🎉 Your weekend sale is here — up to 40% off', snippet: 'First pick of the new arrivals — up to 40% off, this weekend only…',
    timestamp: '9:15 AM', toLine: 'to me', unread: true, starred: false, important: false,
    category: 'promotions', labelChip: 'Inbox', bodyMode: 'template', html: '',
    plain: { heading: 'New arrivals, up to 40% off', body: "Our new-season arrivals just dropped — and they're up to 40% off this weekend only. Free shipping on orders over $50. Shop your favorites before they're gone.", btn: 'Shop the sale', accent: '#5b3df5' },
    annot: { on: false, deal: 'Up to 40% off', code: '', expiry: 'Ends Sunday', img: '' },
    filler: { on: true, position: 0 },
  },
  osm: {
    device: 'desktop', format: 'popup', site: 'Nova', url: 'nova.shop', logo: null,
    headline: '', body: '', image: '', cta: 'Shop Now', cta2: '', code: '', input: false,
    countdown: '', rating: 3, scaleLo: 'Not likely', scaleHi: 'Very likely',
    bg: 'branded', bgImage: '', blur: true,
  },
  ig: { format: 'feed', brand: 'Nova', handle: 'nova', verified: true, logo: null, media: '', caption: '', cta: 'Shop Now', likes: '2,438', comments: '86', time: '2 hours ago' },
  fb: { format: 'feed', page: 'Nova', verified: true, logo: null, media: '', primary: '', headline: '', desc: '', url: 'nova.shop', price: '$89', cta: 'Shop Now', reactions: '1,204', comments: '86', shares: '32', time: '2h' },
  webpush: { os: 'mac', site: 'Nova', url: 'nova.shop', logo: null, title: '', body: '', image: '', actions: '', mode: 'notification', bg: 'branded', bgImage: '', blur: false, optinStyle: 'twostep', optinTitle: 'Never miss a drop', optinBody: 'Get browser alerts for new arrivals, restocks and members-only offers.', optinAllow: 'Allow notifications', optinDeny: 'Maybe later' },
  cards: { appName: 'Nova', logo: null, screenTitle: 'Updates', items: [] },

  setChannel: (c) => set({ channel: c, section: '', sim: false, wa: { ...get().wa, played: [] }, msg: clearedPlayed(get().msg) }),
  setSection: (s) => set({ section: s }),
  setPanelOpen: (v) => set({ panelOpen: v }),
  setDevice: (d) => set({ device: d }),
  setIndustry: (id) => {
    const ind = industryById(id)
    const sub = ind && ind.subs.length ? ind.subs[0][0] : null
    set({ industry: id, sub, brand: { ...get().brand, name: ind ? ind.biz : get().brand.name, sub: ind ? ind.status : get().brand.sub } })
  },
  setSub: (s) => set({ sub: s }),
  setBrand: (patch) => set({ brand: { ...get().brand, ...patch } }),
  setSim: (on) => set({ sim: on, wa: { ...get().wa, played: [] }, msg: clearedPlayed(get().msg) }),
  setDateChip: (v) => set({ dateChip: v }),
  setAiSuppress: (ctx) => set({ aiSuppressCtx: ctx }),
  clearAiSuppress: () => set({ aiSuppressCtx: null }),

  waSetMessages: (msgs) => set({ wa: { ...get().wa, messages: msgs, played: [] } }),
  waAdd: (type) => set({ wa: { ...get().wa, messages: [...get().wa.messages, makeMsg(type)] } }),
  waUpdate: (idx, patch) => {
    const messages = get().wa.messages.slice()
    messages[idx] = { ...messages[idx], ...patch }
    set({ wa: { ...get().wa, messages } })
  },
  waDelete: (idx) => set({ wa: { ...get().wa, messages: get().wa.messages.filter((_, i) => i !== idx) } }),
  waMove: (idx, dir) => {
    const messages = get().wa.messages.slice()
    const j = idx + dir
    if (j < 0 || j >= messages.length) return
    ;[messages[idx], messages[j]] = [messages[j], messages[idx]]
    set({ wa: { ...get().wa, messages } })
  },
  waToggle: (key) => set({ wa: { ...get().wa, [key]: !get().wa[key] } }),
  waClear: () => set({ wa: { ...get().wa, messages: [makeMsg('text')], played: [] } }),

  simTapReply: (reply, response) => {
    const played = get().wa.played.slice()
    played.push(makeMsg('text', { from: 'customer', text: reply || 'Selected' }))
    if (response) played.push(makeMsg('text', { from: 'business', text: response }))
    set({ wa: { ...get().wa, played } })
  },
  simReset: () => set({ wa: { ...get().wa, played: [] } }),

  msgSet: (ch, messages) => set({ msg: patchSlice(get().msg, ch, { messages, played: [] }) }),
  msgAdd: (ch, type) => { const s = sliceOf(get().msg, ch); set({ msg: patchSlice(get().msg, ch, { messages: [...s.messages, makeM(type)] }) }) },
  msgReplaceType: (ch, idx, type) => {
    const s = sliceOf(get().msg, ch); const cur = s.messages[idx]; const messages = s.messages.slice()
    messages[idx] = makeM(type, { id: cur.id, from: cur.from })
    set({ msg: patchSlice(get().msg, ch, { messages }) })
  },
  msgUpdate: (ch, idx, patch) => {
    const s = sliceOf(get().msg, ch); const messages = s.messages.slice()
    messages[idx] = { ...messages[idx], ...patch }
    set({ msg: patchSlice(get().msg, ch, { messages }) })
  },
  msgDelete: (ch, idx) => { const s = sliceOf(get().msg, ch); set({ msg: patchSlice(get().msg, ch, { messages: s.messages.filter((_, i) => i !== idx) }) }) },
  msgMove: (ch, idx, dir) => {
    const s = sliceOf(get().msg, ch); const messages = s.messages.slice(); const j = idx + dir
    if (j < 0 || j >= messages.length) return
    ;[messages[idx], messages[j]] = [messages[j], messages[idx]]
    set({ msg: patchSlice(get().msg, ch, { messages }) })
  },
  msgToggleTyping: (ch) => { const s = sliceOf(get().msg, ch); set({ msg: patchSlice(get().msg, ch, { typing: !s.typing }) }) },
  msgClear: (ch) => set({ msg: patchSlice(get().msg, ch, { messages: [makeM('text')], played: [] }) }),
  msgTapReply: (ch, reply, response) => {
    const s = sliceOf(get().msg, ch); const played = s.played.slice()
    played.push(makeM('text', { from: 'customer', text: reply || 'Selected' }))
    if (response) played.push(makeM('text', { from: 'business', text: response }))
    set({ msg: patchSlice(get().msg, ch, { played }) })
  },
  msgSimReset: (ch) => set({ msg: patchSlice(get().msg, ch, { played: [] }) }),

  setNotify: (patch) => set({ notify: { ...get().notify, ...patch } }),
  setPush: (patch) => set({ notify: { ...get().notify, push: { ...get().notify.push, ...patch } } }),
  setInapp: (patch) => set({ notify: { ...get().notify, inapp: { ...get().notify.inapp, ...patch } } }),
  setAppBg: (patch) => set({ notify: { ...get().notify, appBg: { ...get().notify.appBg, ...patch } } }),
  setGame: (patch) => set({ notify: { ...get().notify, game: { ...get().notify.game, ...patch } } }),

  setGmail: (patch) => set({ gmail: { ...get().gmail, ...patch } }),
  setGmailPlain: (patch) => set({ gmail: { ...get().gmail, plain: { ...get().gmail.plain, ...patch } } }),
  setGmailAnnot: (patch) => set({ gmail: { ...get().gmail, annot: { ...get().gmail.annot, ...patch } } }),
  setGmailFiller: (patch) => set({ gmail: { ...get().gmail, filler: { ...get().gmail.filler, ...patch } } }),

  setOsm: (patch) => set({ osm: { ...get().osm, ...patch } }),

  setIg: (patch) => set({ ig: { ...get().ig, ...patch } }),
  setFb: (patch) => set({ fb: { ...get().fb, ...patch } }),

  setWebpush: (patch) => set({ webpush: { ...get().webpush, ...patch } }),

  setCards: (patch) => set({ cards: { ...get().cards, ...patch } }),

  ctxId: () => get().sub || get().industry,
}))

function sliceOf(msg: Record<string, MsgSlice>, ch: string): MsgSlice { return msg[ch] || emptyMsg() }
function patchSlice(msg: Record<string, MsgSlice>, ch: string, patch: Partial<MsgSlice>): Record<string, MsgSlice> {
  return { ...msg, [ch]: { ...sliceOf(msg, ch), ...patch } }
}
function clearedPlayed(msg: Record<string, MsgSlice>): Record<string, MsgSlice> {
  const out: Record<string, MsgSlice> = {}
  for (const k of Object.keys(msg)) out[k] = { ...msg[k], played: [] }
  return out
}

export { INDUSTRIES }
