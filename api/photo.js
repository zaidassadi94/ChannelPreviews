/* ==========================================================================
   Channel Studio — live Pexels photo lookup (Vercel serverless function).

   Used ONLY as a fallback: when the AI picks an image keyword that isn't
   already resolved in images.js, the client calls /api/photo?q=<keyword> and
   this returns one matching Pexels photo URL. The Pexels key stays server-side
   (never in the browser). Results are cached client-side so each keyword is
   fetched at most once per visitor — Pexels is barely touched.

   Setup (one-time, no terminal): Vercel → Settings → Environment Variables →
   add  PEXELS_KEY = <your free key from pexels.com/api>  → redeploy.
   If it isn't set, this returns { ok:false } and the app keeps its clean
   illustration — nothing breaks.
   ========================================================================== */

const hits = new Map();
function rateLimited(ip) {
  const now = Date.now(), win = 60000, max = 30;
  const arr = (hits.get(ip) || []).filter(t => now - t < win);
  arr.push(now); hits.set(ip, arr);
  if (hits.size > 5000) hits.clear();
  return arr.length > max;
}

function send(res, status, obj, cache) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  if (cache) res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=604800');
  res.end(JSON.stringify(obj));
}

module.exports = async function handler(req, res) {
  const origin = req.headers.origin || '', host = req.headers.host || '';
  const allow = (process.env.CS_ALLOW_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
  const sameSite = !origin || origin.endsWith(host) || /localhost|127\.0\.0\.1/.test(origin) || allow.includes(origin);
  if (origin) res.setHeader('Access-Control-Allow-Origin', sameSite ? origin : 'null');
  res.setHeader('Vary', 'Origin');
  if (req.method === 'OPTIONS') { res.statusCode = 204; res.end(); return; }
  if (!sameSite) return send(res, 403, { ok: false, error: 'origin not allowed' });

  // graceful when the key isn't configured — the app just keeps its illustration
  if (!process.env.PEXELS_KEY) return send(res, 200, { ok: false, reason: 'no-key' });

  // richer, literal search phrases are welcome now (was 1-2 words) — keep it safe
  // but allow up to ~60 chars of multi-word query.
  const q = String((req.query && req.query.q) || '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60);
  if (!q) return send(res, 400, { ok: false, error: 'q required' });
  const orientation = ['portrait', 'landscape', 'square'].includes(String(req.query && req.query.orientation)) ? req.query.orientation : 'landscape';

  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket?.remoteAddress || 'anon';
  if (rateLimited(ip)) return send(res, 429, { ok: false, error: 'rate-limited' });

  // ---- pick the sharpest match from a candidate pool, not just the first hit ----
  // Score by how many query words appear in the photo's own alt text (Pexels'
  // relevance is decent but the top hit is often a near-miss), tie-broken by size.
  const STOP = new Set(['a', 'an', 'the', 'of', 'on', 'in', 'with', 'and', 'for', 'to', 'at', 'photo', 'image', 'style']);
  const terms = q.split(' ').filter(w => w.length > 2 && !STOP.has(w));
  function pickSize(src) { return (src && (src.large2x || src.large || src.landscape || src.original || src.medium)) || ''; }
  function score(p) {
    const alt = String(p.alt || '').toLowerCase();
    let s = 0;
    for (const t of terms) if (alt.includes(t)) s += 2;
    // prefer photos with a real alt (curated) and a decent resolution
    if (alt) s += 0.5;
    if ((p.width || 0) >= 1200 && (p.height || 0) >= 800) s += 0.5;
    return s;
  }

  async function search(query, orient) {
    const url = 'https://api.pexels.com/v1/search?per_page=15&query=' + encodeURIComponent(query) + (orient ? '&orientation=' + orient : '');
    const r = await fetch(url, { headers: { Authorization: process.env.PEXELS_KEY } });
    if (!r.ok) return { err: 'pexels-' + r.status, photos: [] };
    const data = await r.json();
    return { err: '', photos: (data && data.photos) || [] };
  }

  try {
    let { err, photos } = await search(q, orientation);
    // if a strict orientation search comes back empty, retry unconstrained on
    // orientation so we still return the best available subject match.
    if (!photos.length) ({ err, photos } = await search(q, ''));
    if (err && !photos.length) return send(res, 200, { ok: false, reason: err });
    if (!photos.length) return send(res, 200, { ok: false, reason: 'no-match' }, true);

    let best = photos[0], bestScore = -1;
    for (const p of photos) { const s = score(p); if (s > bestScore) { bestScore = s; best = p; } }
    const src = pickSize(best.src);
    return send(res, 200, { ok: !!src, url: src, alt: best.alt || q }, true);
  } catch (e) {
    return send(res, 200, { ok: false, reason: 'error' });
  }
};
