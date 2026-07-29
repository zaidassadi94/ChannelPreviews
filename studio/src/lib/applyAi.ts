/* Per-channel AI adapters: map ONE schema message from /api/generate onto that channel's
   store slice, through the SAME shape the built-in templates produce. Centralised here (a
   single-app equivalent of each root tool's applyAI) so the mappings sit in one place.

   Images resolve via `photoFor` (real Pexels on the deploy) and fall back to `phImg`
   offline; logos via `resolveBrandLogo` (resolved once in the panel, passed in) and fall
   back to the generated monogram. Identity (industry/sub + shared brand) is applied first,
   with the AI-suppress flag so the preview's auto-first-template effect can't clobber it. */

import { useStudio, makeMsg, makeM, type WAType, type MType, type WAMsg, type MMsg, type CardItem, type PushItem } from '@/store/useStudio'
import { resolveIndustry, emailPackFor } from '@/content/model'
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
/** The per-message list for a STACKABLE channel: the `messages` envelope when the server
    sent one, else the message itself as a single-entry list (back-compat / single briefs). */
const msgsOf = (m: AiMessage): AiMessage[] => (m.messages && m.messages.length ? m.messages : [m])
/** Did this generation produce more than one stacked message? (Gates the AI-panel hero
    picker, which only makes sense for a single hero photo.) */
export const isMultiAi = (m: AiMessage): boolean => !!(m.messages && m.messages.length > 1)
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
/* Each messaging adapter builds one bubble per message the brief listed (msgsOf), so a
   brief that describes a short sequence renders as a real thread. `brand`/`url` are the
   shared top-level identity; per-part `p` carries that message's own type/copy/image. */
async function buildWa(p: AiMessage, url: string, brand: string): Promise<WAMsg> {
  const type = oneOf<WAType>(p.type, ['text', 'image', 'template', 'carousel'], 'template')
  const buttons = serButtons(p.buttons)
  if (type === 'text') return makeMsg('text', { text: p.text || p.body || '', buttons })
  if (type === 'image') return makeMsg('image', { img: await pic(p, 600, 340, brand || 'Image'), caption: p.caption || p.body || '', buttons })
  if (type === 'carousel' && p.cards && p.cards.length) return makeMsg('carousel', { cards: await serCards(p.cards, url) })
  return makeMsg('template', { img: await pic(p, 600, 340, brand || ''), body: p.body || p.text || '', footer: p.footer || brand || '', buttons })
}
async function applyWa(m: AiMessage, logo: string | null) {
  const s = useStudio.getState()
  const brand = m.brand || s.brand.name
  s.setBrand({ name: brand, sub: 'online', logo })
  const url = urlOf(m, s.osm.url)
  const msgs = await Promise.all(msgsOf(m).map((p) => buildWa(p, url, brand)))
  s.waSetMessages(msgs)
}

async function buildRcs(p: AiMessage, url: string, brand: string): Promise<MMsg> {
  const type = oneOf<MType>(p.type, ['text', 'image', 'card', 'carousel'], 'card')
  const chips = serChips(p.chips)
  if (type === 'text') return makeM('text', { text: p.text || p.body || '', chips })
  if (type === 'image') return makeM('image', { img: await pic(p, 600, 340, brand || 'Image'), caption: p.caption || p.body || '', buttons: serButtons(p.buttons) })
  if (type === 'carousel') return makeM('carousel', { cards: await serCards(p.cards, url), chips })
  return makeM('card', { img: await pic(p, 600, 340, brand || ''), title: p.title || p.headline || '', desc: p.desc || p.body || '', buttons: serButtons(p.buttons), chips })
}
async function applyRcs(m: AiMessage, logo: string | null) {
  const s = useStudio.getState()
  const brand = m.brand || s.brand.name
  s.setBrand({ name: brand, sub: 'Verified business', logo })
  const url = urlOf(m, s.osm.url)
  const msgs = await Promise.all(msgsOf(m).map((p) => buildRcs(p, url, brand)))
  s.msgSet('rcs', msgs)
}

async function buildSms(p: AiMessage, brand: string): Promise<MMsg> {
  return p.type === 'image'
    ? makeM('image', { img: await pic(p, 600, 340, brand || 'Image'), caption: p.caption || p.body || p.text || '' })
    : makeM('text', { text: p.text || p.body || '' })
}
async function applySms(m: AiMessage, logo: string | null) {
  const s = useStudio.getState()
  const brand = m.brand || s.brand.name
  s.setBrand({ name: brand, logo })
  const msgs = await Promise.all(msgsOf(m).map((p) => buildSms(p, brand)))
  s.msgSet('sms', msgs)
}

async function buildPush(p: AiMessage, brand: string, time: string): Promise<PushItem> {
  const image = hasImg(p) ? await pic(p, 600, 340, brand) : ''
  return { title: p.title || p.headline || '', body: p.body || '', image, actions: (p.actions || []).filter(Boolean).slice(0, 3).join('\n'), time }
}
async function applyPush(m: AiMessage, logo: string | null) {
  const s = useStudio.getState()
  const brand = m.brand || s.notify.appName
  const parts = msgsOf(m)
  s.setNotify({ appName: brand, appLogo: logo, expanded: parts[0]?.expanded !== false })
  // First message is the focused notification; the rest stack collapsed beneath it with
  // stepped-back timestamps, like older alerts on a real lock screen.
  const times = ['now', '2h', '5h', '1d']
  s.setPush(await buildPush(parts[0] || m, brand, 'now'))
  const stack = await Promise.all(parts.slice(1).map((p, i) => buildPush(p, brand, times[i + 1] || `${i + 2}d`)))
  s.pushStackSet(stack)
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
    plain: { heading: m.heading || m.subject || '', body: m.bodyText || '', btn: m.buttonLabel || '', accent, image, imageQuery: m.imageQuery || m.imageAlt || '' },
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
  // One card per message the brief described (see the server's MULTIPLE MESSAGES rule).
  // Only the first is marked unread ("1 new"); relative times step back so the feed reads
  // like a real inbox. No hard-coded filler — the feed shows exactly what was asked for.
  const parts = msgsOf(m)
  const times = ['now', '2h', '5h', '1d', '2d']
  const items: CardItem[] = await Promise.all(parts.map(async (c, i): Promise<CardItem> => ({
    image: hasImg(c) ? await pic(c, 600, 300, brand) : '',
    title: c.title || c.headline || 'New update',
    body: c.body || '',
    tag: c.tag || 'For you',
    time: times[i] || `${i + 1}d`,
    unread: i === 0,
  })))
  s.setCards({ appName: brand, logo, screenTitle: m.screenTitle || s.cards.screenTitle || 'Updates', items })
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
  const f = msgsOf(m)[0] || m   // stackable channels carry the (first) message in messages[]
  switch (channel) {
    case 'instagram': case 'facebook': return true
    case 'game': return false
    case 'whatsapp': case 'rcs': return (f.type || '') !== 'text'
    case 'sms': return f.type === 'image'
    case 'inapp': { const t = m.type || ''; return t === 'full' || t === 'image' || (t !== 'banner' && hasImg(m)) }
    case 'osm': { const t = m.type || ''; return t === 'full' || ((t === 'popup' || t === 'nudge') && hasImg(m)) }
    default: return hasImg(f)   // push / webpush / cards / gmail
  }
}

/** The query seed for the AI-panel hero photo picker — the top-level query, or the first
    message's when the generation used the multi-message envelope (single-message runs). */
export const heroQuery = (m: AiMessage): string => {
  const f = msgsOf(m)[0] || m
  return m.imageQuery || m.imageAlt || f.imageQuery || f.imageAlt || ''
}
