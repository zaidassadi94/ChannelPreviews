/* ==========================================================================
   Channel Studio — AI generate (shared client).
   Injects a right-hand prompt panel and wires the "AI" topbar button. On
   Generate it POSTs { channel, brand, industry, brief } to /api/generate (the
   serverless function that holds the key and returns ONE schema-validated
   message), then hands the result to the tool's apply() to flow through the
   same render path as a built-in template. Self-contained (injects its own
   styles), like recorder.js. No key ever lives in the browser.

   ChannelStudioAI.init({ button, getContext, apply, toast })
     button      : the topbar trigger element (toggles the panel)
     getContext(): -> { channel, brand, industry }
     apply(msg)  : tool-specific — map the message object into state + render
     toast(text) : optional toast fn
   ========================================================================== */
(function () {
  "use strict";
  const API = { ENDPOINT: '/api/generate', PHOTO_ENDPOINT: '/api/photo', LOGO_ENDPOINT: '/api/logo' };
  const HANDOFF_KEY = 'cs-ai-handoff';

  // ---- brief-driven channel routing ------------------------------------------
  // Which tool owns which channel (matches nav.js). The brief can ask for a
  // channel in another tool; we hand the brief off and re-generate there.
  const TOOL_CHANNELS = { messaging: ['sms', 'rcs', 'whatsapp'], notify: ['push', 'inapp', 'game'], gmail: ['gmail'] };
  const CH_LABEL = { sms: 'SMS', rcs: 'RCS', whatsapp: 'WhatsApp', push: 'Push', inapp: 'In-App', game: 'In-App Gamification', gmail: 'Gmail' };
  function toolOf(ch) { for (const t in TOOL_CHANNELS) if (TOOL_CHANNELS[t].indexOf(ch) >= 0) return t; return null; }
  function toolUrl(ch) { const t = toolOf(ch); if (t === 'gmail') return '../gmail-preview-tool/index.html'; if (t === 'notify') return '../notify-preview-tool/index.html?channel=' + ch; return '../messaging-preview-tool/index.html?channel=' + ch; }
  // Detect an explicitly-requested channel in the brief (order matters: specific first).
  const CH_WORDS = [
    [/\b(in[\s-]?app|inapp)\b/, 'inapp'],
    [/\b(scratch\s*card|spin\s*the\s*wheel|spin\s*wheel|slot\s*machine|mystery\s*box|gamif\w*|reward\s*(game|wheel))\b/, 'game'],
    [/\b(push|lock[\s-]?screen)\b/, 'push'],
    [/\b(e-?mail|gmail|inbox|subject\s*line|newsletter)\b/, 'gmail'],
    [/\b(whats\s?app|wa\b)\b/, 'whatsapp'],
    [/\brcs\b/, 'rcs'],
    [/\b(sms|text\s*message|text\s*msg)\b/, 'sms'],
  ];
  function detectChannel(brief) { const b = ' ' + (brief || '').toLowerCase() + ' '; for (const [re, ch] of CH_WORDS) if (re.test(b)) return ch; return null; }

  // Real brand logo (Logo.dev → favicon fallback), returned as a data: URI. Cached
  // per domain. Returns a URL or null; on any failure the caller keeps the generated mark.
  const logoMem = {};
  async function resolveLogo(domain) {
    domain = (domain || '').toLowerCase().trim();
    if (!domain || domain.indexOf('.') < 1) return null;
    if (domain in logoMem) return logoMem[domain];
    let cached = null; try { cached = localStorage.getItem('cs-logo:' + domain); } catch (e) {}
    if (cached != null) return (logoMem[domain] = cached === '0' ? null : cached);
    try {
      const r = await fetch(API.LOGO_ENDPOINT + '?domain=' + encodeURIComponent(domain));
      const d = await r.json().catch(() => ({}));
      const url = (d && d.ok && d.url) ? d.url : null;
      logoMem[domain] = url;
      try { localStorage.setItem('cs-logo:' + domain, url || '0'); } catch (e) {}
      return url;
    } catch (e) { return (logoMem[domain] = null); }
  }

  // One live Pexels lookup for a search phrase, at a given orientation. Cached
  // (memory + localStorage) so each phrase is fetched at most once per visitor.
  // Returns a URL or null (null on absent key / no match / any failure).
  const photoMem = {};
  async function livePhoto(query, orientation) {
    query = (query || '').toLowerCase().trim();
    if (!query) return null;
    const key = 'cs-photo:' + (orientation || 'landscape') + ':' + query;
    if (key in photoMem) return photoMem[key];
    let cached = null; try { cached = localStorage.getItem(key); } catch (e) {}
    if (cached) return (photoMem[key] = cached);
    try {
      const r = await fetch(API.PHOTO_ENDPOINT + '?q=' + encodeURIComponent(query) + '&orientation=' + encodeURIComponent(orientation || 'landscape'));
      const d = await r.json().catch(() => ({}));
      const url = (d && d.ok && d.url) ? d.url : null;
      photoMem[key] = url;
      if (url) { try { localStorage.setItem(key, url); } catch (e) {} }
      return url;
    } catch (e) { return (photoMem[key] = null); }
  }
  // Resolve one keyword against the pre-fetched set (images.js) or, if absent
  // there, a live keyword lookup. Kept for back-compat + as the fallback path.
  async function resolvePhoto(kw, orientation) {
    kw = (kw || '').toLowerCase().trim();
    if (!kw) return null;
    const M = window.__PXIMG || {};
    if (M[kw]) return M[kw];
    const nk = (typeof normKw === 'function') ? normKw(kw) : kw;   // moisturizer -> cosmetics
    if (nk && M[nk]) return M[nk];
    return livePhoto(nk || kw, orientation);
  }
  function orientFor(w, h) { w = +w || 0; h = +h || 0; if (h > w * 1.15) return 'portrait'; if (w > h * 1.15) return 'landscape'; return 'square'; }
  // Best image URL for an AI subject. A rich, literal `query` (from the model)
  // decides the photo via a live Pexels search — sharper than the generic
  // pre-resolved keyword. Precedence: live query → pre-resolved keyword → live
  // keyword → illustration. Orientation is derived from the slot (w/h) so
  // portrait slots (full-screen / image-only) don't get a letterboxed landscape.
  async function photoFor(kw, w, h, query) {
    const orientation = orientFor(w, h);
    if (query) { const u = await livePhoto(query, orientation); if (u) return u; }
    const u2 = await resolvePhoto(kw, orientation);
    if (u2) return u2;
    return (typeof photo === 'function') ? photo(kw, w, h) : '';
  }

  const EXAMPLES = [
    'Flash sale, 40% off, ends tonight — urgent tone',
    'Abandoned cart nudge with a gentle reminder',
    'Welcome message for a new customer',
    'Order shipped, friendly and reassuring',
  ];

  function injectStyles() {
    if (document.getElementById('cs-ai-styles')) return;
    const css = `
    .cs-ai{ position:fixed; top:60px; right:0; bottom:0; width:340px; max-width:86vw; background:var(--panel,#fff);
      border-left:1px solid var(--line,#e9eaf0); box-shadow:-14px 0 40px rgba(16,18,30,.10); z-index:150;
      display:flex; flex-direction:column; transform:translateX(102%); transition:transform .28s cubic-bezier(.2,.8,.2,1);
      font-family:var(--font,system-ui,sans-serif); }
    .cs-ai.open{ transform:translateX(0); }
    .cs-ai-head{ display:flex; align-items:center; gap:9px; padding:15px 16px 13px; border-bottom:1px solid var(--line,#e9eaf0); }
    .cs-ai-head .ic{ width:26px; height:26px; border-radius:8px; display:flex; align-items:center; justify-content:center;
      background:linear-gradient(140deg,#635bff,#8b5cf6 55%,#22c1c3); color:#fff; font-size:14px; flex:none; }
    .cs-ai-head h3{ font-size:14px; font-weight:650; letter-spacing:-.2px; flex:1; color:var(--ink,#0c0e14); }
    .cs-ai-x{ border:0; background:none; cursor:pointer; color:var(--muted,#7a8194); font-size:18px; line-height:1; padding:4px; border-radius:6px; }
    .cs-ai-x:hover{ background:var(--panel-2,#f7f8fb); color:var(--ink,#0c0e14); }
    .cs-ai-body{ padding:15px 16px; overflow-y:auto; display:flex; flex-direction:column; gap:11px; }
    .cs-ai-body > label{ font-size:11.5px; font-weight:600; letter-spacing:.04em; text-transform:uppercase; color:var(--muted,#7a8194); }
    .cs-ai-ta{ width:100%; min-height:96px; resize:vertical; padding:11px 12px; font-family:inherit; font-size:13.5px; line-height:1.5;
      color:var(--ink,#0c0e14); background:var(--panel-2,#f7f8fb); border:1px solid var(--line,#e9eaf0); border-radius:10px; outline:none; }
    .cs-ai-ta:focus{ border-color:var(--accent,#635bff); box-shadow:0 0 0 3px var(--ring,rgba(99,91,255,.16)); background:#fff; }
    .cs-ai-ex{ display:flex; flex-wrap:wrap; gap:6px; }
    .cs-ai-ex button{ font-size:11.5px; padding:6px 10px; border:1px solid var(--line,#e9eaf0); background:var(--panel-2,#f7f8fb);
      color:var(--ink-2,#3a3f4c); border-radius:999px; cursor:pointer; font-family:inherit; }
    .cs-ai-ex button:hover{ border-color:var(--accent,#635bff); color:var(--accent-ink,#4b45d6); background:var(--accent-weak,#eeecff); }
    .cs-ai-go{ width:100%; border:0; border-radius:10px; padding:12px; font-size:13.5px; font-weight:650; cursor:pointer; font-family:inherit;
      color:#fff; background:linear-gradient(135deg,#635bff,#8b5cf6); box-shadow:0 3px 10px rgba(99,91,255,.32); display:flex; align-items:center; justify-content:center; gap:8px; }
    .cs-ai-go:hover{ filter:brightness(1.05); } .cs-ai-go:disabled{ opacity:.6; cursor:default; }
    .cs-ai-cap{ font-size:11px; color:var(--muted,#7a8194); line-height:1.5; }
    .cs-ai-status{ font-size:12px; line-height:1.5; border-radius:9px; padding:0; }
    .cs-ai-status.show{ padding:10px 12px; }
    .cs-ai-status.err{ background:#fff4f2; color:#c0392b; border:1px solid #f7d6d0; }
    .cs-ai-status.ok{ background:#e9fbf1; color:#0b7a43; border:1px solid #b6ebcc; }
    .cs-ai-spin{ width:15px; height:15px; border:2px solid rgba(255,255,255,.5); border-top-color:#fff; border-radius:50%; animation:cs-ai-sp .7s linear infinite; }
    @keyframes cs-ai-sp{ to{ transform:rotate(360deg); } }
    @media (max-width:920px){ .cs-ai{ top:0; width:100vw; max-width:100vw; } }`;
    const el = document.createElement('style'); el.id = 'cs-ai-styles'; el.textContent = css;
    document.head.appendChild(el);
  }

  let _autogen = null;   // set by init(); lets a handoff from another tool trigger a run

  function init(opts) {
    opts = opts || {};
    const getContext = opts.getContext || (() => ({}));
    const apply = opts.apply || (() => {});
    const toast = opts.toast || (m => {});
    const channels = opts.channels || null;        // channels this tool owns (for routing)
    const setChannel = opts.setChannel || null;    // switch to a locally-owned channel
    const setBrand = opts.setBrand || null;        // set the business/brand name
    const setIndustry = opts.setIndustry || null;  // switch industry/sub to a label
    const setLogo = opts.setLogo || null;          // set (url) or clear (null) the brand logo
    const trigger = opts.button;
    if (!trigger) return;
    trigger.innerHTML = '<span style="font-size:14px">✨</span> AI';

    injectStyles();
    const panel = document.createElement('aside');
    panel.className = 'cs-ai';
    panel.innerHTML = `
      <div class="cs-ai-head"><span class="ic">✨</span><h3>Generate with AI</h3><button class="cs-ai-x" title="Close">✕</button></div>
      <div class="cs-ai-body">
        <label>Describe the message</label>
        <textarea class="cs-ai-ta" maxlength="500" placeholder="e.g. ${EXAMPLES[0]}"></textarea>
        <div class="cs-ai-ex">${EXAMPLES.map(e => `<button type="button" data-ex="${e.replace(/"/g, '&quot;')}">${e}</button>`).join('')}</div>
        <button class="cs-ai-go" type="button">Generate message</button>
        <div class="cs-ai-cap">Name a channel or industry in your brief and the studio switches to it. The AI writes the copy, picks an image, and sets the brand &amp; logo — tweak anything after.</div>
        <div class="cs-ai-status"></div>
      </div>`;
    document.body.appendChild(panel);

    const ta = panel.querySelector('.cs-ai-ta');
    const go = panel.querySelector('.cs-ai-go');
    const status = panel.querySelector('.cs-ai-status');
    const setStatus = (kind, html) => { status.className = 'cs-ai-status' + (kind ? ' show ' + kind : ''); status.innerHTML = html || ''; };
    const openPanel = () => { panel.classList.add('open'); setTimeout(() => ta.focus(), 120); };
    const closePanel = () => panel.classList.remove('open');

    trigger.addEventListener('click', () => panel.classList.contains('open') ? closePanel() : openPanel());
    panel.querySelector('.cs-ai-x').addEventListener('click', closePanel);
    panel.querySelectorAll('.cs-ai-ex button').forEach(b => b.addEventListener('click', () => { ta.value = b.dataset.ex; ta.focus(); }));

    async function generate(briefArg) {
      const brief = (briefArg != null ? String(briefArg) : ta.value).trim();
      if (!brief) { setStatus('err', 'Write a short brief first.'); ta.focus(); return; }
      ta.value = brief;
      const ctx = getContext() || {};
      // --- brief-driven channel routing ---
      const target = detectChannel(brief);
      if (target && channels && channels.indexOf(target) < 0) {
        // the brief asks for a channel this tool doesn't own → hand the brief off
        // to the tool that does and let it regenerate there.
        try { sessionStorage.setItem(HANDOFF_KEY, JSON.stringify({ brief })); } catch (e) {}
        setStatus('ok', 'Switching to ' + (CH_LABEL[target] || target) + '…');
        location.href = toolUrl(target);
        return;
      }
      const channel = target || ctx.channel;
      if (target && target !== ctx.channel && setChannel) setChannel(target);  // switch within this tool

      go.disabled = true; go.innerHTML = '<span class="cs-ai-spin"></span> Generating…'; setStatus('', '');
      try {
        const r = await fetch(API.ENDPOINT, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ channel, brand: ctx.brand, industry: ctx.industry, brief }),
        });
        const data = await r.json().catch(() => ({ ok: false, error: 'Bad response from server' }));
        if (!r.ok || !data.ok) {
          const em = (data && data.error) || ('Request failed (' + r.status + ')');
          const hint = /GEMINI_API_KEY|GROQ_API_KEY/.test(em)
            ? '<br><span style="opacity:.85">Add a free key in Vercel → Settings → Environment Variables, then redeploy.</span>' : '';
          setStatus('err', em + hint);
          return;
        }
        const msg = data.message || {};
        // --- switch the sidebar identity to match what the AI wrote (brief wins) ---
        if (msg.industry && setIndustry) setIndustry(msg.industry);
        if (msg.brand && setBrand) setBrand(msg.brand);
        if (setLogo) setLogo(msg.domain ? await resolveLogo(msg.domain) : null);  // real logo, else generated mark
        // the adapter owns image resolution (via ChannelStudioAI.photoFor); the
        // brief lets it fall back to the message's own subject, not the vertical.
        await apply(msg, { brief });
        toast('✨ AI message generated');
        const note = (target && target !== ctx.channel) ? ('Switched to ' + (CH_LABEL[target] || target) + '. ') : '';
        setStatus('ok', note + 'Done — edit any field on the left, or generate again.');
      } catch (e) {
        setStatus('err', 'Could not reach the generator. On the live site make sure the function is deployed.');
      } finally {
        go.disabled = false; go.innerHTML = 'Generate message';
      }
    }
    go.addEventListener('click', () => generate());
    ta.addEventListener('keydown', e => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') generate(); });

    // let a brief handed off from another tool auto-run here
    _autogen = function (brief) { ta.value = brief || ''; openPanel(); generate(brief); };
    try {
      const h = sessionStorage.getItem(HANDOFF_KEY);
      if (h) { sessionStorage.removeItem(HANDOFF_KEY); const parsed = JSON.parse(h); if (parsed && parsed.brief) setTimeout(() => _autogen(parsed.brief), 220); }
    } catch (e) {}
  }

  window.ChannelStudioAI = { init, API, resolvePhoto, livePhoto, photoFor, resolveLogo, detectChannel, autogen: b => _autogen && _autogen(b) };
})();
