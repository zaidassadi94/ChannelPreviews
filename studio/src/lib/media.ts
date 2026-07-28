/* Real images + brand logos (network), ported from the root `ai.js`.
   Thin fetch wrappers over the Vercel functions `/api/photo` (Pexels) and `/api/logo`
   (Logo.dev → favicon), memo + localStorage cached. Both return a URL or null — null on
   an absent key, no match, offline, or the artifact/CSP where there is no `/api`. Callers
   keep `phImg(...)` / the monogram as the guaranteed-offline fallback, so the core render
   path (and the artifact preview) never depends on the network. */

import { pxFor, normKw } from '@/content/pximg'

const API = { PHOTO: '/api/photo', LOGO: '/api/logo' }

/** The schema message returned by `/api/generate` (superset of every channel's shape). */
export interface AiMessage {
  brand?: string
  industry?: string
  domain?: string
  type?: string
  // copy fields (per channel)
  text?: string; caption?: string; title?: string; desc?: string; body?: string; footer?: string
  btnText?: string; header?: string
  subject?: string; snippet?: string; category?: string; heading?: string; bodyText?: string; buttonLabel?: string
  headline?: string
  tag?: string
  cta?: string; cta2?: string; code?: string
  input?: boolean; countdown?: string
  actions?: string[]; expanded?: boolean; close?: boolean
  ctas?: { label: string; style?: string }[]
  prize?: string; segments?: string[]
  buttons?: { label: string; type?: string; value?: string; reply?: string }[]
  chips?: { label: string; reply?: string }[]
  items?: { t: string; d?: string; reply?: string }[]
  cards?: { name: string; price?: string; imageKeyword?: string; imageQuery?: string; imageAlt?: string }[]
  imageKeyword?: string; imageQuery?: string; imageAlt?: string
}

const lsGet = (k: string): string | null => { try { return localStorage.getItem(k) } catch { return null } }
const lsSet = (k: string, v: string) => { try { localStorage.setItem(k, v) } catch { /* ignore */ } }

/* ----------------------------- brand logos ----------------------------- */
const logoMem: Record<string, string | null> = {}

export function cleanDomain(d?: string): string {
  return (d || '').toLowerCase().trim()
    .replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '').replace(/[^a-z0-9.\-]/g, '')
}

/** The brand's WORDMARK (horizontal logotype) as a data:/URL, for the email header —
    via Logo.dev's Brand API (server-side, behind /api/logo?wordmark=1). Returns null when
    unavailable (no Brand-API key/plan, or no wordmark), so the caller falls back to text. */
const wordmarkMem: Record<string, string | null> = {}
export async function resolveBrandWordmark(domain?: string): Promise<string | null> {
  const d = cleanDomain(domain || '')
  if (!d || d.indexOf('.') < 1) return null
  if (d in wordmarkMem) return wordmarkMem[d]
  const cached = lsGet('cs-wordmark:' + d)
  if (cached != null) return (wordmarkMem[d] = cached === '0' ? null : cached)
  try {
    const r = await fetch(API.LOGO + '?domain=' + encodeURIComponent(d) + '&wordmark=1')
    const j = await r.json().catch(() => ({}))
    const url = j && j.ok && j.url ? (j.url as string) : null
    wordmarkMem[d] = url
    lsSet('cs-wordmark:' + d, url || '0')
    return url
  } catch { return (wordmarkMem[d] = null) }
}

/** A best-guess domain from a brand name ("Nova Market" → "novamarket.com"). */
export function guessDomain(brand?: string): string | null {
  const slug = (brand || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/&/g, 'and').replace(/[^a-z0-9]/g, '')
  return slug.length >= 2 ? slug + '.com' : null
}

async function resolveLogo(domain: string): Promise<string | null> {
  domain = cleanDomain(domain)
  if (!domain || domain.indexOf('.') < 1) return null
  if (domain in logoMem) return logoMem[domain]
  const cached = lsGet('cs-logo:' + domain)
  if (cached != null) return (logoMem[domain] = cached === '0' ? null : cached)
  try {
    const r = await fetch(API.LOGO + '?domain=' + encodeURIComponent(domain))
    const d = await r.json().catch(() => ({}))
    const url = d && d.ok && d.url ? (d.url as string) : null
    logoMem[domain] = url
    lsSet('cs-logo:' + domain, url || '0')
    return url
  } catch { return (logoMem[domain] = null) }
}

const DOMAIN_RE = /\b([a-z0-9-]+(?:\.[a-z0-9-]+)*\.(?:com|net|org|io|co|ai|app|shop|store|in|us|uk|de|fr|es|it|nl|ca|au|xyz|dev|me|tech|fashion|clothing))\b/i
function domainInBrief(t?: string): string | null { const m = (t || '').toLowerCase().match(DOMAIN_RE); return m ? m[1] : null }

/** Resolve a brand logo from several signals, strongest first: a domain typed in the
    brief, the model's domain, then a domain guessed from the brand name. Returns a
    data:/URL or null (→ caller keeps the generated monogram). */
export async function resolveBrandLogo(o: { brief?: string; domain?: string; brand?: string }): Promise<string | null> {
  const cands = [domainInBrief(o.brief), o.domain, guessDomain(o.brand)].map((c) => cleanDomain(c || ''))
  const seen = new Set<string>()
  for (const c of cands) {
    if (!c || c.indexOf('.') < 1 || seen.has(c)) continue
    seen.add(c)
    const u = await resolveLogo(c)
    if (u) return u
  }
  return null
}

/* ------------------------------- photos -------------------------------- */
const photoMem: Record<string, string | null> = {}

function orientFor(w?: number, h?: number): 'portrait' | 'landscape' | 'square' {
  const W = +(w || 0), H = +(h || 0)
  if (H > W * 1.15) return 'portrait'
  if (W > H * 1.15) return 'landscape'
  return 'square'
}

async function livePhoto(query: string, orientation: string, seed?: number): Promise<string | null> {
  query = (query || '').toLowerCase().trim()
  if (!query) return null
  const sk = seed != null ? ':' + seed : ''
  const key = 'cs-photo:' + orientation + sk + ':' + query
  if (key in photoMem) return photoMem[key]
  const cached = lsGet(key)
  if (cached) return (photoMem[key] = cached)
  try {
    const r = await fetch(API.PHOTO + '?q=' + encodeURIComponent(query) + '&orientation=' + encodeURIComponent(orientation) + (seed != null ? '&seed=' + seed : ''))
    const d = await r.json().catch(() => ({}))
    const url = d && d.ok && d.url ? (d.url as string) : null
    photoMem[key] = url
    if (url) lsSet(key, url)
    return url
  } catch { return (photoMem[key] = null) }
}

/** Best real photo for an AI subject, or null. Precedence: the literal `query` (a live
    Pexels search — sharpest) → a pre-resolved keyword from `images.js` (real photo, no key
    needed) → a live keyword lookup. Orientation from the slot's w/h so portrait slots don't
    get a letterboxed landscape. Null → caller falls back to the self-contained `phImg`. */
export async function photoFor(kw?: string, w?: number, h?: number, query?: string, seed?: number, alt?: string): Promise<string | null> {
  const orientation = orientFor(w, h)
  // AI path passes a per-generation seed → always fetch fresh, varied images and
  // skip the small built-in library (so regenerating gives new options).
  const fresh = seed != null
  // Brand-first query, then a brand-free description if the brand search finds nothing,
  // then the offline keyword. Lets "Nike Air Force" surface real Nike shots but never
  // leaves the slot empty when a brand search comes back with no photo.
  if (query) { const u = await livePhoto(query, orientation, seed); if (u) return u }
  if (alt && alt.trim() && alt.trim() !== (query || '').trim()) { const u = await livePhoto(alt, orientation, seed); if (u) return u }
  if (kw) {
    if (!fresh) { const pre = pxFor(kw); if (pre) return pre }
    const u = await livePhoto(normKw(kw) || kw, orientation, seed)
    if (u) return u
    if (fresh) { const pre = pxFor(kw); if (pre) return pre }  // offline fallback if the live fetch failed
  }
  return null
}

/** A handful of distinct real photos for one subject, for the "Select image" grid.
    Each seed maps to a different pick from the endpoint's ranked pool, so seeds 0..n-1
    return up to `n` different (de-duplicated) options in one parallel batch — cached per
    seed, so re-opening the picker is free. Empty when there's no subject or no key. */
export async function photoCandidates(kw?: string, query?: string, orientation?: string, n = 8, alt?: string, seedBase = 0): Promise<string[]> {
  const orient = orientation || 'landscape'
  const seen = new Set<string>(); const out: string[] = []
  // Fill from the brand query first, then top up from the brand-free description so the
  // grid still offers ~n options even when a brand search returns only a few photos.
  // `seedBase` shifts the seed window so "refresh" pulls a different batch each press.
  const fillFrom = async (phrase?: string) => {
    const q = (phrase || '').trim()
    if (!q || out.length >= n) return
    const urls = await Promise.all(Array.from({ length: n }, (_, seed) => livePhoto(q, orient, seedBase + seed)))
    for (const u of urls) if (u && !seen.has(u) && out.length < n) { seen.add(u); out.push(u) }
  }
  await fillFrom((query && query.trim()) || (kw ? (normKw(kw) || kw) : ''))
  await fillFrom(alt)
  return out
}
