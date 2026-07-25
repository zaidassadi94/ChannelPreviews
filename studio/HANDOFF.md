# Channel Studio (unified app) — HANDOFF

This is the working note for continuing the **`studio/`** rebuild. Read this first.

## TL;DR
We are consolidating six standalone HTML tools (at the repo root) into ONE
React + Vite + TypeScript single-page app in `studio/`, where switching channels
swaps only the sidebar + preview (no page reload). **ALL 11 channels are now
migrated and verified** — WhatsApp (the original reference) plus RCS, SMS, Push,
In-App, Gamification, Gmail, Onsite Messaging, Instagram Ads and Facebook Ads.
Each has its render (channel-owned frame → `PhoneFrame`/`DesktopFrame`, scaled by
`StageFit`), section panels, and per-vertical templates. No "Migrating" stubs
remain. **All the shared shell features are now ported too** — Export PNG, Copy,
Record (WebM/GIF + trim studio), the ✨ AI panel, and real photos/logos. The app is
at parity with the six legacy tools; the last step is promoting `studio/` on Vercel
(exact settings in §5).

- **Branch:** originally `claude/channel-ux-audit-vw4qf6`; the shared-shell port
  continued on `claude/studio-shared-shell-port-jozeu8` (based on it). Do NOT push to
  `main` yet — the owner said "we'll push to main later." Keep committing to the branch.
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
  "buildCommand": "npm run build --prefix studio",
  "outputDirectory": "studio/dist"
}
```
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
- **Simulate on WhatsApp:** buttons must NOT change appearance (owner feedback);
  see the `.sim-on .wa-cta` override in `whatsapp.css`. Other channels can use the
  default `.sim-on .clickable` ring if it looks right.
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

## Kickoff prompt for the next chat (paste this)
> Continue the `studio/` React app (branch `claude/studio-shared-shell-port-jozeu8`, based
> on `claude/channel-ux-audit-vw4qf6`). Read `studio/HANDOFF.md` first. All 11 channels AND
> all shared shell features (Export/Copy, Record, AI panel, real photos/logos) are ported,
> verified (build + Chromium smoke tests) and committed; the preview artifact is current.
> The remaining step is **promoting `studio/` on Vercel** — the exact settings are in §5
> (keep Root Directory at the repo root so `api/` still deploys; build/output point at
> `studio/`). The owner handles Vercel. If you make further changes: `npm run build` (tsc
> strict) + a Chromium smoke test per change, refresh the SAME preview artifact (`force:true`
> on 409), commit per change, DON'T push to `main`. Keep it white-label (no MoEngage /
> real-client / personal names; American names; dollars; `genOtp()`) and keep the core
> render path self-contained so the artifact preview + keyless deploys never break.

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
