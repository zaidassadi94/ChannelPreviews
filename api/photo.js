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

  const q = String((req.query && req.query.q) || '').toLowerCase().replace(/[^a-z0-9 ]/g, '').trim().slice(0, 40);
  if (!q) return send(res, 400, { ok: false, error: 'q required' });

  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket?.remoteAddress || 'anon';
  if (rateLimited(ip)) return send(res, 429, { ok: false, error: 'rate-limited' });

  try {
    const url = 'https://api.pexels.com/v1/search?per_page=1&orientation=landscape&query=' + encodeURIComponent(q);
    const r = await fetch(url, { headers: { Authorization: process.env.PEXELS_KEY } });
    if (!r.ok) return send(res, 200, { ok: false, reason: 'pexels-' + r.status });
    const data = await r.json();
    const p = data && data.photos && data.photos[0];
    if (!p) return send(res, 200, { ok: false, reason: 'no-match' }, true);
    const src = (p.src && (p.src.large || p.src.landscape || p.src.medium)) || '';
    return send(res, 200, { ok: !!src, url: src, alt: p.alt || q }, true);
  } catch (e) {
    return send(res, 200, { ok: false, reason: 'error' });
  }
};
