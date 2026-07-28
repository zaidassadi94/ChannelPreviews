/* Per-channel AI adapters: map ONE schema message from /api/generate onto that channel's
   store slice, through the SAME shape the built-in templates produce. Centralised here (a
   single-app equivalent of each root tool's applyAI) so the mappings sit in one place.

   Images resolve via `photoFor` (real Pexels on the deploy) and fall back to `phImg`
   offline; logos via `resolveBrandLogo` (resolved once in the panel, passed in) and fall
   back to the generated monogram. Identity (industry/sub + shared brand) is applied first,
   with the AI-suppress flag so the preview's auto-first-template effect can't clobber it. */

import { useStudio, makeMsg, makeM, type WAType, type MType, type WAMsg, type MMsg, type CardItem } from '@/store/useStudio'
import { resolveIndustry, emailPackFor, packFor } from '@/content/model'
import { phImg, hueOf, avColor } from '@/lib/util'
import { photoFor, cleanDomain, guessDomain, resolveBrandWordmark, type AiMessage } from '@/lib/media'
import { handleFromBrand } from '@/channels/instagram/templates'

const oneOf = <T extends string>(v: string | undefined, list: readonly T[], dflt: T): T =>
  v && (list as readonly string[]).includes(v) ? (v as T) : dflt

/** Per-generation seed → fresh, varied imagery each time you generate (set at the
    top of applyAiMessage; the browser has Math.random, unlike workflow scripts). */
let aiSeed = 0

/** When set (by "Select image"), the channel's hero photo is forced to this exact URL
    instead of being fetched — so a user-picked photo lands in the slot the copy already
    has. Only the hero uses `pic()`; card thumbnails/filler use `photoFor` directly. */
let forcedImage: string | null = null

/** A real photo for the message's subject, or a labelled phImg placeholder (offline). */
async function pic(m: AiMessage, w: number, h: number, label: string): Promise<string> {
  if (forcedImage) return forcedImage
  const real = await photoFor(m.imageKeyword, w, h, m.imageQuery, aiSeed, m.imageAlt)
  return real || phImg(label || 'Preview', null, hueOf((label || 'x') + (m.imageQuery || '')), w, h)
}
const hasImg = (m: AiMessage) => !!(m.imageKeyword || m.imageQuery)
const urlOf = (m: AiMessage, fallback: string) => cleanDomain(m.domain) || guessDomain(m.brand) || fallback || 'example.com'

/* ---- serializers (arrays → the compact strings the store/render parse) ---- */
function serButtons(bs?: AiMessage['buttons']): string {
  if (!bs || !bs.length) return ''
  return bs.filter((b) => b.label).map((b) => {
    const parts = [b.label, b.type || 'reply']
    if (b.value) parts.push(b.value)
    const main = parts.join(' | ')
    return b.reply ? `${main} >> ${b.reply}` : main
  }).join('\n')
}
const serChips = (cs?: AiMessage['chips']): string =>
  (cs || []).filter((c) => c.label).map((c) => (c.reply ? `${c.label} >> ${c.reply}` : c.label)).join('\n')
const serCtas = (cs?: AiMessage['ctas']): string =>
  (cs || []).filter((c) => c.label).map((c) => `${c.label} | ${c.style || 'primary'}`).join('\n')
async function serCards(cards: AiMessage['cards'], url: string): Promise<string> {
  if (!cards || !cards.length) return ''
  const rows = await Promise.all(cards.filter((c) => c.name).map(async (c) => {
    const real = await photoFor(c.imageKeyword, 300, 300, c.imageQuery, aiSeed, c.imageAlt)
    const im = real || phImg(c.name, null, hueOf(c.name), 300, 300)
    return `${im} | ${c.name} | ${c.price || ''} | View | https://${url}`
  }))
  return rows.join('\n')
}

/* ---- identity: switch industry/sub + shared brand (suppressing the auto-template) ---- */
function applyIdentity(m: AiMessage) {
  const s = useStudio.getState()
  if (m.industry) {
    const r = resolveIndustry(m.industry)
    if (r) {
      const newCtx = r.subId || r.industryId
      if (newCtx !== s.ctxId()) s.setAiSuppress(newCtx)
      s.setIndustry(r.industryId)
      if (r.subId) s.setSub(r.subId)
    }
  }
  if (m.brand) s.setBrand({ name: m.brand })
}

/* ------------------------------ per channel ------------------------------ */
async function applyWa(m: AiMessage, logo: string | null) {
  const s = useStudio.getState()
  s.setBrand({ name: m.brand || s.brand.name, sub: 'online', logo })
  const type = oneOf<WAType>(m.type, ['text', 'image', 'template', 'carousel'], 'template')
  const buttons = serButtons(m.buttons)
  let msg: WAMsg
  if (type === 'text') msg = makeMsg('text', { text: m.text || m.body || '', buttons })
  else if (type === 'image') msg = makeMsg('image', { img: await pic(m, 600, 340, m.brand || 'Image'), caption: m.caption || m.body || '', buttons })
  else if (type === 'carousel' && m.cards && m.cards.length) msg = makeMsg('carousel', { cards: await serCards(m.cards, urlOf(m, s.osm.url)) })
  else msg = makeMsg('template', { img: await pic(m, 600, 340, m.brand || ''), body: m.body || m.text || '', footer: m.footer || m.brand || '', buttons })
  s.waSetMessages([msg])
}

async function applyRcs(m: AiMessage, logo: string | null) {
  const s = useStudio.getState()
  s.setBrand({ name: m.brand || s.brand.name, sub: 'Verified business', logo })
  const type = oneOf<MType>(m.type, ['text', 'image', 'card', 'carousel'], 'card')
  const chips = serChips(m.chips)
  let msg: MMsg
  if (type === 'text') msg = makeM('text', { text: m.text || m.body || '', chips })
  else if (type === 'image') msg = makeM('image', { img: await pic(m, 600, 340, m.brand || 'Image'), caption: m.caption || m.body || '', buttons: serButtons(m.buttons) })
  else if (type === 'carousel') msg = makeM('carousel', { cards: await serCards(m.cards, urlOf(m, s.osm.url)), chips })
  else msg = makeM('card', { img: await pic(m, 600, 340, m.brand || ''), title: m.title || m.headline || '', desc: m.desc || m.body || '', buttons: serButtons(m.buttons), chips })
  s.msgSet('rcs', [msg])
}

async function applySms(m: AiMessage, logo: string | null) {
  const s = useStudio.getState()
  s.setBrand({ name: m.brand || s.brand.name, logo })
  const msg = m.type === 'image'
    ? makeM('image', { img: await pic(m, 600, 340, m.brand || 'Image'), caption: m.caption || m.body || m.text || '' })
    : makeM('text', { text: m.text || m.body || '' })
  s.msgSet('sms', [msg])
}

async function applyPush(m: AiMessage, logo: string | null) {
  const s = useStudio.getState()
  s.setNotify({ appName: m.brand || s.notify.appName, appLogo: logo, expanded: m.expanded !== false })
  const image = hasImg(m) ? await pic(m, 600, 340, m.brand || '') : ''
  s.setPush({ title: m.title || '', body: m.body || '', image, actions: (m.actions || []).filter(Boolean).slice(0, 3).join('\n'), time: 'now' })
}

async function applyInapp(m: AiMessage, logo: string | null) {
  const s = useStudio.getState()
  s.setNotify({ appName: m.brand || s.notify.appName, appLogo: logo })
  const type = oneOf(m.type, ['modal', 'banner', 'full', 'sheet', 'image'], 'modal')
  const portrait = type === 'full' || type === 'image'
  const wantImg = type !== 'banner' && (portrait || hasImg(m))
  const image = wantImg ? await pic(m, portrait ? 700 : 600, portrait ? 900 : 340, m.brand || '') : ''
  s.setInapp({ type, image, headline: m.headline || '', body: m.body || '', ctas: serCtas(m.ctas), close: m.close !== false, bannerPos: 'top' })
}

function applyGame(m: AiMessage) {
  const s = useStudio.getState()
  s.setNotify({ appName: m.brand || s.notify.appName })
  const type = oneOf(m.type, ['scratch', 'wheel', 'box', 'slots'], 'scratch')
  const segs = (m.segments || []).filter(Boolean).join('\n')
  s.setGame({
    type, eyebrow: 'A little reward for you', headline: m.headline || '', sub: m.body || '',
    prize: m.prize || '', prizeCap: 'unlocked for you', cta: m.cta || 'Claim my reward', close: true,
    ...(segs ? { segments: segs } : {}),
  })
}

async function applyGmail(m: AiMessage, logo: string | null) {
  const s = useStudio.getState()
  const ep = emailPackFor(s.ctxId())
  const accent = s.brandColor || ep.accent || avColor(m.brand || '')
  const image = hasImg(m) ? await pic(m, 600, 300, m.brand || '') : ''
  const domain = cleanDomain(m.domain) || guessDomain(m.brand) || cleanDomain((ep.from.split('@')[1]) || '') || 'brand.com'
  // Header wordmark: try Logo.dev's Brand API (falls back to the brand name as text).
  const wordmark = (await resolveBrandWordmark(domain)) || ''
  // Land in "Compose" mode: the same rich email, but its copy + image live in editable
  // fields so you can tweak the body right after generating (not baked into read-only HTML).
  s.setGmail({
    senderName: m.brand || ep.brand, senderEmail: `hello@${domain}`, logo, wordmark,
    subject: m.subject || '', snippet: m.snippet || '',
    category: oneOf(m.category, ['primary', 'promotions', 'social', 'updates'], 'promotions'),
    plain: { heading: m.heading || m.subject || '', body: m.bodyText || '', btn: m.buttonLabel || '', accent, image },
    bodyMode: 'plain',
  })
}

async function applyOsm(m: AiMessage, logo: string | null) {
  const s = useStudio.getState()
  const type = oneOf(m.type, ['popup', 'bannerTop', 'bannerBottom', 'nudge', 'full', 'survey'], 'popup')
  const canImg = type === 'popup' || type === 'full' || type === 'nudge'
  const [w, h] = type === 'full' ? [1200, 900] : type === 'nudge' ? [200, 200] : [700, 460]
  const image = canImg && (type === 'full' || hasImg(m)) ? await pic(m, w, h, m.brand || '') : ''
  s.setOsm({
    site: m.brand || s.osm.site, url: urlOf(m, s.osm.url), logo, format: type,
    headline: m.headline || '', body: m.body || '', image,
    cta: m.cta || '', cta2: m.cta2 || '', code: m.code || '', input: !!m.input, countdown: m.countdown || '',
    scaleLo: 'Not likely', scaleHi: 'Very likely',
  })
}

async function applyIg(m: AiMessage, logo: string | null) {
  const s = useStudio.getState()
  const brand = m.brand || s.ig.brand
  s.setIg({
    format: m.type === 'story' ? 'story' : 'feed',
    brand, handle: handleFromBrand(brand), verified: true, logo,
    media: await pic(m, 800, 1000, brand),
    caption: m.body || m.headline || '', cta: m.cta || 'Shop Now',
    likes: s.ig.likes, comments: s.ig.comments, time: '2 hours ago',
  })
}

async function applyFb(m: AiMessage, logo: string | null) {
  const s = useStudio.getState()
  const page = m.brand || s.fb.page
  s.setFb({
    format: oneOf(m.type, ['feed', 'story', 'marketplace'], 'feed'),
    page, verified: true, logo, media: await pic(m, 800, 1000, page),
    primary: m.body || '', headline: m.headline || '', desc: m.desc || '', url: urlOf(m, s.fb.url),
    price: s.fb.price || '$49', cta: m.cta || 'Shop Now',
    reactions: s.fb.reactions, comments: s.fb.comments, shares: s.fb.shares, time: '2h',
  })
}

async function applyWebpush(m: AiMessage, logo: string | null) {
  const s = useStudio.getState()
  const image = hasImg(m) ? await pic(m, 600, 340, m.brand || '') : ''
  s.setWebpush({
    site: m.brand || s.webpush.site, url: urlOf(m, s.webpush.url), logo,
    title: m.title || m.headline || '', body: m.body || '', image,
    actions: (m.actions || []).filter(Boolean).slice(0, 2).join('\n'),
  })
}

async function applyCards(m: AiMessage, logo: string | null) {
  const s = useStudio.getState()
  const brand = m.brand || s.cards.appName
  const image = hasImg(m) ? await pic(m, 600, 300, brand) : ''
  const aiCard: CardItem = { image, title: m.title || m.headline || 'New update', body: m.body || '', tag: m.tag || 'For you', time: 'now', unread: true }
  // a couple of filler cards from the current vertical's pack so the inbox reads full
  const p = packFor(s.ctxId())
  const arrival = p && p.carousel[0] ? p.carousel[0][0] : 'New arrival'
  const arrivalImg = p ? (await photoFor(undefined, 600, 300, arrival, aiSeed)) || phImg(arrival, null, hueOf(arrival + '9'), 600, 300) : ''
  const filler: CardItem[] = p ? [
    { image: '', title: `Order #${p.orderId} shipped`, body: 'On its way — arriving soon.', tag: 'Order', time: '3h', unread: false },
    { image: arrivalImg, title: arrival, body: 'Just added — take a look.', tag: 'New', time: '1d', unread: false },
  ] : []
  s.setCards({ appName: brand, logo, screenTitle: s.cards.screenTitle || 'Updates', items: [aiCard, ...filler] })
}

/** After "Generate", open the section that holds the copy the user will want to tweak.
    An explicit map beats guessing the 2nd rail item — that guess lands on Presets for
    Gmail and the Format toggle for the ad channels. Backdrop channels (osm/inapp/webpush)
    also land on the copy now; the "drop in a real screenshot" nudge lives in the tips. */
export const COPY_SECTION: Record<string, string> = {
  whatsapp: 'conversation', rcs: 'conversation', sms: 'conversation',
  push: 'notification', webpush: 'notification',
  gmail: 'content', inapp: 'content', game: 'reward', cards: 'cards',
  osm: 'message', instagram: 'creative', facebook: 'creative',
}

/** Dispatch a generated message to the active channel's adapter (identity applied first).
    `skipIdentity` is set for background per-channel campaign runs — the industry/brand are
    already set from the first generation, so we don't re-switch them (avoids a flicker and
    keeps the shared logo from being re-resolved/cleared per channel). */
export async function applyAiMessage(channel: string, m: AiMessage, opts: { logo: string | null; skipIdentity?: boolean }): Promise<void> {
  aiSeed = Math.floor(Math.random() * 1e6)   // vary imagery on every generation
  if (!opts.skipIdentity) applyIdentity(m)
  // One brand across the studio: push the generated name + resolved logo to every
  // channel so cycling channels stays consistent (no stale per-channel logos).
  if (m.brand) useStudio.getState().setBrandIdentity(m.brand, opts.logo)
  const logo = opts.logo
  switch (channel) {
    case 'whatsapp': await applyWa(m, logo); break
    case 'rcs': await applyRcs(m, logo); break
    case 'sms': await applySms(m, logo); break
    case 'push': await applyPush(m, logo); break
    case 'inapp': await applyInapp(m, logo); break
    case 'game': applyGame(m); break
    case 'gmail': await applyGmail(m, logo); break
    case 'osm': await applyOsm(m, logo); break
    case 'instagram': await applyIg(m, logo); break
    case 'facebook': await applyFb(m, logo); break
    case 'webpush': await applyWebpush(m, logo); break
    case 'cards': await applyCards(m, logo); break
    default: return
  }
  // Remember this generation so "New image" can re-fetch just the photo (no LLM).
  useStudio.getState().setLastAi({ channel, m, logo, hasImage: producedImage(channel, m) })
}

/** The orientation of a channel's hero photo slot (mirrors each adapter's w/h) — so the
    "Select image" grid fetches candidates in the shape the slot will actually show. */
export function heroOrient(channel: string, m: AiMessage): 'portrait' | 'landscape' | 'square' {
  const t = m.type || ''
  if (channel === 'instagram' || channel === 'facebook') return 'portrait'
  if (channel === 'inapp') return (t === 'full' || t === 'image') ? 'portrait' : 'landscape'
  if (channel === 'osm') return t === 'nudge' ? 'square' : 'landscape'
  return 'landscape'
}

/** Re-apply the last generation's message with a specific, user-chosen photo (from the
    "Select image" grid). No LLM call and no identity change — only the hero image swaps. */
export async function applyChosenImage(url: string): Promise<boolean> {
  const last = useStudio.getState().lastAi
  if (!last || !last.hasImage || !url) return false
  forcedImage = url
  try { await applyAiMessage(last.channel, last.m, { logo: last.logo, skipIdentity: true }) }
  finally { forcedImage = null }
  return true
}

/** Did this channel's adapter actually place a photo? (Gates the "New image" button —
    mirrors each adapter's own image decision.) */
function producedImage(channel: string, m: AiMessage): boolean {
  switch (channel) {
    case 'instagram': case 'facebook': return true
    case 'game': return false
    case 'whatsapp': case 'rcs': return (m.type || '') !== 'text'
    case 'sms': return m.type === 'image'
    case 'inapp': { const t = m.type || ''; return t === 'full' || t === 'image' || (t !== 'banner' && hasImg(m)) }
    case 'osm': { const t = m.type || ''; return t === 'full' || ((t === 'popup' || t === 'nudge') && hasImg(m)) }
    default: return hasImg(m)   // push / webpush / cards / gmail
  }
}
