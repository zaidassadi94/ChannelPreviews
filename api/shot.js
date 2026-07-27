/* ==========================================================================
   Channel Studio — website screenshot proxy (Vercel serverless function).

   The Onsite / In-App / Web Push backdrops let you "Capture from URL": the
   browser can't screenshot a third-party site itself, so it calls
   /api/shot?url=<site> and this fetches a screenshot and returns it as a
   base64 data: URL. Because the response is same-origin base64, the client can
   use it directly (and Export/Record stay CORS-clean) with no canvas taint.

   Provider is keyless by default (thum.io — no setup). To use a more reliable
   paid provider later, set an env var with a URL template containing {url}:
     Vercel → Settings → Environment Variables →
       SHOT_TEMPLATE = https://api.yourprovider.com/take?url=https://{url}&key=...
   Best-effort: any failure returns { ok:false } and the app keeps its current
   backdrop — nothing breaks, offline or on the artifact (no /api there).
   ========================================================================== */

const hits = new Map();
function rateLimited(ip) {
  const now = Date.now(), win = 60000, max = 20;
  const arr = (hits.get(ip) || []).filter((t) => now - t < win);
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

/** Reduce input to a bare host[/path], dropping protocol, spaces and anything
    that isn't URL-ish, so we never forward an attacker-controlled scheme. */
function cleanSite(u) {
  return String(u || '')
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/\s+/g, '')
    .replace(/[^a-zA-Z0-9.\-/_%?=&:~]/g, '')
    .replace(/\/+$/, '');
}

module.exports = async function handler(req, res) {
  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'ip';
  if (rateLimited(ip)) return send(res, 429, { ok: false, error: 'rate-limited' });

  let raw = req.query && req.query.url;
  if (!raw) { try { raw = new URL(req.url, 'http://x').searchParams.get('url'); } catch (e) { /* ignore */ } }
  const site = cleanSite(raw);
  if (!site || site.indexOf('.') < 1) return send(res, 400, { ok: false, error: 'bad-url' });

  const template = process.env.SHOT_TEMPLATE || 'https://image.thum.io/get/width/1280/crop/900/noanimate/https://{url}';
  const target = template.replace('{url}', encodeURI(site));

  try {
    const r = await fetch(target, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ChannelStudio/1.0)' } });
    const ct = (r.headers.get('content-type') || '').split(';')[0].trim();
    if (r.ok && ct.indexOf('image') === 0) {
      const buf = Buffer.from(await r.arrayBuffer());
      if (buf.length > 500) {  // skip empty / error placeholders
        return send(res, 200, { ok: true, url: 'data:' + ct + ';base64,' + buf.toString('base64') }, true);
      }
    }
    return send(res, 200, { ok: false, reason: 'no-shot' });
  } catch (e) {
    return send(res, 200, { ok: false, reason: 'error' });
  }
};
