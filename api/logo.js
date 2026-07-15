/* ==========================================================================
   Channel Studio — real brand-logo lookup (Vercel serverless function).

   When the AI recognises a real, well-known brand it returns a `domain`
   (e.g. "nike.com"); the client calls /api/logo?domain=<domain> and this
   returns that brand's real logo as a data: URI. Results are cached
   client-side (and at the edge), so each brand is fetched at most once per
   visitor. If nothing is found the client keeps the auto-generated monogram
   logo — nothing breaks.

   Sources, in order:
     1. Logo.dev (best quality) — needs a FREE publishable token in the env var
        LOGODEV_KEY. Get one at https://logo.dev (free tier: 500K/month). This
        is the official replacement for the (now shut-down) Clearbit Logo API.
     2. DuckDuckGo favicon  — KEYLESS.
     3. Google favicon      — KEYLESS.
   So with no key at all you still get real-brand favicons; add LOGODEV_KEY for
   crisp full logos. The token is publishable, but we keep it server-side here.

   Returning a data: URI (not a CDN URL) keeps it SAME-ORIGIN, so PNG export
   (html2canvas) is never tainted.
   ========================================================================== */

const hits = new Map();
function rateLimited(ip) {
  const now = Date.now(), win = 60000, max = 40;
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

  // domain like "nike.com" — must contain a dot, safe chars only
  const domain = String((req.query && req.query.domain) || '').toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(/[^a-z0-9.\-]/g, '').slice(0, 80);
  if (!domain || domain.indexOf('.') < 1) return send(res, 200, { ok: false, reason: 'bad-domain' });

  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket?.remoteAddress || 'anon';
  if (rateLimited(ip)) return send(res, 429, { ok: false, error: 'rate-limited' });

  const key = process.env.LOGODEV_KEY || process.env.LOGO_DEV_KEY || '';
  const sources = [];
  // 1. Logo.dev — real full-colour logo (needs the free publishable token).
  //    fallback=404 makes it 404 on a miss so we don't grab its generic
  //    placeholder over our own nicer monogram.
  if (key) sources.push('https://img.logo.dev/' + domain + '?token=' + encodeURIComponent(key) + '&size=128&format=png&retina=true&fallback=404');
  // 2 & 3. Keyless favicon services (real-brand icons, lower-res).
  sources.push('https://icons.duckduckgo.com/ip3/' + domain + '.ico');
  sources.push('https://www.google.com/s2/favicons?domain=' + domain + '&sz=128');
  for (const url of sources) {
    try {
      const r = await fetch(url);
      const ct = (r.headers.get('content-type') || '').split(';')[0].trim();
      if (r.ok && ct.indexOf('image') === 0) {
        const buf = Buffer.from(await r.arrayBuffer());
        if (buf.length > 120) {  // skip 1x1 / empty placeholders
          return send(res, 200, { ok: true, url: 'data:' + ct + ';base64,' + buf.toString('base64') }, true);
        }
      }
    } catch (e) { /* try next source */ }
  }
  return send(res, 200, { ok: false, reason: 'no-logo' }, true);
};
