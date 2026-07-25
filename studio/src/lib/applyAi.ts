/* Per-channel AI adapters: map ONE schema message from /api/generate onto that channel's
   store slice, through the SAME shape the built-in templates produce. Centralised here (a
   single-app equivalent of each root tool's applyAI) so the mappings sit in one place.

   Images resolve via `photoFor` (real Pexels on the deploy) and fall back to `phImg`
   offline; logos via `resolveBrandLogo` (resolved once in the panel, passed in) and fall
   back to the generated monogram. Identity (industry/sub + shared brand) is applied first,
   with the AI-suppress flag so the preview's auto-first-template effect can't clobber it. */

import { useStudio, makeMsg, makeM, type WAType, type MType, type WAMsg, type MMsg } from '@/store/useStudio'
import { resolveIndustry, emailPackFor } from '@/content/model'
import { phImg, hueOf, avColor } from '@/lib/util'
import { photoFor, cleanDomain, guessDomain, type AiMessage } from '@/lib/media'
import { handleFromBrand } from '@/channels/instagram/templates'
import { buildAiEmail } from '@/channels/gmail/emails'

const oneOf = <T extends string>(v: string | undefined, list: readonly T[], dflt: T): T =>
  v && (list as readonly string[]).includes(v) ? (v as T) : dflt

/** A real photo for the message's subject, or a labelled phImg placeholder (offline). */
async function pic(m: AiMessage, w: number, h: number, label: string): Promise<string> {
  const real = await photoFor(m.imageKeyword, w, h, m.imageQuery)
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
    const real = await photoFor(c.imageKeyword, 300, 300, c.imageQuery)
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
  const type = oneOf<WAType>(m.type, ['text', 'image', 'template'], 'template')
  const buttons = serButtons(m.buttons)
  let msg: WAMsg
  if (type === 'text') msg = makeMsg('text', { text: m.text || m.body || '', buttons })
  else if (type === 'image') msg = makeMsg('image', { img: await pic(m, 600, 340, m.brand || 'Image'), caption: m.caption || m.body || '', buttons })
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
  const accent = ep.accent || avColor(m.brand || '')
  const image = hasImg(m) ? await pic(m, 600, 300, m.brand || '') : ''
  const domain = cleanDomain(m.domain) || guessDomain(m.brand) || cleanDomain((ep.from.split('@')[1]) || '') || 'brand.com'
  const html = buildAiEmail({ brand: m.brand || ep.brand, accent, image, heading: m.heading || m.subject || '', body: m.bodyText || '', btn: m.buttonLabel || '' })
  s.setGmail({
    senderName: m.brand || ep.brand, senderEmail: `hello@${domain}`, logo,
    subject: m.subject || '', snippet: m.snippet || '',
    category: oneOf(m.category, ['primary', 'promotions', 'social', 'updates'], 'promotions'),
    html, bodyMode: 'template',
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

/** Dispatch a generated message to the active channel's adapter (identity applied first). */
export async function applyAiMessage(channel: string, m: AiMessage, opts: { logo: string | null }): Promise<void> {
  applyIdentity(m)
  const logo = opts.logo
  switch (channel) {
    case 'whatsapp': return applyWa(m, logo)
    case 'rcs': return applyRcs(m, logo)
    case 'sms': return applySms(m, logo)
    case 'push': return applyPush(m, logo)
    case 'inapp': return applyInapp(m, logo)
    case 'game': return applyGame(m)
    case 'gmail': return applyGmail(m, logo)
    case 'osm': return applyOsm(m, logo)
    case 'instagram': return applyIg(m, logo)
    case 'facebook': return applyFb(m, logo)
  }
}
