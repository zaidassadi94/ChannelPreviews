# Channel Studio — Handoff / Full Context

Last updated: 2026-07-23. Repo: **`zaidassadi94/ChannelPreviews`** (branch `main`, hosted on **Vercel**, no build step; static site + two optional serverless functions under `api/`).

This doc gives a new session everything needed to continue without re-reading the
whole history. Read this first.

---

## 1. What this is

A set of **self-contained, static HTML tools** that produce **pixel-accurate channel
mockups** (Gmail, WhatsApp, RCS, SMS) for marketing/campaign screenshots to drop into
decks. Built for a MoEngage-style use case. **No backend, no build, no framework, no
AI at runtime.** Everything is plain HTML/CSS/vanilla JS in single files. The user
(repo owner) is **non-technical** — interacts via the deployed Vercel site and by
pasting things into chat; do not assume they can run terminals/scripts.

Product name in the UI: **Channel Studio**.

---

## 2. Repo structure

```
index.html                      # root — redirects to messaging-preview-tool/?channel=whatsapp
setup.html                      # no-terminal Pexels photo resolver (see §6)
resolve-images.js               # Node CLI resolver (alt to setup.html; user is non-technical so prefer setup.html)
images.js                       # window.__PXIMG = { keyword: pexelsCdnUrl }  (the resolved real photos; DATA ONLY)
favicon.svg                     # brand mark (speech-bubble + AI sparkle squircle) — linked from every page
channel-studio.css              # shared design system (sidebar/topbar/frame/toast) — see §11 Phase 1
content.js                      # shared INDUSTRIES / PACKS / CONFIRM (+push/email variants) — §11 Phase 2
image-system.js                 # shared tile/photo/ePhoto/KW/IMGKW/kwFor image system — §11 Phase 2
blocks.js                       # shared DIY block builder (serRows/parseRows/imageField/buildBlocks) — §11 Phase 3
device.js                       # shared fitDevice / statusBarHTML / captureDevice (html2canvas) — §11 Phase 3
nav.js                          # shared channel-dropdown routing (initChannelNav) — §11 Phase 3
ai.js                           # shared "✨ AI" prompt panel (right-hand) → POSTs to /api/generate; resolvePhoto()
api/generate.js                 # Vercel serverless fn: Gemini structured output, schema-locked, key server-side
api/photo.js                    # Vercel serverless fn: live Pexels lookup for AI keywords not in images.js (PEXELS_KEY server-side)
recorder.js                     # shared screen recorder + review studio (trim, export WebM/GIF)
gif-encoder.js                  # vendored gifenc v1.0.3 (MIT) → window.gifenc (used by recorder.js)
messaging-preview-tool/index.html   # SMS + RCS + WhatsApp  (the main tool)
gmail-preview-tool/index.html       # Gmail (inbox + open-email)  (email tool)
notify-preview-tool/index.html      # Push + In-App + In-App Gamification  (notifications tool)
social-preview-tool/index.html      # Instagram Ads — Feed + Story  (social ads tool)
facebook-preview-tool/index.html    # Facebook Ads — Feed + Story + Marketplace  (facebook ads tool)
osm-preview-tool/index.html         # Onsite Messaging — web popups/banners/nudges/etc.  (OSM tool)
README.md                       # user-facing overview + photo setup
HANDOFF.md                      # this file
```

Each tool's index.html holds only its channel-specific CSS + render functions +
state + template archetypes; everything else is shared via the root .css/.js files
(load order per tool: channel-studio.css link, then images.js → image-system.js →
content.js → blocks.js → device.js → gif-encoder.js → recorder.js → nav.js → the
tool's inline script). Files are edited via `python3` string-replacement in Bash
(targeted replaces + asserts are the established pattern). Verify changes by driving
them in headless Chromium via the global Playwright at
`/opt/node22/lib/node_modules/playwright` (import as CJS default; see §9).

---

## 3. Navigation & channels

- **Channel is a dropdown** in each tool's sidebar: **Gmail · WhatsApp · RCS · SMS ·
  Push · In-App · In-App Gamification**. `game` (In-App Gamification) is owned by the
  notify tool, same as Push/In-App (`nav.js` routes `push|inapp|game` → notify). Selecting
  a channel that lives in the *other* tool navigates there:
  - messaging → pick "Gmail" → `../gmail-preview-tool/index.html`; pick Push/In-App →
    `../notify-preview-tool/index.html?channel=push|inapp`
  - gmail → pick WhatsApp/RCS/SMS → `../messaging-preview-tool/index.html?channel=xxx`;
    pick Push/In-App → `../notify-preview-tool/index.html?channel=push|inapp`
  - notify → pick Gmail / WA·RCS·SMS → routes back to those tools; Push↔In-App stay local
- The **six tools each own their channels** (messaging = SMS/RCS/WhatsApp, gmail = Gmail,
  notify = Push/In-App/Game, social = Instagram, facebook = Facebook, osm = Onsite
  Messaging) but all share the same dropdown so it feels like one app. `nav.js` routes
  `instagram` → `../social-preview-tool/`, `facebook` → `../facebook-preview-tool/`, and
  `osm` → `../osm-preview-tool/`.
- There is **one top bar**. Root `index.html` just redirects into the messaging tool.
- `?channel=sms|rcs|whatsapp` deep-links messaging; `?channel=push|inapp` deep-links notify;
  `social-preview-tool/?format=story|feed` deep-links the Instagram tool's format.

---

## 4. The two tools

### messaging-preview-tool (SMS / RCS / WhatsApp)
- **Skins/devices:** iPhone + Android frames (top-left toggle). RCS renders **iOS
  Messages** on iPhone and **Google Messages** on Android; SMS likewise. WhatsApp
  renders its own UI on both frames. Faithful chrome: green/dark WhatsApp header,
  doodle wallpaper, platform-correct **input bars** for iOS vs Android, RCS **verified
  agent banner**, tick marks, typing indicators, etc.
- **Message types** (per channel): text, image/MMS, WhatsApp template (header/body/
  footer/buttons), product carousel, list menu, document; RCS rich card + carousel +
  suggestion chips; SMS text + MMS with GSM/Unicode segment counter.
- **DIY block builders** (not raw text): "+ Add product / + Add button / + Add item /
  + Add reply", each with proper fields (image upload/URL, title, price, CTA, and an
  "auto-reply when tapped" box for branches). Under the hood these serialize to/parse
  from compact strings (`Label | type | value >> reply`) via `serRows`/`parseRows` +
  `buildBlocks()`.
- **Simulate (branching):** the ▶ Simulate button makes buttons/list-items/chips
  clickable; tapping one appends the customer's choice + the authored `>> reply`
  business response. `state.play` + `state.played`, `optAttr()`, `bindOpts()`.
- **Export:** PNG (2×) + copy-to-clipboard via html2canvas (CDN, graceful offline
  fallback). Scale-to-fit keeps the whole phone visible (`fitDevice()`).

### gmail-preview-tool (Gmail)
- Reskinned to the **same Channel Studio design system** (Inter, purple accent). The
  Gmail *preview* stays authentically Gmail (its own scoped `--g-*` tokens).
- Mobile (iPhone) + desktop-web skins; inbox-list + open-email views; light theme;
  Promotions annotations; realistic filler inbox rows.
- Email body: upload HTML / paste HTML / plain, **plus** 6 industry email templates.
- Same Channel/Industry/Sub dropdowns.

### notify-preview-tool (Push / In-App)
- Same Channel Studio shell + Industry/Sub dropdowns + 6-templates-per-vertical model,
  same DIY block builder + `photo()`/`tile()`/`kwFor()` image system + iPhone/Android
  frames + `fitDevice()` scale-to-fit + html2canvas export as the other tools. It hosts
  **two channels** the way messaging hosts three.
- **Push (done):** a single notification (not a message list) edited via fields —
  app name, app icon (upload/monogram), title, body, big image, timestamp, up to 3
  action buttons, an **Expanded** toggle (collapsed thumbnail vs. big-picture + actions).
  Topbar has a **device seg** (iPhone/Android) and a device-aware **surface seg**:
  iOS = **Lock Screen / Banner**, Android = **Heads-up / Shade**. Lock & shade render a
  **wallpaper** (gradient presets + upload, `WALLS`/`wallBg()`); banner & heads-up float
  over **`appBackdrop()`** (also the base for In-App's dimmed app screen) — a **realistic,
  vertical-aware app home** (brand top bar, search, category chips, a brand-coloured promo
  hero built from `p.offer`, a 2×2 product grid from `p.carousel` via `photo(kwFor(name))`,
  and a bottom tab bar). It reads like a real premium app and its product photos never
  duplicate the notification's own image. (2026-07-15 — replaced the old grey skeleton.)
  `state.push={appName,title,body,image,actions,time}` + `state.expanded/surface/wallpaper/appLogo`.
  Templates = `PUSH_ARCH` (6: 2 Promo / 2 Txn / 2 Flow) × `PACKS`. Simulate makes the
  action buttons tappable (toast feedback) — push has no branching conversation.
- **In-App (done):** MoEngage-style messages over the dimmed `appBackdrop()` (scrim
  `.abd-scrim`). Topbar **type seg** (`#inappSeg`, `IATYPES`): **Modal / Banner / Full /
  Sheet / Image**. Editor fields adapt per type (`applyInappFieldVis()`): image (hidden
  for banner), headline + body (hidden for image-only), 1–2 **CTAs** via a block builder
  (`buildCtas`, label + style primary/secondary/text), a close-button toggle, and a
  banner **position** (top/bottom, shown only for banner). CTAs are brand-coloured via a
  `--brand` CSS var = `avColor(appName())`. `state.inapp={type,image,headline,body,ctas,
  close,bannerPos}`; app identity (`appName`/`appLogo`) is **shared with Push** via
  `state.push.appName` + `state.appLogo`. Templates = `INAPP_ARCH` (6: 3 Promo / 1 Txn /
  2 Flow) × `PACKS`. Full-screen + image-only use real `<img>` layers (not CSS
  backgrounds) so the img-error fallback works; image-only has `aspect-ratio:3/4` so it
  never collapses while a photo loads. Channel groups toggle via `.chan-push` /
  `.chan-inapp` classes + `setChannelGroups()`.
- **Gotcha learned here:** don't reuse the root layout class names for in-preview
  elements — a notification `class="app"` inherited the root `.app{height:100vh}` rule
  and blew up the card height. Card app-name is `.appn`. Also give notification images a
  **fixed `height`** (not `max-height`) + `object-fit:cover` so they don't collapse to
  0px while a remote photo is still loading/blocked (sandbox) — `.pn-ios/.pn-and .big`.

### social-preview-tool (Instagram Ads — Story / Feed)
- Same Channel Studio shell + Industry/Sub dropdowns + 6-templates-per-vertical model +
  `imageField`/`photo()`/`kwFor()` image system + iPhone/Android frames + `fitDevice()` +
  html2canvas export + recorder as the other tools. **One channel** (`instagram`) with a
  topbar **format seg** (`#formatSeg`, `FORMATS`): **Story / Feed** — the way notify hosts
  Push surfaces. `state.ig={brand,handle,verified,media,caption,cta,likes,comments,time}` +
  `state.brandLogo` (advertiser profile photo, AI/real-logo or `brandMark` monogram).
- **Story ad (`renderStory` / `.igs`):** full-screen 9:16 takeover — progress bars, header
  (avatar + handle + verified badge + "Sponsored" + short time + ⋯ + ✕), full-bleed media
  with top/bottom scrims, a bottom **swipe-up CTA pill** (chevron-up + label), and a
  "Send message" reply bar with heart/share. Caption is NOT shown (story ads are pure
  creative) — the `#igCapWrap` + `.fmt-feed` groups hide on Story.
- **Feed ad (`renderFeed` / `.igf`):** in-feed post inside a mini Instagram home (wordmark
  top bar + bottom tab nav + a faint next-post peek). Post = header, 1:1 media, a **CTA
  action bar** (`Shop Now ›`), the like/comment/share + save action row, likes count,
  `<b>handle</b> caption`, "View all N comments", and an uppercase timestamp.
- **CTA** is a `<select>` of 10 real Instagram CTAs (`IG_CTAS`: Shop Now, Learn More, Sign
  Up, Install Now, Get Offer, …). **Verified** badge is the blue seal SVG (`VBADGE`),
  toggleable. Handle auto-derives from the business name (`handleFromBrand`) until edited.
- **Templates** = `IG_ARCH` (6: Product launch / Flash sale / App install / Sign-up-lead /
  Social proof / Retargeting) × `PACKS` — format-agnostic content that renders in whichever
  format is selected. **Simulate** makes the CTA tappable (toast). **AI** wired via
  `applyAI` (reads `type:story|feed` to switch format, maps `headline+body`→caption,
  `cta`→button, resolves media via `ChannelStudioAI.photoFor` portrait-for-story). Server
  schema added in `api/generate.js` (`CHANNELS.instagram=['story','feed']` + `schemaFor` +
  `CHANNEL_VOICE.instagram`); `ai.js` routing added (`TOOL_CHANNELS.social`, `toolUrl`,
  `CH_LABEL`, and a `CH_WORDS` entry so "an instagram story for…" hands off here).

### osm-preview-tool (Onsite Messaging — web)
- MoEngage-style **web** onsite messaging. Unlike In-App (mobile app), OSM renders on a
  **web browser frame**: `state.device` is `desktop` (a `.osm-win` browser window — traffic
  lights + address bar) or `mobile` (the shared `.phone` frame + a mobile-browser `.osm-mbar`).
  `state.osm={site,url,headline,body,image,cta,cta2,code,input,countdown,rating,bg,bgImage,blur}`.
- **Formats** (`#topVar`): `popup` (center modal), `bannerTop` / `bannerBottom` (sticky
  strip), `nudge` (corner slide-in), `full` (full-screen interstitial), `survey` (NPS emoji
  rating). `INTRUSIVE={popup,full,survey}` — those dim+blur the page; banners/nudges leave it
  clear. `applyFieldVis()` shows/hides editor fields per format (image only for popup/full/
  nudge; code/input only for popup; countdown for popup/banner/full; etc.).
- **Background system** (the "backdrop won't match the brand" fix, per the owner): a
  `#bgSeg` control = **branded** (`siteBackdrop()` — a brand-adaptive website skeleton:
  brand nav/logo, brand-colour hero from `p.offer`, product grid from `p.carousel`),
  **upload** (`state.osm.bgImage` screenshot of the customer's real site via `imageField`),
  or **neutral** (`neutralBackdrop()` — grey wireframe, no fake brand). A `blur` toggle
  applies `filter:blur()` + a dark scrim on intrusive formats. **This same control should be
  ported to In-App** (planned).
- **Live countdown timer:** `startCountdown()` runs a single `setInterval` that decrements
  and writes into `.osm-cd` spans in place (no full re-render), cleared/restarted each
  render. `cdHTML()` renders the HH/MM/SS units. Used by flash-sale banner + urgency full.
- **Templates** = `OSM_ARCH` (12: welcome, email-capture, exit-intent, cart, free-shipping,
  flash-sale countdown, coupon reveal, back-in-stock, NPS, announcement, limited-stock,
  cookie-consent) × `PACKS`; each sets its own `fmt`. **AI** wired via `applyAI` (its `type`
  is the format); `api/generate.js` has `CHANNELS.osm` + `schemaFor` (fields incl. `input`,
  `countdown`) + `CHANNEL_VOICE.osm`; `ai.js` routing + a `CH_WORDS` entry (osm / onsite /
  exit-intent / cookie-consent / website popup).

### facebook-preview-tool (Facebook Ads — Feed / Story / Marketplace)
- Same shell/foundations as the other tools (content packs, image system, imageField,
  device frame, export, recorder, AI, unified `#topVar` top-bar dropdown). One channel
  (`facebook`) with **Feed / Story / Marketplace** formats. `state.fb={page,verified,media,
  primary,headline,desc,url,price,cta,reactions,comments,shares,time}` + `state.brandLogo`.
- Editor fields are shown per format by `applyFieldVis()` (not CSS classes): primary/desc/
  url + the Engagement group are Feed-only; `headline` shows for Feed + Marketplace (label
  becomes "Listing title" on Marketplace); `price` is Marketplace-only.
- **Feed (`renderFeed` / `.fbf`):** an in-feed News Feed post inside a mini Facebook home
  (blue `facebook` wordmark bar + bottom nav). Post = header (page avatar, name + verified,
  "Sponsored · 🌐 globe", ⋯ ✕), **primary text above the image**, 1:1 media, the signature
  **link module** (`.fb-link`: uppercase display URL, bold headline, description, + a grey
  CTA button), then the reactions row (blue-thumb + red-heart cluster `.fb-rc` + count,
  "N comments · N shares") and the Like / Comment / Share action bar. This is what makes FB
  visually distinct from IG — the link module + reaction bar.
- **Story (`renderStory` / `.fbs`):** full-screen 9:16 like the IG story, but with a solid
  white FB CTA button (`.fbs-cta`) and FB-blue verified seal. Caption not shown (story ads
  are pure creative).
- **Marketplace (`renderMkt` / `.fbm`):** the ad shown in context inside the Marketplace
  browse grid — a "Marketplace" header + search, "Today's picks", then a 2-col grid whose
  FIRST card is the sponsored ad (media, `price`, title=`headline`, "Sponsored · Page", + a
  CTA button); the remaining cards are filler listings built from `PACKS[ctx].carousel`
  (`mktFiller()`, name/price/photo + a rotating city from `MKT_LOCS`). Only the ad card's
  CTA is Simulate-tappable.
- **CTA** is a `<select>` of 10 real Facebook CTAs (`FB_CTAS`). The `facebook` "f" logo and
  the FB-blue verified seal are export-safe inline SVGs. **Templates** = `FB_ARCH` (6, same
  archetypes as IG but producing primary/headline/desc/url) × `PACKS`. **AI** wired via
  `applyAI` (`type:feed|story` switches format; `body`→primary text, `headline`→link
  headline, `desc`→link description). Server schema in `api/generate.js`
  (`CHANNELS.facebook=['feed','story']` + `schemaFor` + `CHANNEL_VOICE.facebook`); `ai.js`
  routing added (`TOOL_CHANNELS.facebook`, `toolUrl`, `CH_LABEL`, a `CH_WORDS` entry placed
  BEFORE Instagram's so "a facebook feed ad…" wins over IG's generic "…feed ad" match).

### Screen recorder (`recorder.js`, shared)
- Root `recorder.js` (loaded by all three tools via `<script src="../recorder.js">`)
  adds a **Record** button next to Export that records **only the device/desktop view**
  (`#capture`) — not the sidebar or browser chrome. Uses the Chromium **Region Capture**
  API: `getDisplayMedia({preferCurrentTab:true})` → `CropTarget.fromElement(#capture)` →
  `track.cropTo(...)` → `MediaRecorder` → downloads a `.webm`. Where Region Capture is
  absent (Safari/Firefox) it records the whole tab with a toast note. `ChannelStudioRecorder
  .init({button, getEl, filename, toast})`; the button self-manages idle/recording state
  and a live timer. Self-contained, no libraries; sandbox can't run the real tab-share so
  it's verified by mocking `getDisplayMedia` with a canvas stream.
- **Clean-capture extras** (all gated by a `body.cs-rec-live` class the recorder toggles
  on start/stop): hides `.sim-badge` + `.toast` (tool-only overlays that Region Capture
  would otherwise bake in), sets `cursor:none` on `#capture` (and inside same-origin
  iframes), and shows a **touch-orb cursor** (`.cs-orb`, visible only over the device)
  plus a **click ripple** (`.cs-ripple`) — so recordings look like a fingertip tapping.
- **Review studio** (opens on Stop instead of auto-downloading; injected DOM `.cs-rev*`):
  looping preview, a **filmstrip trim bar** (12 thumbnails + draggable start/end handles +
  "play selection"), and export as **WebM** (untrimmed = original blob, lossless/instant;
  trimmed = real-time re-encode of the slice via `video.captureStream()` → MediaRecorder)
  or **GIF** (`gifenc` per-frame 256-colour palette + ordered/Bayer dithering, fps + size
  controls, progress bar). MediaRecorder webm blobs report `Infinity` duration until nudged,
  so `resolveDuration()` seeks to 1e6 to force it. `gif-encoder.js` must be loaded first.
  Verified by mocking `getDisplayMedia` (record) and by feeding a canvas-made webm into
  `ChannelStudioRecorder._openReview()` (studio) — the real tab-share only runs on-device.
- **Critical dependency:** each tool's `render()` now **reuses a persistent `#capture`
  element** (updates its `className` + `innerHTML`) instead of replacing the node. This is
  what keeps a mid-recording crop alive across re-renders (template switch, Simulate tap,
  field edit). If you ever go back to `stage.innerHTML = '<div id="capture">…'`, recording
  will break on the first re-render. Verified by asserting `#capture` node identity is
  stable across a render.

---

## 5. Content model (industries, templates)

- **Industries (8):** ecom, bfsi, media, travel, food, edtech, gaming, telecom.
  Sub-industries where warranted (ecom→fashion/marketplace/d2c; bfsi→banking/
  insurance/fintech; media→ott/news; travel→airlines/hotels; food→delivery/grocery;
  edtech/gaming/telecom have none). `ctxId()` = `sub || industry`.
- **Content packs** per `ctxId`: messaging = `PACKS` (brand, offer, url, orderId,
  carousel, per-vertical `flow` with intro+3 branch options, etc.); gmail = `EPACKS`
  (brand, from, accent, products, code, total, …). Brands are generic/US (Nova,
  Meridian Bank, Streamly, SkyHigh, QuickBite, LearnSphere, PixelForge, ConnectTel).
- **Templates: exactly 6 per channel per (sub)industry**, generated from archetypes
  (`ARCH` in messaging, `EARCH` in gmail) × the content pack. Mix of **Promotional /
  Transactional / Flow** (only Flow ones are interactive; tagged FLOW/PROMO/TXN).
- **Confirmation/order templates are vertical-aware** via `CONFIRM` + `ecx()`:
  physical verticals (retail/food/grocery) → order + tracking; digital/service
  verticals → subscription active / plan activated / booking confirmed / policy
  active / payment successful / enrollment confirmed (no "tracking link" nonsense).
- **Locale is US:** currency `$` (no SAR/AED), phone `+1`, `.com` domains, US cities
  (Miami/New York/Chicago). **Dark mode was removed** (always light).

To add an industry: extend `INDUSTRIES` + add a pack in `PACKS`/`EPACKS` (+ `KW` and
image keywords, see §6). To change a template: edit the relevant `ARCH`/`EARCH` entry.

---

## 6. Images system (IMPORTANT — read fully)

The single most-iterated area. Evolution: random picsum → loremflickr (both gave
irrelevant/weird photos) → **Pexels resolved-once + illustration fallback** (current).

**How it works now:**
- Every product/hero image resolves to a **keyword** (e.g. `tshirt`, `car`, `burger`,
  or a per-vertical `KW` like `clothing`). Product name → keyword via `IMGKW` +
  `kwFor(name)`. Vertical → `KW[ctxId()]`.
- `photo(kw,w,h)` (messaging) / `ePhoto(kw,seed)` (gmail) returns:
  `window.__PXIMG[kw]` (a real Pexels CDN URL) **if present**, else a
  **self-contained SVG line-illustration** (`tile()` + `ILLUS`/`ILMAP`) of that
  product on a soft gradient — always relevant, never broken, exports fine.
- `images.js` (at repo root, loaded by both tools via `<script src="../images.js">`)
  sets `window.__PXIMG = { keyword: url, ... }`. It currently has **56 real Pexels
  photos** (resolved 2026-07-14). A stub `window.__PXIMG={}` is the fallback if the
  file is missing.
- **Why this design:** loading a Pexels CDN image is NOT an API call → zero rate-limit
  cost regardless of traffic. Pexels images are CORS-safe so html2canvas export works
  when the image is **inline in the captured DOM** (messaging/notify). **Exception:** the
  Gmail email body renders in an `<iframe>`, which html2canvas can't read — that path
  inlines remote images to `data:` URIs at capture time (see §10, 2026-07-23). No API key
  ships in the app. Research confirmed there is **no keyless keyword-photo API** and
  Google Images can't be hotlinked, so "resolve once, then serve static URLs" is the
  only clean path for a static site.

**Re-resolving / changing photos:**
- Non-technical path: open **`https://<site>/setup.html`**, paste a free Pexels API
  key, click "Fetch product photos", copy the output box → paste to Claude → Claude
  writes it to `images.js` and pushes. (Queries live at the top of `setup.html` and
  `resolve-images.js`, kept in sync — product/object-focused, US-biased for people.)
- To swap ONE image: edit that keyword's URL in `images.js` (any Pexels CDN URL), or
  change its query in setup.html/resolve-images.js and re-run.
- Demographics caveat: Pexels has no demographic filter; queries are object-focused so
  most shots have no people. The `family` keyword (telecom Family Plan) does show
  people — swap it if the user objects (they asked for "US, no Indians").

`resolve-images.js` is the terminal-based twin of setup.html (`PEXELS_KEY=... node
resolve-images.js` → writes `images.js`). Prefer setup.html for this user.

---

## 7. Deploy

- Vercel, **static, zero config**. Push to `main` → auto-redeploy. Framework preset:
  Other; no build command; output = repo root.
- All paths are explicit/relative so it also works on any static host or opened
  locally (except remote images + html2canvas CDN need internet).
- The image hosts (Pexels, cdnjs html2canvas) are **firewalled inside the Claude
  sandbox** — so in local Playwright tests remote images fall back to illustrations
  and html2canvas may be offline. On the user's Vercel site they load fine. Do not
  mistake the sandbox fallback for a bug.

---

## 8. Verification pattern (how work was validated)

Headless Chromium via global Playwright. Typical checks: no `pageerror`, `#capture`
exists, template counts (6 per combo), block builders render, Simulate branches append
bubbles, nav between tools works, image `src` uses the expected keyword/URL. Screenshot
`.topbar`, `#capture`, or `#editor` and Read the PNG to eyeball fidelity. Example
scripts were written to the scratchpad dir during the session.

Large-file edits: use `python3` heredocs with `assert <exact string> in s` before
`replace`, then re-open to verify counts. `node --check file` for JS syntax; for a
whole HTML file, extract `<script>` bodies and `new Function(body)` to catch
"Unexpected end of input" (a `</script>` inside an inline-script template literal will
prematurely close the script — this bit us once in the gmail tool).

---

## 9. Gotchas / lessons

- **Never inject `</script>` inside an inline `<script>`** (e.g. via a template string
  that builds an email doc) — it closes the outer script. Build such strings without a
  literal `</script>`.
- Grid row must be viewport-bounded (`grid-template-rows:100vh` + `min-height:0` on the
  stage) or the phone gets cut off and the sidebar won't scroll.
- Device mockups use **scale-to-fit** (`fitDevice()`); export temporarily removes the
  transform so PNGs are full-res.
- Toggle **selected** state is dark (`.seg button.on{background:#14151a;color:#fff}`) so
  the active option is visible.
- Commit messages with `>>` or embedded quotes break `git commit -m` in bash — write
  the message to a file and `git commit -F`.
- Git proxy allows push to the working branch but **blocks branch deletion / arbitrary
  refs (403)** and blocks external egress (image/CDN hosts). GitHub MCP has no
  ref-delete tool.

---

## 10. Status & possible next steps

**Done 2026-07-23 (Onsite Messaging — a new WEB channel + tool):** Added a **sixth tool**,
`osm-preview-tool/index.html`, hosting the **Onsite Messaging** channel — MoEngage-style web
messages on a desktop-browser or mobile-web frame, with all six formats (Popup, Banner
top/bottom, Nudge, Full-screen, Survey/Feedback), a live countdown timer, a 12-template
library, and the **Background control** (branded skeleton / upload screenshot / neutral +
blur-&-dim) that solves the "backdrop won't match the brand" problem (see §4). Wired into
every tool's dropdown + `nav.js` + AI (`ai.js` routing/detection + `api/generate.js`
schema/voice). Verified headless: all 6 formats render (desktop + mobile), no `pageerror`,
12 templates, countdown ticks, all 3 background modes, Export not clipped, cross-tool
routing, AI detection (osm vs in-app both correct). Channel count is now **11** across 6
tools. **Next (planned): port the same Background control onto the In-App channel** in the
notify tool.

**Done 2026-07-23 (Facebook Marketplace format):** Added a third Facebook format,
**Marketplace** — the ad shown as a listing card (media, price, title, "Sponsored" + CTA)
inside the Marketplace browse grid among filler listings (see §4). New `price` field
(Marketplace-only) and per-format field visibility via `applyFieldVis()`; format dropdown
now Feed / Story / Marketplace; `api/generate.js` FB enum gained `marketplace`. Verified
headless: renders with the ad card + 3 fillers, price/title/CTA correct, field show/hide
per format, no `pageerror`.

**Done 2026-07-23 (Facebook Ads — a new channel + tool; Instagram polish):** Added a
**fifth tool**, `facebook-preview-tool/index.html`, hosting the **Facebook Ads** channel
with **Feed + Story** formats (Marketplace added same day — see above and §4). Wired into every tool's channel dropdown + `nav.js`
(`facebook` → facebook tool) and the AI generator (`ai.js` routing/detection with the FB
`CH_WORDS` entry ordered before Instagram's generic match, + `api/generate.js` schema/voice).
Facebook's Feed is deliberately distinct from Instagram's: primary text above the image, the
grey **link module** (display URL + headline + description + CTA button) below it, and the
reactions/Like-Comment-Share bar. Also polished Instagram: replaced the cursive-font
wordmark with an authentic **gradient camera glyph + wordmark** inline-SVG mark (export-safe),
and made **Feed the default** format (was Story). Verified headless: both FB formats render
with no `pageerror`, 6 templates/vertical, industry switching, Simulate CTA, iPhone/Android
frames, Export never clipped, cross-tool routing from all four other tools, and AI detection
(`facebook` for FB briefs, `instagram` still correct). Channel count is now **10** across 5
tools. Note: Facebook is its own tool folder (isolated from the working Instagram tool);
Instagram lives in `social-preview-tool` for historical reasons — both could later merge
under one "social" shell, but they work independently today.

**Done 2026-07-23 (unified top bar across all 4 tools):** The per-channel variant
selector used to be a row of segmented buttons in the top bar (In-App's 5-button
Modal/Banner/Full/Sheet/Image, Push's device-aware surface seg, Game's 4 types,
Instagram's Story/Feed, Gmail's Inbox/Open) — its width swung wildly per channel and,
combined with the redundant channel caption and unpinned actions, shoved **Export off
the right edge** on In-App. Fixed by unifying the bar: every tool is now
`[device seg] [one compact #topVar dropdown] … [Simulate] [AI] [Record] [Copy] [Export]`.
Changes: `channel-studio.css` pins `.topbar .btn`/`.seg` (`flex:none` so Export never
clips), adds a `.topsel` dropdown style, hides the redundant `.topcap` caption, and adds
two responsive tiers (≤1200 tightens spacing; ≤1080 makes the device toggle icon-only) so
it holds from ~1440 down to ~1024. Each tool swapped its variant seg(s) for one `#topVar`
`<select>`: notify has a single `fillTopVar()` that populates surfaces/types/games by
channel (its old `fillSurface/fillInappSeg/fillGameSeg` now delegate to it); social's
format seg and gmail's view seg became selects too; gmail's `⧉ Copy`/`⬇ Export PNG` were
normalized to `Copy`/`Export` (shared icon) to match. Messaging keeps just the device seg
(SMS/RCS/WhatsApp have no preview sub-variant). Gmail has no Simulate (email isn't
interactive) — a genuine capability difference. Verified headless: no `pageerror`, correct
dropdown options per channel/device, variant switching re-renders, and Export stays fully
visible for every channel at 1440/1280/1120/1024.

**Done 2026-07-23 (Instagram Ads — a new channel + tool):** Added a **fourth tool**,
`social-preview-tool/index.html`, hosting the **Instagram Ads** channel with two formats,
**Story** and **Feed** (topbar format seg) — see §4 for the full description. Wired into
every tool's channel dropdown + `nav.js` (`instagram` → social tool), and into the AI
generator (`ai.js` routing/detection + `api/generate.js` schema/voice) for full parity with
the other channels. Verified headless (Playwright, over http for the AI path): both formats
render with no `pageerror`, 6 templates/vertical, industry switching, Simulate CTA,
iPhone/Android frames, export path, cross-tool routing from all three other tools, and an
end-to-end AI generate (brief → format switch + brand/handle/logo/caption/CTA). Remote
Pexels photos + html2canvas CDN stay firewalled in-sandbox (illustration fallback) as with
every tool — sanity-check real photos/export on the Vercel deploy. Channel count is now **9**
across 4 tools. Note: this work was pushed to branch `claude/instagram-ads-channel-utiql5`
(the session's designated branch), not `main`.

**Done 2026-07-23 (brand name + logo reliability, Gmail & gamification capture):**
- **Brand names no longer truncate.** The AI sometimes returned an abbreviated/invented
  variant of a real brand (brief "birkenstock" → header "Birki"). `api/generate.js`
  `brandField` + the identity line of `systemPrompt` now require the real company's
  **full, correct name** and forbid inventing a shortened variant.
- **Logos resolve for more than famous names.** The old flow only showed a logo when the
  model emitted a `domain`, gated on "real, **well-known** company", so mid-size brands
  (e.g. **Nobero** — logo.dev has it) fell back to the monogram. Two changes: (1) loosened
  the `domain` field/prompt to any identifiable/guessable real brand; (2) `ai.js` new
  `resolveBrandLogo({brief,domain,brand})` resolves from **the brief's own domain → the
  model's domain → a domain guessed from the brand name** ("Nobero"→nobero.com), strongest
  first. `/api/logo` already degrades gracefully (logo.dev → DuckDuckGo/Google favicon →
  none), so a guess only ever upgrades a monogram to a real logo. Old `resolveLogo(domain)`
  kept for compat; `resolveBrandLogo` is the entry point `setLogo` now uses.
- **Gmail export/copy now includes the email image.** The email body renders in a sandboxed
  `<iframe>` (arbitrary/pasted HTML needs style isolation — see §Gmail), and html2canvas
  can't see into iframes, so capture swaps the iframe for an inline div. The hero was a
  **remote Pexels URL** that taints/CORS-fails inside html2canvas and dropped out. Fix:
  `gmail-preview-tool` `capture()` now pre-inlines the body's remote images as same-origin
  `data:` URIs (`imgToDataURI`/`inlineImages`) before rasterising; best-effort — anything
  that can't be fetched keeps its URL + the prior `crossorigin` fallback.
- **In-App Gamification copy/export fixed.** The `.gm` game CSS used `color-mix()` (6
  places, incl. `.gm::before` present in *every* game). **html2canvas 1.4.1 throws on
  `color-mix()`**, rejecting the whole capture → Copy/Export failed on all four games.
  Replaced each with `rgba(var(--gm-accent-rgb), a)`; new `hexRgb()` helper sets a
  `--gm-accent-rgb` channel triplet in `renderGame`. Renders identically (verified computed
  colours match). Same failure class as the wheel-is-SVG-not-conic-gradient note below.
- The **recorder** (WebM/GIF) uses screen capture, not html2canvas, so it was unaffected by
  both capture bugs. Verified offline in Playwright (computed colours, clean page init,
  DOM-inlining logic); the live html2canvas capture + Pexels CORS can't be exercised in the
  Claude sandbox (html2canvas CDN + images.pexels.com are firewalled — see §env notes), so
  do a quick real-browser sanity check on the Vercel deploy.
- Added **`CLAUDE.md`** at repo root recording the owner's standing preference: always
  commit + push finished work to `main`.

**Done 2026-07-15 (brief-authoritative AI routing + auto logos):** The sidebar used to
*constrain* the AI (brand/industry injected into the prompt), so a jeans brief on the Travel
vertical still said "SkyHigh". Flipped it — the **brief now drives the UI**:
- Server (`api/generate.js`) returns `brand` + `industry` (+ optional `domain`) it decides
  from the brief; the prompt treats the current sidebar as a fallback only and invents a
  fitting brand when the brief implies a different business. `content.js` `resolveIndustry(label)`
  maps a free label ("grocery", "airline") to a known {industryId, subId}.
- `ai.js` detects an explicitly-named channel in the brief (`detectChannel`), then: switches
  within the current tool (`setChannel`), or — for a channel another tool owns — stashes the
  brief in `sessionStorage['cs-ai-handoff']`, navigates via `toolUrl`, and the target tool
  auto-runs it (`ChannelStudioAI.autogen`, fired on load). After generating it calls the tool
  hooks `setBrand`/`setIndustry`/`setLogo` so the sidebar (channel, industry, sub, business
  name, logo) all switch to match. New init opts per tool: `channels, setChannel, setBrand,
  setIndustry, setLogo`. Verified E2E (12 checks): identity switch, whatsapp→sms in-tool,
  whatsapp→in-app cross-tool handoff.
- **Auto logos** — `brandMark(name,size)` in `image-system.js` generates a gradient monogram
  logo (SVG data URI) used as every default avatar/app-icon across all tools. For **real**
  brands the AI returns a `domain` and `api/logo.js` (new serverless fn) fetches the real logo
  as a data URI; `ChannelStudioAI.resolveLogo` caches it and `setLogo` applies it, else the
  generated mark shows. **Logo source**: Clearbit's keyless API is shut down — `api/logo.js`
  now uses **Logo.dev** (free *publishable* token in env `LOGODEV_KEY`, 500K/mo) for full
  logos, falling back to **keyless** DuckDuckGo/Google favicons. So real-brand icons work with
  no key; add `LOGODEV_KEY` for crisp logos. Live photos still need `PEXELS_KEY`.

**Done 2026-07-15 (AI image relevance fix):** The AI often omits `imageKeyword`/`imageQuery`
on copy-focused briefs, and the old fallback then used `KW[ctxId()]` — the **sub-industry**
keyword — so a "face cream" brief on the Fashion vertical showed the `clothing` photo. Fixed:
(1) prompt now makes the image **mandatory** and ties `imageQuery` to the **copy's subject**,
explicitly forbidding the brand-category fallback and blanks; (2) new `KWSYN`/`normKw`/`kwFromText`
in `image-system.js` map common subjects onto the ~56 library keys (moisturizer→cosmetics,
jeans→trousers, headphones→earbuds…), with a **two-pass** scan that skips marketing "process"
words (cart, gift, top, stay, sale…) so the real product noun wins; (3) every `applyAI` now
derives the fallback keyword from `imageQuery`→copy→brief (via `kwFromText`) and only uses the
vertical as a last resort — `ai.js` passes the brief through as `apply(msg,{brief})`. Verified
E2E: an AI message with NO image fields + "face cream" copy on the Fashion vertical now resolves
to `cosmetics`, not `clothing`. NOTE: sharp *live* photos still require `PEXELS_KEY` in Vercel.

**Done 2026-07-15 (later session — copy + images + gamification):**
- **In-App Gamification — a new channel** (`game`, owned by the notify tool). Premium dark
  "reward moment" takeovers in a CRED / Cult-UI aesthetic: **Scratch card, Spin the wheel,
  Mystery box, Slot machine** (topbar `#gameSeg`). Each fills the phone screen; **Simulate**
  reveals the win (foil fades, wheel spins to the winning wedge, box lid lifts, reels land
  on 💎) with confetti, a prize pill and CTA. State = `state.game`; render fns `renderGame`/
  `gmScratch`/`gmWheel`/`gmBox`/`gmSlots`; `GAME_ARCH` = 4 per-vertical presets; editor group
  `.chan-game` (+ `#grpWheel` segments, one per line, trailing `*` = winner). The **wheel is
  drawn as inline SVG** (pie-slice `<path>` + `<text>`) — deliberately *not* conic-gradient,
  which html2canvas can't rasterise; accent colours are passed as literal hex into the SVG
  (CSS `var()` won't resolve in a serialised SVG). `game` added to every tool's channel
  dropdown + `nav.js` routing; AI wired via `applyGameAI`.
- **Sharper AI copy** — `api/generate.js` `systemPrompt` rebuilt as a senior-copywriter brief
  (hooks over greetings, tasteful emoji, personalisation, banned-filler list, tone
  benchmarks) + `CHANNEL_VOICE` per-channel notes. Built-in template scaffolding copy in
  messaging (`ARCH`) + notify (`PUSH_ARCH`/`INAPP_ARCH`) elevated to match (removed the
  now-banned "Shop the latest" / "Don't miss out" / "limited time only").
- **Sharper AI images** — the model now returns a precise `imageQuery` (literal 3-6-word
  photo phrase) alongside `imageKeyword`. `api/photo.js` searches that phrase, pulls a
  **15-photo candidate pool**, and scores by alt-text/query overlap + resolution instead of
  taking the first hit; honours `orientation` (portrait for full/image, landscape else) with
  an unconstrained retry on empty. `ai.js` `photoFor(kw,w,h,query)` prefers the live query
  (sharper) over the generic pre-resolved keyword; orientation derived from the slot's w/h.
  All 4 tools' `applyAI` pass `imageQuery`; the dead `m.imageUrl` reads were removed.
- **Hygiene:** verified via Playwright — all channels/tools render, no `pageerror`, template
  counts (6 push/inapp/messaging, 4 game), Simulate reveals, `#gameSeg`/`#grpWheel` visibility,
  push wallpaper-group logic, inapp all 5 types. `syncAppearance` tightened to `channel==='push'`.

**Done:** **all 7 channels** — SMS/RCS/WhatsApp (messaging), Gmail (gmail), Push + In-App +
In-App Gamification (notify). Channel Studio design across all three tools, templates ×
channel × (sub)industry, DIY block builders, Simulate, US locale, digital-aware
confirmations, dark mode removed, real Pexels photos live (56) with illustration fallback,
no-terminal `setup.html` resolver, unified 7-channel dropdown, a **screen recorder** with a
**review studio** (filmstrip trim + WebM/GIF export) in all three tools, touch-orb recording
cursor, and the Gmail desktop reading-pane scroll fix.

**Done 2026-07-15 (this session):**
- **The §11 refactor — all 3 phases shipped** (`channel-studio.css`, `content.js` +
  `image-system.js`, `blocks.js` + `device.js` + `nav.js`). Each tool is now just its
  channel-specific CSS + render fns + state + template archetypes; foundations live once.
- **Notify app backdrop** rebuilt into a realistic, vertical-aware app home (§4).
- **AI generate (Phase 4)** — shared `ai.js` "✨ AI" right-hand panel → `api/generate.js`
  (multi-provider: **Groq** preferred, Gemini fallback; schema-locked, key server-side)
  → per-tool `applyAI()` through the normal template path. Images always resolve via
  `ChannelStudioAI.photoFor` (pre-resolved → live Pexels `api/photo.js` → illustration),
  defaulting to the vertical keyword so a real photo shows even with no `PEXELS_KEY`.
- **UI**: sidebar sections **collapsed by default**, new brand mark + `favicon.svg`,
  header-row polish.
- **Env vars (owner-set, in Vercel):** `GROQ_API_KEY` (recommended) or `GEMINI_API_KEY`
  for AI copy; `PEXELS_KEY` (optional) for live photo lookup of arbitrary AI keywords;
  `LOGODEV_KEY` (optional, a Logo.dev *publishable* `pk_…` token) for real brand logos —
  without it real brands fall back to keyless favicons, made-up brands to the generated
  monogram. All optional — with none set, the core tools are unchanged and the ✨ button
  shows a friendly "add a key" note. (Logo.dev confirmed working in production 2026-07-16.)

**UI conventions (keep consistent):** collapse chevrons are the solid `▼` (rotate −90°
when `.collapsed`; accent-coloured when a group is open); sidebar groups now default
**collapsed** (every `[data-group]` carries an initial `collapsed` class in all 3 tools)
so the sidebar reads as a clean menu of all sections — expand on click; the "Clear &
start blank" reset button uses `.btn.reset` (soft-red) in every tool. Brand mark + tab
favicon = `favicon.svg` (speech-bubble + AI sparkle on an indigo→violet→purple squircle);
the `.brand .mark` inline SVG is the white glyph, the gradient tile comes from CSS.

**DONE (2026-07-15): the §11 refactor — all 3 phases shipped.** The three tools duplicate
~1,000 lines each of the same foundations (design-system CSS, `INDUSTRIES`/`PACKS`,
image system, block builder, device frame + export, dropdown nav). The owner approved a
**phased extraction into shared files** (like `recorder.js`/`images.js` already are),
**staying no-build** (plain `.css`/`.js` via `<link>`/`<script>`, no bundler/framework).

**DONE (2026-07-15): AI generate (Phase 4) + realistic notify app backdrop.**
- **AI generate** — shared `ai.js` injects an **✨ AI** topbar button + a right-docked
  prompt panel (self-contained, injects its own styles, like recorder.js). On Generate it
  POSTs `{channel,brand,industry,brief}` to **`api/generate.js`** (a Vercel serverless fn)
  and hands the returned message to a tiny per-tool `applyAI()` that maps it through the
  SAME path as a built-in template (messaging → `applyTemplate` with a synthetic `mk()`
  msg; notify → `applyTemplate` push/inapp shape; gmail → `applyEmailTemplate` with HTML
  built from `eWrap/eBrand/eBtn/eHeroImg`). `api/generate.js` is **multi-provider**:
  **Groq** (preferred when `GROQ_API_KEY` is set — roomier free tier; JSON-mode + the
  schema rendered to a field list via `schemaToText`) or **Gemini** (`GEMINI_API_KEY`;
  native `responseSchema`). `AI_PROVIDER` overrides; each returns ONE schema-valid message
  — no tools, no browsing, no conversation. Keys are server-side only. Anti-abuse:
  channel/type restricted to enums, 500-char brief cap,
  best-effort per-IP rate limit, origin check, capped output tokens, response validation;
  provider free-tier quota is the hard backstop. Robustness: `api/generate.js` tries a few
  free models in order (2.0-flash → 2.5-flash → 2.0-flash-lite; `GEMINI_MODEL` override
  first) so a per-model 429/404 falls through, and it surfaces Google's real error
  (per-day cap / per-minute / bad key) instead of a generic message.
  **Images (AI):** the AI now returns a free-text `imageKeyword` (not enum-locked).
  `ai.js resolvePhoto()` uses it: pre-resolved `images.js` URL if present, else a **live
  Pexels lookup via `api/photo.js`** (`PEXELS_KEY` server-side, cached per-keyword in the
  visitor's `localStorage`), else the illustration. `applyAI()` uses `message.imageUrl ||
  photo(keyword)`. So the AI can name any concrete subject and still get a real photo; with
  no `PEXELS_KEY` set it degrades to illustrations (nothing breaks). Verified end-to-end
  with mocked `/api/generate` + `/api/photo` across all 4 channel families (panel opens →
  generate → message renders in `#capture`, live photo used for an unresolved keyword,
  graceful illustration fallback when the key is absent). **Images always appear:** each
  `applyAI` is async and resolves via `ChannelStudioAI.photoFor(kw)` (pre-resolved → live
  Pexels → illustration); when the model omits `imageKeyword` it defaults to the vertical
  keyword `KW[ctxId()]`, which IS pre-resolved → a real photo even with no `PEXELS_KEY`
  set. The prompt also nudges the model to always set `imageKeyword` and prefer image-
  bearing message types for visual campaigns. Real Gemini/Pexels calls only run
  on the live site (hosts firewalled in-sandbox). Setup is 1–2 env vars in Vercel (README
  "Generate with AI" + "AI photos"). `#capture`/editor unchanged vs pre-AI (only the topbar
  gains the ✨ button; the panel is hidden until opened).
- **Notify app backdrop** — see §4: replaced the grey skeleton with a realistic
  vertical-aware app home.

**Smaller cleanups to fold in:** Gmail state still has a stale `"Social Development Bank"`
default (harmless — overwritten by the first template on load, but should become a generic
brand). The Gmail email body could later become the same block builder. Review the
`family` photo (telecom) per the "US, no Indians" ask. AI panel: could add durable rate
limiting (Vercel KV) and an optional real image-gen source later.

**Cross-repo note:** This project was first built by mistake inside
`zaidassadi94/SamuhaWorldCup` on branch `claude/gmail-preview-tool-2pg33e`, then moved
here. That branch was reset to match `main` (content removed) but the empty branch
**ref still exists** (the git proxy blocks ref deletion) — harmless; the owner can
delete it via GitHub's UI. Nothing about SamuhaWorldCup is relevant to this repo.

---

## 11. Refactor plan (agreed 2026-07-15 — phased, no-build)

**Progress: Phase 1 DONE (2026-07-15).** `channel-studio.css` exists at the repo root
and all three tools link it before their inline `<style>` (which now holds only
channel-specific rules). Gmail was renamed onto the canonical convention (`--text`→
`--ink`, `--border`→`--line`, `.group-head/.group-body`→`.ghead/.gbody`, `.field`→`.f`,
`.logo-preview`→`.logo-prev`, `.btn-mini`→`.link-btn`, `.seg2`→`.seg`) and its
sidebar/topbar converged to the shared design. Intentional per-tool overrides kept
inline: notify moves `.notch`/`.punch` down over the wallpaper (+`.logo-prev img`
cover, brighter dark home-ind); messaging keeps its `.sim-on` border-radius + dark
stage; gmail keeps its stage gradient (so exports stay pixel-identical), its own
device frames, `#capture{font-feature-settings:normal}` and an explicit statusbar
color so the design system never leaks into exported mockups. Gotcha learned:
`backdrop-filter` on the topbar flips Chromium's text antialiasing for the whole
page — pixel-diffs must replicate compositing+geometry before comparing.

**Progress: Phase 2 DONE (2026-07-15).** `content.js` (INDUSTRIES, cap, PACKS, CONFIRM)
and `image-system.js` (escXml, hueOf, ILLUS, ILMAP, illusFor, tile, photo, ePhoto,
phGrad, phGray, KW, IMGKW, kwFor) now live at the repo root, loaded right after
`images.js` (which stays data-only). Channel-variant copy lives INSIDE each PACKS/
CONFIRM entry: base fields + `flow{}` = messaging; `push:{…}` = notify overrides
(its one-line flows + shorter confirm lines); `email:{…}` = gmail overrides (from/
accent/products/total/otpUse + a few offer/code/url edits). Each tool merges its own
view with ~1 line of glue (notify: `Object.assign({},base,base.push||{})`; gmail
builds `EPACKS` the same way; messaging reads base fields directly). Verified with
content fingerprints — a hash of `#capture` innerHTML for every channel × combo ×
template (540 total) before/after: notify + gmail 100% identical; messaging has 4
intended diffs = the §10 IMGKW drift-bug fix ('Live comedy'/'Tech' carousel cards in
media/ott + media/news now resolve to microphone/laptop instead of a generic box).
`setup.html` + `resolve-images.js` queries gained `stockmarket` (kwFor('Business'));
'product' is deliberately query-less (generic placeholder → illustration by design).

**Progress: Phase 3 DONE (2026-07-15).** `blocks.js` (splitResp/parse*/serRows/
parseRows/pickImage/imageField/buildBlocks — buildBlocks now takes `onChange` since
tools' render() lives inside their IIFEs; messaging passes `render`), `device.js`
(fitDevice + resize listener, statusBarHTML(device,lt) + the 3 status icons —
messaging/notify keep a 1-line `statusBar` glue; gmail keeps its own iPhone statusbar
— and captureDevice({background,toast,h2c}) wrapping html2canvas; gmail passes its
iframe-swap `onclone` via h2c), `nav.js` (initChannelNav(localChannels,onLocal) —
messaging local=[whatsapp,rcs,sms], notify local=[push] (inapp reloads with ?channel=
like before), gmail local=[gmail]). Verified: 540 content fingerprints + all
screenshots identical (modulo known jitter), export behavior identical under a stubbed
html2canvas (same options/transform/toast), block-builder add/edit/remove + imageField
interactions green in both tools. The refactor is COMPLETE — all three phases live.

**Why:** the 3 tools each re-implement the same foundations, so a change (industry,
photo keyword, button style) means editing 3 files, and they've **drifted** (chevrons,
Gmail's missing clear button, stale defaults). Goal: one source of truth per concern.

**Hard constraints (owner-approved):** stay **no-build** — shared plain `.css`/`.js`
loaded via `<link>`/`<script>`, **no bundler, no framework, no npm step**. URLs, deploy
(push `main` → Vercel), look, and behavior must stay **identical**. Do it **in phases,
one tool at a time, verifying pixel-identical rendering** (screenshot `#capture` + the
sidebar before/after and compare) and committing per step. Push to `main` (owner's
workflow — fast-forward from the working branch; they've said "push to main").

**Key finding — the tools diverged in names, not just values.** Canonical = the
messaging/notify convention (2 of 3 already use it). Gmail must be renamed onto it:
- tokens: gmail `--text`→`--ink`, `--muted`→`--muted` (ok), `--border`→`--line`,
  `--panel-2`→`--panel-2` (ok), `--accent`→`--accent` (ok; gmail accent is Gmail-blue
  `#1a73e8` for its *preview* — keep those under scoped `--g-*`/`--gm-*`, only the
  **sidebar/chrome** tokens are shared).
- classes: gmail `.group-head`→`.ghead`, `.group-body`→`.gbody`, `.field`→`.f`,
  `.btn-mini`→`.link-btn`, `.seg2`→`.seg`, etc. (rename in gmail markup **and** its JS
  selectors). Also reconcile small drift when extracting: `.notch` top (messaging `0`
  vs notify `11px`), `.sim-on .clickable` radius, `.home-ind.dk` opacity — pick one.

**Phase 1 — `channel-studio.css`** (the shared design system: `:root` sidebar tokens,
`.app` grid, `.editor/.brand/.ctx/.sel-wrap/select.sel`, `.group/.ghead/.chev/.gbody`,
`.f`+inputs/`.toggle-row/.switch`, `.drop/.logo-prev/.link-btn`, `.tpl*`, `.btn`(+`.reset`),
`.blk*` block-builder, `.imgf`, `.stage-wrap/.topbar/.seg/.topcap`, `.stage`, `.phone/
.screen/.notch/.punch/.statusbar/.home-ind`, `.clickable/.sim-badge`, `.toast`, mobile
media query). Each tool keeps ONLY its channel-specific styles inline (wa/gm/ios chat;
pn-ios/pn-and/ls/appbd/ia/shade; gmail `.gm*`/`.browser`/`.iphone`). Migrate messaging →
notify → gmail, screenshot-diff each.

**Phase 2 — `content.js`** (`INDUSTRIES`, `PACKS`, `CONFIRM`, `ctxId()`, `ecx()`, `cap`)
one source of truth; gmail's email packs either merge in or extend it. **`image-system.js`**
(`hueOf`, `escXml`, `tile`, `ILLUS`, `ILMAP`, `illusFor`, `photo`, `phGrad`, `phGray`,
`KW`, `IMGKW`, `kwFor`; gmail's `ePhoto` folds in). `images.js` stays **data only**. The
`IMGKW`/`KW` maps then live in ONE place — keep `setup.html` + `resolve-images.js` query
maps in sync with it (that sync is the whole point).

**Phase 3 — `blocks.js`** (`serRows`/`parseRows`/`imageField`/`buildBlocks`), **`device.js`**
(`fitDevice`, `capture()`/html2canvas export, copy, statusBar icons), **`nav.js`** (channel
dropdown population + cross-tool routing). After this each tool ≈ its render functions +
state + template archetypes only.

**Load order per tool** (scripts, after `channel-studio.css` `<link>`): `images.js`,
`image-system.js`, `content.js`, `blocks.js`, `device.js`, `gif-encoder.js`, `recorder.js`,
`nav.js`, then the tool's own inline `<script>`. Keep the `onerror` stub on `images.js`.

**Verify each step** with the Playwright harness (§8): no `pageerror`, `#capture` renders,
6 templates × 15 combos, dropdown routes correctly, Record button present, and a
before/after screenshot of `#capture` + `.editor` that must match. Commit per tool/phase.
