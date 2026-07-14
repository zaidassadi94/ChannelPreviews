# Channel Studio — Handoff / Full Context

Last updated: 2026-07-14. Repo: **`zaidassadi94/ChannelPreviews`** (branch `main`, hosted on **Vercel**, static — no build step).

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
images.js                       # window.__PXIMG = { keyword: pexelsCdnUrl }  (the resolved real photos)
messaging-preview-tool/index.html   # SMS + RCS + WhatsApp  (the main tool)
gmail-preview-tool/index.html       # Gmail (inbox + open-email)  (email tool)
README.md                       # user-facing overview + photo setup
HANDOFF.md                      # this file
```

Both tools are ~single-file apps (~100KB messaging, ~75KB gmail). They are edited
heavily via `python3` string-replacement in Bash (the files are large; targeted
replaces + asserts are the established pattern). Verify changes by driving them in
headless Chromium via the global Playwright at
`/opt/node22/lib/node_modules/playwright` (import as CJS default; see §9).

---

## 3. Navigation & channels

- **Channel is a dropdown** in each tool's sidebar: **Gmail · WhatsApp · RCS · SMS**.
  Selecting a channel that lives in the *other* tool navigates there:
  - messaging → pick "Gmail" → `location.href='../gmail-preview-tool/index.html'`
  - gmail → pick WhatsApp/RCS/SMS → `../messaging-preview-tool/index.html?channel=xxx`
- There is **one top bar** (an earlier hub-iframe wrapper caused a duplicated top bar
  and was removed). Root `index.html` just redirects into the messaging tool.
- `?channel=sms|rcs|whatsapp` deep-links the messaging tool to a channel.

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
  cost regardless of traffic. Pexels images are CORS-safe (export works). No API key
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

**Done:** all 4 channels, Channel Studio design across both tools, 6 templates ×
channel × (sub)industry, DIY block builders, Simulate/branching, US locale,
digital-aware confirmations, dark mode removed, real Pexels photos live (56) with
illustration fallback, no-terminal `setup.html` resolver.

**Open / possible next (not started):**
- Gmail email body could become the same **drag-and-drop block builder** (currently
  sender/subject fields + HTML upload/paste/plain + the 6 templates).
- Review the `family` photo (telecom) per the demographic ask; swap if needed.
- Optional: more channels (Instagram DM, Viber), more templates, `orientation`/`size`
  knobs for the resolver, or pinning exact photo IDs for specific products.
- README lists WhatsApp "light/dark" in a table row — dark mode is gone; tidy if
  touched.

**Cross-repo note:** This project was first built by mistake inside
`zaidassadi94/SamuhaWorldCup` on branch `claude/gmail-preview-tool-2pg33e`, then moved
here. That branch was reset to match `main` (content removed) but the empty branch
**ref still exists** (the git proxy blocks ref deletion) — harmless; the owner can
delete it via GitHub's UI. Nothing about SamuhaWorldCup is relevant to this repo.
