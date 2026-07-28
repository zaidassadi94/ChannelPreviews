# Channel Studio (unified app) — HANDOFF

This is the working note for continuing the **`studio/`** rebuild.

> **⚠️ New session: read the repo-root `HANDOVER.md` and `deferred.md` FIRST** — they carry
> the *current* state (the AI-panel + Gmail + images work) and all parked / to-discuss items.
> This file is the deeper architecture reference + session logs.

## TL;DR
We are consolidating six standalone HTML tools (at the repo root) into ONE
React + Vite + TypeScript single-page app in `studio/`, where switching channels
swaps only the sidebar + preview (no page reload). **ALL 13 channels are now
migrated and verified** — WhatsApp (the original reference) plus RCS, SMS, Push,
In-App, Gamification, Gmail, Onsite Messaging, Instagram Ads, Facebook Ads, and the two
newest MoEngage channels **Web Push** (browser notification, DesktopFrame) and **Cards /
App Inbox** (in-app card feed, PhoneFrame).
Each has its render (channel-owned frame → `PhoneFrame`/`DesktopFrame`, scaled by
`StageFit`), section panels, and per-vertical templates. No "Migrating" stubs
remain. **All the shared shell features are now ported too** — Export PNG, Copy,
Record (WebM/GIF + trim studio), the ✨ AI panel, and real photos/logos. The app is
at parity with the six legacy tools.

**Promotion is wired.** A `vercel.json` at the repo root flips the live deploy to
`studio/dist` (exact settings in §5); the owner just needs to trigger a redeploy on Vercel.
On top of that, a round of **live-testing UX polish** shipped: collapsible (Canva-style)
editor panel, real colored channel icons in the picker, a brand favicon + head meta,
**hover-only Simulate** (no persistent ring on any channel), realistic WhatsApp footers,
an opt-in-button export fix, logo reset on template apply, Gmail opening on the email, and
AI jumping to the content editor after generating. See the **Session logs** at the end.

- **Branch:** originally `claude/channel-ux-audit-vw4qf6`; the shared-shell port + UX polish
  continued on `claude/studio-shared-shell-port-jozeu8` (based on it). **The owner now works
  trunk-based** (see root `CLAUDE.md`): finished work is fast-forwarded onto `main` and pushed.
  `main`, `origin/main`, and this branch are currently in sync at the latest commit. (An
  earlier draft of this doc said "don't push to main yet" — that has been superseded.)
- **Commit footer:** end messages with the Co-Authored-By + Claude-Session lines
  (see previous commits). Don't put the model id anywhere in the repo.
- **Live preview link (keep it stable):** https://claude.ai/code/artifact/d3da92cb-53ea-4957-b406-ee0255c54cbc
  To refresh it from a NEW chat, call the Artifact tool with
  `url: "<that link>"` and the rebuilt single-file HTML (see "Preview workflow").

## Run / verify
```
cd studio
npm install         # once
npm run dev         # local dev (hot reload)
npm run build       # tsc --noEmit && vite build  -> must stay GREEN
npm run preview -- --port 4173   # serve the prod build for smoke tests
```
Playwright is available via `NODE_PATH=/opt/node22/lib/node_modules` and
`PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers` (Chromium pre-installed). Smoke-test
by loading `http://localhost:4173/`, switching channels/sections, toggling
Simulate, and asserting `no console errors`. (See the git history for the exact
node -e Playwright snippets used.)

## Architecture (where things live)
```
src/
  main.tsx, App.tsx            entry; App renders <AppShell/> + <Toaster/>
  styles/global.css            ALL shared styling: tokens, top bar, section rail,
                               panel, form controls, device frame, simulate, toast
  store/
    useStudio.ts               Zustand: shared context (channel, section, device,
                               industry/sub, brand, sim, dateChip) + the WhatsApp
                               slice (wa: messages/played/encNotice/typing) + actions
    useToast.ts                toast store
  content/model.ts             INDUSTRIES, PACKS, CONFIRM (typed). NOTE: only the
                               WhatsApp-relevant PACK fields were ported. The full
                               data lives in the root `../content.js` — port more
                               fields (email/push overrides, etc.) as needed.
  lib/
    util.ts                    phImg (SVG placeholder), brandMark, avColor, hueOf,
                               genOtp (random OTP — never hardcode), parseButtons
    format.tsx                 formatText(): *bold* _italic_ links + \n -> React nodes
    icons.tsx                  Icon record (SVGs) + section icons + btnIcon()
  shell/
    AppShell.tsx               layout: <TopBar/> then .body grid [rail|panel|stage]
    TopBar.tsx                 brand, <ChannelPicker/>, industry+sub selects, device
                               toggle, Simulate/Reset, Copy, Export (Copy/Export are
                               STUBBED -> toast)
    ChannelPicker.tsx          grouped channel dropdown (the "channel selection")
    SectionNav.tsx             <SectionRail/> (thin left rail = the active channel's
                               sections) + <SectionPanel/> (shows ONE section — master/detail)
    StageFit.tsx               scales WHATEVER frame a channel renders down to fit the
                               stage (ResizeObserver). Frames are channel-owned.
    PhoneFrame.tsx             phone device chrome (notch, status bar, home indicator).
                               A channel Preview wraps its screen in this. For desktop/
                               web channels (Gmail desktop, OSM) add a DesktopFrame here
                               following the same shape; ad channels can render their own.
    StatusBar.tsx              iOS/Android status bar
    Toaster.tsx, Stub.tsx
  channels/
    registry.tsx               CHANNELS[] — one entry per channel: {id,label,icon,
                               group, sections?, Preview?}. SectionDef type lives here.
    whatsapp/                  <-- THE REFERENCE CHANNEL, copy this shape
      WhatsAppPreview.tsx      the phone-screen render (+ auto-apply first template
                               on industry/sub change, via a useEffect on ctxId)
      panels.tsx               the section panels (Templates/Chat/Sender/Context)
                               + `whatsappSections` (SectionDef[]) + MsgCard editor
      templates.ts             WA_TEMPLATES + applyWATemplate() (imperative action
                               usable from a click or a mount effect)
      whatsapp.css             channel-specific styles (imported by the Preview)
```

Data flow: components read/write the Zustand store with selectors
(`useStudio(s => s.x)`); the shell picks the active channel from `registry` and
renders its `sections` (rail+panel) and `Preview` (in the shared PhoneFrame).

## Recipe: migrate a channel (repeat per channel)
The channel designs already exist in the root tools — you're re-plumbing, not
redrawing. For channel `X`:

1. **State.** If X needs its own message model, add a typed slice to
   `store/useStudio.ts` (mirror the `wa` slice + its actions). Channels that share
   the messaging model (RCS, SMS) can reuse/extend it.
2. **Preview.** `channels/X/XPreview.tsx` — port the render from the root tool
   (e.g. `messaging-preview-tool/index.html` has WhatsApp/RCS/SMS; `gmail-…`,
   `notify-…`, `osm-…`, `social-…`, `facebook-…` for the rest). Use `formatText`,
   `phImg`, `brandMark`, `Icon`. Handle Simulate via store actions. Import an
   `X.css` for channel styles. **Wrap the screen in a frame the channel owns** —
   `<PhoneFrame>` for phone channels, or a new `<DesktopFrame>` for Gmail-desktop /
   OSM-web (`AppShell` scales whatever you render via `StageFit`).
3. **Sections.** `channels/X/panels.tsx` — build the editor as section-panel
   components and export `const xSections: SectionDef[] = [...]`.
4. **Templates.** `channels/X/templates.ts` (if templated) — `X_TEMPLATES` +
   `applyXTemplate()`; auto-apply the first on `ctxId` change from the Preview.
5. **Register.** In `registry.tsx`, set the channel's `sections` + `Preview`.
6. **Verify.** `npm run build` green, Playwright smoke test, screenshot.

## Shared features — ✅ ALL PORTED
All five are **shell-level** (wire once, every channel benefits). **They are now done**
— the notes below are kept as a reference to what shipped and where it lives. What
landed, per feature:
1. **Export PNG + Copy** → `lib/useCapture.ts` (html2canvas bundled dep; neutralises the
   `<StageFit>` ancestor transform; wired to the TopBar Copy/Export buttons).
2. **Record** → `public/recorder.js` + `public/gif-encoder.js` loaded via `index.html`,
   attached to a childless TopBar button by `lib/useRecorder.ts`.
3. **AI panel** → `shell/AiPanel.tsx` + `store/useAiPanel.ts` + `lib/detectChannel.ts`;
   per-channel adapters in `lib/applyAi.ts` map the schema message onto each store slice.
   A studio gotcha was solved: the preview auto-first-template effect (now the shared
   `lib/useAutoTemplate.ts`) checks an `aiSuppressCtx` store flag so it can't clobber AI
   content when the AI switches the industry — deterministic, order-independent.
4. **Real images + logos** → `lib/media.ts` (`photoFor` / `resolveBrandLogo` over
   `/api/photo` + `/api/logo`) with `content/pximg.ts` (pre-resolved photos + synonyms).
   `phImg` stays the offline fallback; real (remote) URLs are used ONLY on the network/AI
   path (`applyAI`, which never runs in the offline artifact), so the core render path
   stays self-contained.
5. **Ship it** → see §5 for the exact Vercel settings.

Shared plumbing you'll add first:
- **`#capture`** — every frame already sets `id="capture"` (`PhoneFrame`,
  `DesktopFrame`). That's the capture/record/crop target. One caveat: `<StageFit>`
  puts its `scale(...)` on `.stage-fit` (the **parent**), NOT on `#capture`, so
  capture must neutralise the *ancestor* transform, not the node's own (the root's
  `captureDevice` reset the node transform because the root scaled the node itself).
  Simplest: in `useCapture()`, read `.stage-fit` transform, set it to `none`, capture,
  restore — OR clone `#capture` into an off-screen unscaled container and rasterise that.
- **`useToast`** already exists (`store/useToast.ts`) — reuse for all status toasts.
- **Network reality:** Export/Record use browser APIs (no server); AI + real images/
  logos hit `/api/*` (Vercel serverless, at repo root `api/`). NONE of these run inside
  the self-contained **artifact** preview (CSP blocks external hosts + there's no
  `/api`), so they must degrade to today's behaviour there. They light up on the
  Vercel deploy. Keep `phImg` placeholders as the permanent offline fallback.

### 1. Export PNG + Copy  (`TopBar.tsx` buttons are stubbed)
- **Root:** `device.js` → `captureDevice({background,toast,h2c})` = `html2canvas(#capture,
  {backgroundColor, scale:2, useCORS:true, allowTaint:false})`, after resetting the fit
  transform and hiding `.sim-badge` + toggling off `.sim-on`. Export = `canvas.toDataURL
  ('image/png')` → `<a download>`; Copy = `canvas.toBlob` → `navigator.clipboard.write
  ([new ClipboardItem({'image/png':blob})])`.
- **Port:** add `html2canvas` (npm dep — it bundles, so it also works in the artifact,
  unlike a CDN `<script>`). New `lib/useCapture.ts` doing the transform-neutralise
  above + the export/copy handlers; wire the two TopBar buttons. Filename e.g.
  `${channel}-${industry}-${device}.png`.
- **Gotchas (already solved in the root — keep them):** html2canvas 1.4.1 throws on
  `color-mix()` → the game uses `rgba(var(--gm-accent-rgb),…)` already, so it's safe.
  Gmail renders the email inline (no iframe in the studio) so there's nothing to inline
  for capture (the root had to inline iframe images — N/A here). Remote images taint the
  canvas unless CORS-clean; the studio uses `data:` `phImg` by default, so capture is
  clean offline; only real Pexels photos (feature 4) need `useCORS`.

### 2. Record (WebM / GIF) + review studio  (no TopBar button yet — add one)
- **Root:** `recorder.js` → `ChannelStudioRecorder.init({button, getEl:()=>#capture,
  filename, toast})`. Chromium Region Capture (`getDisplayMedia({preferCurrentTab:true})`
  → `CropTarget.fromElement(#capture)` → `track.cropTo()` → `MediaRecorder`), a touch-orb
  cursor + click ripple gated by a `body.cs-rec-live` class, and a **review studio** on
  stop (filmstrip trim + export WebM/GIF). Needs `gif-encoder.js` (vendored gifenc)
  loaded first.
- **Port:** it's self-contained vanilla JS that injects its own styles + DOM. Two paths:
  (a) fastest — drop `recorder.js`+`gif-encoder.js` into `studio/public/`, load via
  `<script>` in `index.html`, add a Record button to `TopBar` and call
  `ChannelStudioRecorder.init({...})` from a `useEffect`; or (b) rewrite as a React/TS
  shell component. (a) matches how the root already treats it as a library. Region Capture
  is desktop-Chromium only; it degrades with a toast elsewhere. Note: the recorder's
  clean-capture CSS hides `.sim-badge`/`.toast` and expects the persistent `#capture`
  node — our frames already keep `#capture` stable across re-renders (React reconciles
  it), so mid-recording template/channel switches won't drop the crop.

### 3. AI generate panel  (`TopBar` "AI" button — add it)
- **Root:** `ai.js` → `ChannelStudioAI.init({button, getContext:()=>({channel,brand,
  industry}), apply, toast, channels, setChannel, setBrand, setIndustry, setLogo})`.
  Injects a right-hand prompt panel; on Generate POSTs `{channel,brand,industry,brief}`
  to `/api/generate` and calls the tool's `apply(msg,{brief})`. It also detects a
  channel named in the brief (`detectChannel`) and, cross-tool, stashes the brief in
  `sessionStorage['cs-ai-handoff']` + navigates — in the SPA there's no navigation, so
  `setChannel(ch)` in-app instead (simpler than the root).
- **Port:** the studio is ONE app, so this gets much simpler than the 6-tool version.
  Write a shell `AiPanel.tsx` (port the panel markup/styles from `ai.js injectStyles`)
  that reads `getContext` from the store and, per channel, calls that channel's
  `apply*(msg)` — i.e. each channel exports an `applyAI(msg)` that maps the schema
  message onto its store slice (mirror the root tools' `applyAI` for the mapping of
  fields → state; every channel's shape is already in its `templates.ts`). `setChannel/
  setBrand/setIndustry/setLogo` are just store setters. Images inside `applyAI` resolve
  via feature 4's `photoFor`.
- **Server:** `api/generate.js` is multi-provider (Groq preferred via `GROQ_API_KEY`,
  else Gemini via `GEMINI_API_KEY`), schema-locked, one message, key server-side. It
  already knows all channels (`CHANNELS`, `schemaFor`, `CHANNEL_VOICE`) — no server change
  needed unless a channel's schema drifted. Returns a validated message `{ type, …, brand,
  industry, domain?, imageKeyword?, imageQuery? }`.

### 4. Real images + logos  (offline `phImg` stays the fallback)
- **Client (root `ai.js`, keep the same fns):** `photoFor(kw,w,h,query)` — precedence
  live `query` → pre-resolved `images.js` keyword → live keyword → illustration; hits
  `/api/photo?q=&orientation=` (Pexels), memo+localStorage cached, returns a URL or null.
  `resolveBrandLogo({brief,domain,brand})` → `/api/logo?domain=` (Logo.dev → DuckDuckGo/
  Google favicon), returns a data:/URL or null. Response shape for both: `{ok:true,url}`
  or `{ok:false,reason}`.
- **Port:** a `lib/media.ts` with `photoFor`/`resolveBrandLogo` (thin fetch wrappers +
  cache). Then let each channel's image resolution prefer a real URL when one comes back,
  falling back to today's `phImg(...)`. Optionally port `images.js` (`window.__PXIMG`, the
  56 pre-resolved Pexels URLs) as a static `content/pximg.ts` so common keywords show real
  photos even with no `PEXELS_KEY`. Keep `phImg` as the guaranteed-offline default so the
  artifact preview and any keyless deploy stay unbroken.
- **Env (Vercel, owner sets):** `GROQ_API_KEY` **or** `GEMINI_API_KEY` (AI copy);
  `PEXELS_KEY` (live photos — optional); `LOGODEV_KEY` (crisp logos — optional, favicons
  work keyless). All optional; with none set the core app is unchanged.

### 5. Ship it — exact Vercel settings to promote `studio/`
The studio needs a build (`npm run build` → serve `dist/`), and the `api/` serverless
functions must keep living at the **repo root** (they're shared with the legacy tools).

**Key gotcha:** do NOT set Vercel's *Root Directory* to `studio`. Vercel only detects the
`api/` folder that sits at the deployment root, so if the root is `studio/` the functions
(`/api/generate`, `/api/photo`, `/api/logo`) silently stop deploying and AI/photos/logos
break. Keep the Root Directory at the repo root and point the *build* at `studio/`.

**Vercel → Project → Settings → Build & Development Settings:**
| Setting | Value |
| --- | --- |
| Root Directory | *(leave as the repository root — do not set `studio`)* |
| Framework Preset | Other (or Vite) |
| Install Command | `npm install --prefix studio` |
| Build Command | `npm run build --prefix studio` |
| Output Directory | `studio/dist` |

`api/` at the repo root is auto-detected as Node serverless functions — nothing to
configure. **Environment Variables** (all optional): `GROQ_API_KEY` **or**
`GEMINI_API_KEY` (AI copy), `PEXELS_KEY` (live photos), `LOGODEV_KEY` (crisp logos).

Equivalent as a committed `vercel.json` at the **repo root** (drop-in alternative to the
dashboard fields — add it only when you're ready to flip the deploy from the legacy root
tools to the studio, since it changes what the site serves):
```json
{
  "installCommand": "npm install --prefix studio",
  "buildCommand": "npm run prefetch:photos --prefix studio && npm run build --prefix studio",
  "outputDirectory": "studio/dist"
}
```
(A committed `vercel.json` with exactly this now lives at the repo root.) The build runs
`prefetch:photos` first — `scripts/prefetch-photos.mjs` downloads the curated Pexels
photos (no key needed) into `src/content/photos.ts` so template mockups ship **real,
stored** photos with zero runtime fetches. It's fail-safe: if the harvest can't reach
Pexels it writes an empty map and the build continues, and `tphoto()` falls back to the
gradient placeholder. To bake the photos into the **offline artifact preview** too, run
`npm run prefetch:photos` once on any machine that can reach Pexels and commit the
generated `src/content/photos.ts`.
After promotion the root `index.html`/`*-preview-tool/` static tools are no longer
served (the output becomes `studio/dist`); the `api/` functions are unaffected. The
self-contained artifact preview (§Preview workflow) keeps working regardless, since it
never depends on `/api` or remote hosts.

## Conventions / gotchas
- **TypeScript strict** + `noUnusedLocals`; keep `npm run build` green.
- **White-label:** no "MoEngage", no real client names/campaigns, no personal
  names. Use the fictional demo brands (Nova, Meridian, Streamly, SkyHigh,
  QuickBite, LearnSphere, PixelForge, ConnectTel, GlowLab), **American** names,
  **dollar** amounts. OTPs are randomized via `genOtp()` — never hardcode.
- **Simulate cue is hover-only (global):** Simulate no longer draws a persistent ring on
  every `.clickable` at rest — that looked wrong on already-styled CTAs (e.g. Instagram
  "Shop Now"). The cue now appears **only on hover** (one rule in `global.css`), so buttons
  stay clean at rest on every channel. WhatsApp CTAs stay fully clean via their existing
  `.sim-on .wa-cta` override in `whatsapp.css` (owner feedback: they must not change at all).
  If the owner ever wants *no* cue whatsoever (not even on hover, exactly like WhatsApp),
  that's a one-line follow-up.
- **Keep it self-contained** so the artifact preview keeps working: inline assets,
  no external fetches in the core render path (network features degrade gracefully).
- The **section rail is per-channel** (from `registry`); the **channel dropdown**
  is the shell. Don't move channel selection back into a rail.

## Preview workflow (refresh the SAME shareable link)
```
cd studio && npm run build          # -> dist/index.html + dist/assets/*.{js,css}
```
Then inline the built CSS+JS into ONE body-only HTML file (the Artifact wrapper
supplies `<!doctype>/<head>/<body>`, so emit only `<style>` + `<div id="root">` +
`<script type="module">`). Working node inliner (reads dist, writes one file):
```js
import { readFileSync, writeFileSync } from 'fs'; import { join } from 'path'
const d='dist', h=readFileSync(join(d,'index.html'),'utf8')
const js=h.match(/src="([^"]*\.js)"/)[1], css=h.match(/href="([^"]*\.css)"/)[1]
writeFileSync('channel-studio.html',
  `<style>\n${readFileSync(join(d,js.replace(/^\//,'')),'utf8')}\n</style>\n`+
  `<div id="root"></div>\n<script type="module">\n${readFileSync(join(d,css.replace(/^\//,'')),'utf8')}\n</script>`)
// NOTE: swap js/css into the right tags — css goes in <style>, js in <script>.
```
Then call the **Artifact** tool with `url:"https://claude.ai/code/artifact/d3da92cb-53ea-4957-b406-ee0255c54cbc"`,
`favicon:"💬"`, title `Channel Studio — unified app (preview)`, `file_path` = the inlined
HTML. If it 409s ("hasn't viewed the latest version"), the earlier version is just an
older auto-generated build of the same app — `force:true` is the right call to refresh it
(the owner wants this link kept current). Verify the standalone file first by loading it
via `file://` in Playwright (inline module scripts run there): assert `.app` mounts and a
channel switch works, zero console errors. The app is fully self-contained (all imagery is
`phImg` data-URIs, no external fetch in the core path) so it runs inside the artifact CSP.

## Plan: port ALL remaining channels in one pass — ✅ DONE
Every channel is migrated. How the code is organised now:
- **content/model.ts** — all 15 content packs (every field incl. push/email overrides),
  full CONFIRM, `emailPackFor`/`pushFlowFor`/`resolveIndustry` helpers.
- **store/useStudio.ts** — shared context + one slice per engine: `wa` (WhatsApp),
  generic `msg` keyed by channel (RCS/SMS), `notify` (push/inapp/appBg/game), `gmail`,
  `osm`, `ig`, `fb`. Each with typed actions.
- **shell** — `PhoneFrame` (now supports `bare` for full-screen surfaces + a `badge`),
  new `DesktopFrame` (browser chrome, shared by Gmail-desktop + OSM), `StageFit`.
- **channels/** — one folder per channel (`Preview.tsx` + `panels.tsx` + `templates.ts`
  + `*.css`). Shared bits: `channels/messaging/screen.tsx` (Google/iOS Messages for
  RCS+SMS), `channels/notify/shared.tsx` (AppIcon/AppBackdrop/InappBackdrop/wallBg).
- **CSS collision notes:** the messaging Google-Messages uses `.gm*`; the notify
  gamification was renamed `.gz*` and the Gmail root `.gm`→`.gml` to avoid clashing.
  Notification card text is `.body` — pinned to `display:block` (it inherits the shell
  layout's `.body{display:grid}` otherwise).

### What's left — ✅ nothing (shared features all shipped)
1. **Export PNG + Copy** — ✅ `lib/useCapture.ts`, wired to the TopBar buttons.
2. **Record** (webm/gif) — ✅ `public/recorder.js` + `public/gif-encoder.js` via
   `lib/useRecorder.ts` + a TopBar Record button.
3. **AI panel** — ✅ `shell/AiPanel.tsx` → `/api/generate`; adapters in `lib/applyAi.ts`.
4. **Real images / logos** — ✅ `lib/media.ts` + `content/pximg.ts`; `phImg` stays the
   offline fallback.
The one remaining human step is **promoting `studio/` on Vercel** (exact settings in §5;
the owner handles Vercel). Keep `npm run build` GREEN + smoke-test per change.

## Kickoff prompt for the next session (paste this)
> **Project.** Channel Studio — a React + Vite + TypeScript single-page app in `studio/` (repo
> `zaidassadi94/ChannelPreviews`) that renders pixel-accurate marketing-channel mockups. **13
> channels** share one shell (top bar + per-channel section rail + device frame); switching
> channels swaps only the sidebar + preview, no page reload. Shared features are all wired:
> Export PNG / Copy, screen Record (WebM/GIF + trim studio), a ✨ AI generate panel
> (`/api/generate`), and real photos/logos (`/api/photo`, `/api/logo`). A committed `vercel.json`
> at the repo root promotes `studio/dist` as the live deploy while the shared `api/` serverless
> functions stay at the repo root. A full round of UX polish shipped (collapsible Canva-style
> panel, real colored channel icons, favicon, hover-only Simulate, realistic WhatsApp footers).
>
> **Read first (in order).** Repo-root **`HANDOVER.md`** (current state — the AI-panel + Gmail +
> images work, env vars, where the code lives) and **`deferred.md`** (parked / to-discuss). Then
> this file (`studio/HANDOFF.md`) for architecture, the per-channel recipe, gotchas, and session
> logs; then `studio/README.md`. The root `README.md` / `HANDOFF.md` describe the **legacy**
> standalone HTML tools (superseded) — reference only.
>
> _(The rest of this kickoff block is from the shared-shell-port era — the app is long since at
> parity and promoted to Vercel; treat it as historical. `HANDOVER.md` + `deferred.md` are the
> live handoff.)_
>
> **Confirm the starting state before doing ANYTHING — verify, don't assume:**
> 1. **Git.** `git status` clean; `main`, `origin/main`, and branch
>    `claude/studio-shared-shell-port-jozeu8` all at the same HEAD (owner is trunk-based, so main
>    carries the latest).
> 2. **Build is green.** `cd studio && npm install && npm run build` (= `tsc --noEmit` strict +
>    `vite build`). Zero errors required — this is the release gate.
> 3. **Smoke test the build.** `npm run preview -- --port 4173`, load in Chromium (Playwright:
>    `NODE_PATH=/opt/node22/lib/node_modules`, `PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers`),
>    switch through **every channel × every section**, toggle Simulate, assert **zero console
>    errors**. (Exact `node -e` snippets are in the git history.)
> 4. **Offline / artifact integrity.** The standalone inlined HTML must render with **zero
>    external requests** — the core render path uses `phImg` data-URIs; `/api/*` + remote photos
>    only light up on the deploy. Confirm before relying on the preview link.
> 5. **Deploy flip (ask the owner).** `vercel.json` is committed but the **owner** triggers the
>    Vercel redeploy. Confirm whether it's live; if so, verify the site serves the studio (not the
>    legacy root tools) and `/api/generate`, `/api/photo`, `/api/logo` all return 200. **This is
>    the one open loop from the last session.**
>
> **Workflow (owner is trunk-based).** Per change → `npm run build` green + a Chromium smoke test
> → refresh the SAME preview artifact (Artifact tool, same `url`; `force:true` on a 409) → commit
> → fast-forward `main` and `git push origin main`. Keep it **white-label**: fictional demo brands
> only (Nova, Meridian, Streamly, SkyHigh, QuickBite, LearnSphere, PixelForge, ConnectTel,
> GlowLab), American names, dollar amounts, OTPs via `genOtp()` (never hardcoded), no MoEngage /
> real-client / personal names. Keep the core render path self-contained so the artifact preview
> and keyless deploys never break.
>
> **Next items — each must be CONFIRMED before acting (detail in the Backlog section):** none are
> blocking; the app is at parity and promoted.
> - **(highest leverage) CI smoke test.** First confirm there's still no `.github/` and no `test`
>   script (only `build`/`typecheck`/`prefetch:photos`). Then add a Playwright script + a GitHub
>   Action: build → iterate channels×sections → assert zero console errors → upload per-channel
>   screenshots. Confirm it goes green before relying on it.
> - **Export/Record spot-check on Web Push + Cards.** Confirm the 2× PNG + recording look right on
>   those two newest surfaces (they reuse already-verified frames, so expected-fine but unproven).
> - **Simulate cue — owner decision.** It's hover-only now; confirm whether the owner wants it
>   fully off everywhere (like WhatsApp) before touching it.
> - **Per-channel template parity.** Shared content is fully ported (verified 1:1); confirm each
>   channel's `templates.ts` still covers every vertical its legacy tool did (spot-check
>   gmail/whatsapp/push/inapp, which build templates in a non-array shape).
> - **Accessibility pass · real-logo polish · retire the legacy root tools** — each needs a
>   confirm/decision first; none blocking.
>
> Confirm the state above, surface anything that fails confirmation, then pick the highest-value
> confirmed item.

## Backlog / ideas for next (nothing is blocking)
Ordered rough-priority. None of these are required for the app to ship — it's at parity and
promoted. These are polish + reach.
1. **Confirm the Vercel redeploy actually flipped.** `vercel.json` is committed but the owner
   must trigger a deploy; verify the live site serves the studio (not the legacy root tools)
   and that `/api/generate`, `/api/photo`, `/api/logo` still 200. This is the one open loop.
2. **Simulate cue — decide the final look.** It's hover-only now. Owner may want it fully off
   everywhere (like WhatsApp) — trivial one-line change in `global.css` if so.
3. **(Mostly done — verify only) Per-channel template parity vs the legacy tools.** The shared
   `content.js` → `content/model.ts` port is **complete** (verified 1:1: all 8 INDUSTRIES, 15
   PACKS incl. `push`/`email` overrides, 15 CONFIRM, `resolveIndustry`/SYN). The old
   "WhatsApp-first" architecture note is stale. What's *not* independently re-counted is each
   channel's own `templates.ts` vs its legacy tool (osm 12 ✓, instagram 6 ✓, facebook 6 ✓;
   gmail/whatsapp/push/inapp generate templates in a different shape — spot-check they still
   cover every vertical the legacy tool did). Low priority; nothing looks missing.
4. **Automated smoke test in CI.** Today verification is a manual Chromium `node -e` snippet
   per change (no `.github/`, no `test` script — only `build`/`typecheck`/`prefetch:photos`).
   A tiny Playwright script (load the build, iterate channels×sections, assert zero console
   errors + snapshot) run in a GitHub Action would catch regressions on push. Highest-leverage
   open item — turns the manual per-change check into an automatic gate.
5. **(Mostly done — spot-check only) Confirm Export/Record on the two newest surfaces.**
   Export PNG + Record are wired to **all 13** channels via the shared `id="capture"` frames
   (`PhoneFrame`/`DesktopFrame`), and were verified on phone/desktop/**ad** frames when they
   landed. Web Push (`DesktopFrame width=1040`) and Cards (`PhoneFrame`) were added *after* that
   pass but reuse those same verified frames, so capture works mechanically — they just lack a
   dedicated confirmation screenshot at 2×. A 5-minute check, not a sweep.
6. **Accessibility pass.** Keyboard focus order, `aria-label`s on icon-only buttons (the new
   channel-icon picker, the collapse pill, Export/Record/AI), and color-contrast on the
   simulate hover cue.
7. **Retire the legacy root tools (optional).** Once the studio deploy is confirmed good, the
   root `*-preview-tool/` HTML tools are dead weight on the live site (still handy as design
   reference). Decide whether to keep them in-repo (documented as legacy) or remove.
8. **Real-logo polish.** `resolveBrandLogo` falls back to favicons without `LOGODEV_KEY`;
   consider a small curated logo set for the demo brands so mockups look crisp keyless.

## Session log — AI panel + images + Gmail (2026-07-28, trunk on `main`)
Started by diagnosing an **AI brand-identity drift** (same brief → correct/stale/invented
brand; copy & image drifted off-topic). Root cause: every generation fed the *previous* run's
`brand`+`industry` back to `/api/generate`, and the newly-added **brand-website field** was a
third competing signal. Fixed via **Option A** (roll the website field back) + brand-first
images, then broadened into an AI-flow + Gmail polish. Each commit build-green (tsc strict) +
smoke-tested + driven in headless Chromium; all fast-forwarded to `main`. Highlights:

- **Image search is brand-first** — `api/generate.js` leads `imageQuery` with the brand
  ("Nike Air Force 1 sneakers") and adds a brand-free `imageAlt` fallback; `photoFor` tries
  query → alt → keyword (`lib/media.ts`). (Earlier this stripped brand names, so real brands
  got generic/wrong photos.)
- **Reusable `PhotoPicker`** (search box → Pexels + refresh) built into `ImageField` via an
  opt-in `pick` prop, so every **content** image field (not logos) has search/upload/pick.
  Auto-loads where there's a subject; **re-fetches when the subject changes** (debounced).
- **WhatsApp product carousel restored** (preset + AI + manual) with a **per-card editor**
  (`shell/CarouselEditor.tsx`, shared with **RCS**) — upload + a per-card photo picker.
- **Gmail overhaul.** Merged "Message"+"Body" into one **Content** section; body is editable
  in place (**Compose** mode renders `buildAiEmail` live from fields, incl. image picker) with
  a **HTML paste mode**; **pasted HTML renders in a sandboxed iframe** so its `@media` rules
  wrap on mobile (Export handled by html2canvas `onclone`, mirroring the old tool); editable
  **unsubscribe/footer**; the **header is a wordmark** (upload → Logo.dev Brand API → text),
  avatar keeps the icon; the Gmail image picker seeds from `imageQuery`, not the heading.
- **UX clarity:** Generate lands on the **copy** section (per-channel `COPY_SECTION` map, not a
  positional guess); IG/FB **"Creative" → "Content"** (+ "Advertiser" → "Profile").
- **New env var** `LOGODEV_SECRET` (Brand API wordmark, secret `sk_`, Pro plan; optional).
- **Parked** (see root `deferred.md`): Gmail "Designs" rich-template gallery, Brand-API key
  rotation, wordmark live-verification, WhatsApp format-tiles / shared `FormatPicker`.

## Session log — shared-shell port (branch `claude/studio-shared-shell-port-jozeu8`)
Ported the five shared features on top of the 11-channel migration, one commit each, each
build-green (tsc strict) + Chromium-smoke-tested, refreshing the same preview artifact:
- **Export PNG + Copy** — `lib/useCapture.ts`; neutralises the `<StageFit>` ancestor
  transform (not the node's own — the studio scales the parent); html2canvas as a bundled
  dep so it works in the artifact too. Verified phone/desktop/ad frames export at 2×.
- **Record** — vendored `public/recorder.js` + `public/gif-encoder.js` via `index.html`,
  attached by `lib/useRecorder.ts` to a childless TopBar button (React never manages its
  DOM; a StrictMode-safe once-guard). The inliner also inlines the two libs into the
  artifact. Verified record→review→WebM/GIF with a mocked `getDisplayMedia`.
- **AI panel** — `shell/AiPanel.tsx` + `store/useAiPanel.ts` + `lib/detectChannel.ts`;
  per-channel adapters in `lib/applyAi.ts`. Fixed the auto-first-template clobber with the
  shared `lib/useAutoTemplate.ts` + an `aiSuppressCtx` store flag (deterministic). Verified
  end-to-end with mocked `/api/*` (industry switch, no clobber, in-app channel switch).
- **Real images + logos** — `lib/media.ts` (`photoFor`/`resolveBrandLogo`) + `content/pximg.ts`
  (56 pre-resolved photos + 151 synonyms). Remote URLs only on the AI/network path; `phImg`
  stays the self-contained default so the artifact never breaks.

## Session log — Vercel promotion + UX polish (same branch)
After the shared-shell port, added the two newest MoEngage channels (**Web Push**,
**Cards / App Inbox** → 13 total), made the shell responsive, baked the curated Pexels photos
into the build, then committed `vercel.json` to flip the live deploy to `studio/dist` (§5).
On top of that, a round of fixes from **live testing on the deploy**, one commit each,
build-green (tsc strict) + Chromium-smoke-tested, refreshing the same preview artifact:
- **Opt-in export fix** — the opt-in prompt buttons (`po-*`, `wp-native/wp-optin`) had no
  explicit `border`, so html2canvas painted the UA default (a black box on Export). Added
  `border:0` (the more-specific iOS divider stays).
- **Logo reset on template apply** — AI sets a real-brand logo; applying a template reset the
  brand name but not the logo, so a real logo stuck on pack content. `applyPush/Webpush/Cards
  Template` now reset `appLogo/logo` to null (→ pack monogram), incl. the opt-in branches.
- **Collapsible editor panel (Canva-style)** — store flag `panelOpen`; a prominent pill button
  centered on the panel/stage seam folds the panel away so the preview takes full width (icon
  rail stays; clicking a rail icon toggles it back). Desktop/tablet only — phones keep the
  Editor/Preview tab. `.body.panel-collapsed` grid + rail active-state gated on open.
- **AI opens the editor** — after Generate, jump to the channel's content section (and ensure
  the panel is open) so the copy is right there to edit, instead of leaving the user on Templates.
- **Favicon + head meta** — `public/favicon.svg` (brand chat-bubble) + 32/180/512 PNG
  fallbacks, apple-touch-icon, theme-color, meta description wired in `index.html`.
- **Realistic WhatsApp footers** — dropped the redundant brand-name footer for real WA-style
  copy per template ("Reply STOP to unsubscribe", "Questions? Just reply here", …); verification
  keeps "Expires in 10 minutes".
- **Gmail opens on the email** — default `view: 'inbox' → 'open'` so the channel lands on the
  rendered email, not the inbox list.
- **Real channel icons** — replaced the arbitrary/wrong emoji set with a colored SVG icon set
  (`src/channels/channelIcons.tsx`): accurate brand marks (WhatsApp/Gmail/Instagram/Facebook),
  a Google-Messages bubble for RCS, and clean glyphs for the rest. Dropped the `emoji()` helper.
- **Hover-only Simulate** — Simulate drew a persistent ring on every `.clickable` at rest, which
  looked wrong on styled CTAs (Instagram "Shop Now"). Made the cue hover-only globally (one rule
  in `global.css`); buttons stay clean at rest on every channel. WhatsApp stays clean via its
  existing `.sim-on .wa-cta` override.
