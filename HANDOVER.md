# Handover — Channel Studio (read this first)

_Last updated: 2026-07-28._

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
Playwright/Chromium is pre-installed (`PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers`). If the
smoke test can't find the browser, the provisioned revision may differ from the pinned
Playwright — the browser bridge trick is in the git history, or just re-provision.

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
