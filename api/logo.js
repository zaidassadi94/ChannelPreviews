/* ==========================================================================
   Channel Studio — real brand-logo lookup (Vercel serverless function).

   When the AI recognises a real, well-known brand it returns a `domain`
   (e.g. "nike.com"); the client calls /api/logo?domain=<domain> and this
   returns that brand's real logo as a data: URI. Tries Clearbit's free,
   keyless Logo API first, then a favicon service as a fallback. No API key
   needed. Results are cached client-side (and at the edge), so each brand is
   fetched at most once per visitor. If nothing is found the client keeps the
   auto-generated monogram logo — nothing breaks.

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

  const sources = [
    'https://logo.clearbit.com/' + domain + '?size=128&format=png',
    'https://www.google.com/s2/favicons?domain=' + domain + '&sz=128',
  ];
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
