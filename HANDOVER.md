# Handover — Channel Studio (read this first)

_Last updated: 2026-07-29._

## Shipped 2026-07-29 (this session)
- **Showcase mode (v1)** — a **16:9 transparent slide** composed of several channels for one
  brand, for pasting into decks (the "16+ channels" / segment-tryptich slides). Toggle **▦
  Showcase** in the TopBar. Approach **A (live distinct-channel tiles)**: each tile is the
  channel's REAL Preview reading its own store slice, so every existing editor works on it.
  - **Pick channels** (chips) → **Generate** a coherent set: **Auto** = a server *planner*
    (`/api/generate` `mode:'plan'` → `{brand,industry,domain,plan:[{channel,angle}]}`) decides
    one connected story, then the board fans out to the normal per-channel generator; **Directed**
    = a brief per tile. Shared brand/logo resolve once; industry isn't switched (so tiles' auto-
    template can't clobber). `lib/showcaseAi.ts` orchestrates; `store/useShowcase.ts` holds board
    state.
  - **Clean-row layout** (the Aura tryptich), optional **headline**, per-tile **caption +
    segment badge**, **background** Transparent/White/Slate. **Copy/Export** rasterise the whole
    board (it's `id="capture"`) → `showcase-<brand>.png`, transparent via html2canvas.
  - **Edit a tile** → ✎ opens that channel's normal editor with a **← Back to Showcase** pill.
  - **Frame plumbing:** `shell/FrameContext.ts` lets a Preview render as the single-channel stage
    (owns `id="capture"`) or a board tile (no id) — fixes the id collision when several frames
    mount. `PhoneFrame`/`DesktopFrame` read it.
  - **Deferred to v2/v3** (agreed): hero-montage + grid layouts; **duplicate channels** (three
    phones / three segments) which need per-tile isolated state (snapshot tiles or a store-instance
    refactor); a per-tile "New image" from the board.
  - **Tests:** `studio/tests/showcase.mjs` (`npm run test:showcase`) — board, chip add/remove,
    AI generate-all (mocked planner + fan-out), edit→back-pill, and a real Export download.
  - **`api/` changed → needs a Vercel redeploy of `main`** for the planner to work live.
  - **⚠️ HIDDEN, AND SLATED FOR REMOVAL:** the TopBar **▦ Showcase** button is gated behind
    `SHOWCASE_ENABLED = false` in `store/useShowcase.ts`, and `AppShell` won't enter the mode
    while it's false — so it's unreachable in the UI. **The owner has since decided to roll the
    whole feature back** (do it in a fresh, dedicated session) — see the step-by-step unwind in
    `deferred.md` → "Showcase mode — ROLL IT BACK ENTIRELY". Until then it stays hidden; don't
    build on it.

- **App Inbox scroll fix** — the Cards feed didn't scroll with many cards (`.cd-app` used
  `height:100%` instead of `flex:1;min-height:0`, and `.cd-card` lacked `flex:none` so cards
  squished). Fixed + regression test `studio/tests/cards-scroll.mjs`.
- **Multi-message AI generation** — a brief that lists several messages now renders one per
  item, on the channels whose surface is a stack/thread: **cards** (app-inbox feed),
  **whatsapp/rcs/sms** (chat thread), **push** (lock-screen / shade stack). Previously each
  returned a single message + hard-coded filler (the cards "only the first card" bug).
  - **Server** (`api/generate.js`): these channels' schema now returns a `messages` array
    (shared `brand/industry/domain` at the top, `screenTitle` for cards). A `MULTIPLE
    MESSAGES` system-prompt rule tells the model to return one entry per distinct message the
    brief asks for (default one, max 5, never invent/drop/merge). `STACKABLE`/`multiSchema`
    helpers; output-token budget raised for these; the array is validated/capped server-side.
  - **Client** (`lib/applyAi.ts`): `msgsOf(m)` = the `messages` envelope or `[m]`. Each
    stackable adapter maps it onto its store list (cards→`items`, wa/rcs/sms→message arrays,
    push→primary `notify.push` + new `notify.stack`). **Card filler dropped** — the feed shows
    exactly the brief; the Cards editor hint points at **+ Add card**. The AI-panel hero
    picker hides for multi-message runs (`isMultiAi`); single runs keep re-image/pick.
  - **Push store**: `NotifyState.stack: PushItem[]` + `pushStackSet/Add/Update/Delete`; the
    lock screen + shade render the stack; the Notification panel gained a "Stacked below"
    editor. A preset/Clear resets the stack.
  - **Tests**: `studio/tests/ai-multi.mjs` (`npm run test:ai-multi`) mocks `/api/generate`
    and asserts cards/whatsapp/push render one message per briefed item, no filler leak.
  - **`api/` changed → needs a Vercel redeploy of `main`** before multi-message shows live.

- **Gmail HTML emails fit the mobile pane** — a pasted fixed-width (desktop) email overflowed
  and got cut off on mobile. `EmailFrame` (`channels/gmail/GmailPreview.tsx`) now mirrors Gmail
  mobile: it measures the email's content width and, if wider than the pane, renders at natural
  width and **scales the whole email to fit** (never cut off); a genuinely responsive email
  **reflows** with no scaling (a viewport meta is injected when missing). Sizing is applied
  imperatively so a React re-render can't clobber it. Test: `studio/tests/gmail-mobile.mjs`.
  Client-only.
- **Logo search on logo fields** — logo/avatar fields were upload/paste only; each now has an
  inline **"Find a logo"** search (`shell/LogoPicker.tsx`, reuses `resolveBrandLogo` → `/api/logo`
  Logo.dev/favicon, no AI). `ImageField` gained `logo` + `logoQuery` props (mirrors `pick`);
  seeded with the field's brand/app name and auto-searches once on mount. Wired into Gmail sender
  logo + wordmark, Push/Cards app icon, Onsite logo, Instagram/Facebook profile, Web Push site
  icon. Crisp logos need `LOGODEV_KEY`, else favicon fallback. Test: `studio/tests/logo-search.mjs`.
  Uses the existing `/api/logo` (no new function).
- **Sharper Record GIFs** — GIF export blurred because it hard-capped width at 480px (throwing
  away Retina capture) with low-quality downscaling. `studio/public/recorder.js`: capture at a
  high-res surface (getDisplayMedia ideal 3840×2160), GIF size menu now up to **Max (crisp) =
  full captured resolution** (default), high-quality downscale, +24 fps. Client/public asset only.
- **"Brand" sections + logo everywhere + Gmail-on-Content** — every channel's identity section is
  now labelled **Brand** (was Sender/App/Site/Website/Profile/Page). The logo control (upload +
  paste + brand-logo search) is now on **all 12** channels — added to WhatsApp/RCS/SMS (shared
  `brand.logo`) and to In-App/Game (new Brand section over `notify.appName/appLogo`). Gmail opens
  on **Content** (per-channel `DEFAULT_SECTION` map in the store; `setChannel` seeds the section).
  Test: `studio/tests/brand-sections.mjs`. Client-only.



## What this repo is
**Channel Studio** — a React 19 + Vite + TypeScript single-page app in `studio/` that renders
pixel-accurate marketing-channel mockups (WhatsApp, RCS, SMS, Gmail, Push, In-App, Game,
Cards, Onsite, Web Push, Instagram & Facebook Ads). One shared shell swaps only the
sidebar + preview per channel. Serverless functions live at the repo root in `api/`
(`generate`, `photo`, `logo`). Deployed on **Vercel from `main`** (`studio/dist`).

## Read next, in order
1. **`deferred.md`** — everything parked / to-discuss + improvement ideas. Read it before
   picking up work.
2. **`studio/HANDOFF.md`** — architecture, the per-channel recipe, conventions/gotchas, and
   the full session logs (this session's log is at the end).
3. `studio/README.md`, root `README.md` — orientation (root `README`/`HANDOFF` describe the
   retired legacy tools, reference only).

## Working agreement (owner's standing prefs — see `CLAUDE.md`)
- **Trunk-based.** Finish → `npm run build` green + Chromium smoke test → commit → fast-forward
  `main` and `git push origin main`. Always push when a task is done.
- Commits authored `Claude <noreply@anthropic.com>`; never put a model identifier in the repo.
- **White-label:** fictional demo brands, American names, dollar amounts, OTPs via `genOtp()`.
- **api/ changes need a Vercel redeploy of `main`** before they show live. The live site was
  occasionally a build behind during the last session — verify the latest commit is deployed.

## Verify before doing anything
```
cd studio && npm install && npm run build   # tsc --noEmit strict + vite build (release gate)
node tests/smoke.mjs                          # "Smoke test passed — 12 channels, no console errors"
node -c ../api/generate.js                    # api/ is CommonJS — syntax-check
```
Per-feature Chromium tests added this session (all mock `/api/*`, run headless):
`npm run test:cards-scroll`, `test:ai-multi`, `test:gmail-mobile`, `test:logo-search`,
`test:showcase` (skips while Showcase is hidden). Run the relevant one after touching a feature.

Playwright/Chromium is pre-installed (`PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers`). If the
smoke test can't find the browser, the provisioned revision differs from the pinned Playwright —
symlink the full Chromium into the expected headless-shell path, e.g.
`mkdir -p /opt/pw-browsers/chromium_headless_shell-1234/chrome-headless-shell-linux64 && ln -sf
/opt/pw-browsers/chromium-*/chrome-linux/chrome $_/chrome-headless-shell` (revision numbers drift
per container — adjust to what's under `/opt/pw-browsers`).

---

## What shipped last session (AI panel + images + Gmail)
The session began by diagnosing an **AI brand-identity drift** (same brief → correct / stale /
invented brand) and turned into a broad polish of the "Generate with AI" flow and Gmail.
All on `main`; 13 commits (newest first — `git log` for detail):

- **Photo picker** now **refreshes on a new subject** (was frozen on the previous generation)
  and the **Gmail image picker seeds from the AI `imageQuery`**, not the marketing heading.
- **Gmail header = wordmark** (uploaded image → Logo.dev **Brand API** wordmark → brand-name
  text); the round avatar keeps the icon. `api/logo.js?wordmark=1` (needs `LOGODEV_SECRET`,
  falls back to text).
- **Gmail unsubscribe / footer** copy is editable.
- **Pasted email HTML renders in a sandboxed iframe** → fixes mobile media-query wrapping +
  CSS isolation; Export handled via html2canvas `onclone` (restores the old tool's approach).
- **Gmail body is editable in place** — "Compose" mode renders the rich `buildAiEmail` layout
  live from fields (image + heading + body + button + accent); plus a **"HTML" paste mode**.
- **UX clarity:** Generate **lands on the copy** section (was a positional guess); IG/FB
  **"Creative" → "Content"** (+ "Advertiser" → "Profile"); Gmail **"Message" + "Body" merged
  into one "Content"** section.
- **Photo picker (search + refresh)** built into every content image field (`shell/PhotoPicker`
  in `shell/ImageField`); auto-loads where there's a subject.
- **WhatsApp product carousel restored** (preset + AI + manual) with a **per-card editor**
  (upload + per-card picker); the editor is shared and reused by **RCS**.
- **Brand-first image search** — `imageQuery` leads with the brand, with a brand-free
  `imageAlt` fallback the client auto-tries.
- **Rolled back the brand-website field** (the drift's competing signal) and added cycling
  placeholder prompts in the brief box + split "New image" / picker.

### Environment variables (Vercel)
| Var | Purpose | Notes |
|---|---|---|
| `GROQ_API_KEY` **or** `GEMINI_API_KEY` | AI copy (`/api/generate`) | Groq preferred if set |
| `PEXELS_KEY` | live photos (`/api/photo`) | favicons/placeholders work without |
| `UNSPLASH_KEY` | photos (optional, tried before Pexels) | optional |
| `LOGODEV_KEY` | **icon** logo (image CDN, publishable `pk_`) | avatar icon; keyless favicon fallback |
| `LOGODEV_SECRET` | **wordmark** (Brand API, secret `sk_`) | **NEW**; needs Pro/Enterprise plan; falls back to text wordmark. Supports comma-separated keys once rotation lands (see `deferred.md`). |
| `CS_ALLOW_ORIGINS` | CORS allowlist | optional |

### Where the AI / Gmail code lives (for the next session)
- **AI panel:** `shell/AiPanel.tsx` → `/api/generate` → adapters in `lib/applyAi.ts`.
- **Image search:** `api/generate.js` (`systemPrompt`: brand-first `imageQuery` + `imageAlt`);
  `lib/media.ts` (`photoFor` = query→alt→keyword; `photoCandidates`; `resolveBrandLogo`;
  `resolveBrandWordmark`).
- **Photo picker:** `shell/PhotoPicker.tsx` (search/refresh, reacts to query changes) inside
  `shell/ImageField.tsx` (opt-in `pick` + `query` seed). Carousel editor: `shell/CarouselEditor.tsx`.
- **Gmail:** `channels/gmail/GmailPreview.tsx` (`EmailBody`: div for Compose/Template, **iframe
  for HTML mode**; `resolveBody`), `emails.ts` (`buildAiEmail`, `eWrap`, `GMAIL_TEMPLATES`),
  `panels.tsx` (`ContentPanel`: Subject/Preview → body modes **Template | Compose | HTML** →
  footer → header wordmark → inbox), store `gmail` slice (`bodyMode`, `plain{heading,body,btn,
  accent,image,imageQuery}`, `footer`, `wordmark`).
- **Export:** `lib/useCapture.ts` (html2canvas; `onclone` swaps the email iframe → div).

### Open loops
All parked items and improvement ideas are in **`deferred.md`**. Headlines: the Gmail
**"Designs" rich-template gallery** (agreed, not built), **Brand-API key rotation**, the
**wordmark live-verification** once a secret key is set, and the **WhatsApp format-tiles /
shared FormatPicker**.
