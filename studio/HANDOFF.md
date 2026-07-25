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
remain. The remaining work is the **shared features still stubbed in the shell**:
Export PNG, Copy, Record, AI panel, and real (network) images/logos — see below.

- **Branch:** `claude/channel-ux-audit-vw4qf6`. Do NOT push to `main` yet — the
  owner said "we'll push to main later." Keep committing to this branch.
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

## Shared features still to port (into the shell, once — all channels benefit)
- **Export PNG + Copy** — root tools use html2canvas on `#capture`. Port a
  `useCapture()` that renders the `.phone` to PNG. (Currently stubbed with a toast.)
- **Record** (webm/gif) — root `recorder.js` + `gif-encoder.js`.
- **AI panel** — root `ai.js` (posts to `/api/generate`); make it a shell component.
- **Real images / logos** — root `image-system.js` + `api/photo.js` + `api/logo.js`.
  ⚠️ These use the NETWORK, so they work on Vercel but NOT inside the self-contained
  artifact preview. Keep placeholders (`phImg`) as the offline fallback.

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
cd studio && npm run build
# inline the built JS+CSS into one self-contained HTML, extract <style>+#root+<script>
# (see the node one-liner in git history / the last session's commands)
```
Then call the Artifact tool with `url:"https://claude.ai/code/artifact/d3da92cb-53ea-4957-b406-ee0255c54cbc"`,
same favicon (💬) and title, pointing at the inlined HTML — this keeps the owner's
existing preview link stable.

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

### What's left (shared features — still stubbed in the shell)
1. **Export PNG + Copy** — TopBar buttons toast "being ported"; port a `useCapture()`
   over `#capture` (html2canvas). Each frame already carries `id="capture"`.
2. **Record** (webm/gif) — root `recorder.js` + `gif-encoder.js`.
3. **AI panel** — root `ai.js` → `/api/generate`; make it a shell component.
4. **Real images / logos** — network-based (`api/photo.js`/`api/logo.js`); studio is
   offline-first with `phImg` placeholders, so keep those as the fallback.
Then, at parity: promote `studio/` to the site root + point Vercel at it (owner handles
Vercel; provide exact steps). Keep `npm run build` GREEN + smoke-test per change.

## Kickoff prompt for the next chat (paste this)
> Continue the `studio/` React app on branch `claude/channel-ux-audit-vw4qf6`.
> Read `studio/HANDOFF.md` first. WhatsApp is the fully-working reference channel
> (its Preview wraps itself in <PhoneFrame>; the shell scales it via <StageFit>).
> Port ALL the remaining channels in one pass by repeating that pattern — RCS, SMS,
> Push, In-App, Gamification, Gmail (add a DesktopFrame), OSM, Instagram Ads,
> Facebook Ads — porting each channel's render, section panels, and templates from
> the matching root `*-preview-tool` HTML, and extending `content/model.ts` from the
> root `content.js` as needed. Run `npm run build` (tsc strict) and a Chromium smoke
> test after EACH channel so any breakage is isolated, then refresh the existing
> preview artifact (same URL) and commit. Don't push to main. Keep it white-label
> (no MoEngage / real-client / personal names; American names; dollars; genOtp()).
