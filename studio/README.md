# Channel Studio — unified app (React + Vite + TypeScript)

This is the **new, consolidated** Channel Studio: one single-page app with a shared
shell (nav rail, top bar, device frame) where switching channels swaps only the
sidebar + preview — **no page reloads**. It replaces the six separate standalone
HTML tools at the repo root.

**Status:** all **11 channels** are migrated — WhatsApp, RCS, SMS (messaging); Gmail;
Push, In-App, In-App Gamification (notify); Onsite Messaging (web); Instagram Ads and
Facebook Ads. The shared top-bar features are wired too: **Export PNG / Copy**, screen
**Record** (WebM/GIF + trim studio), and a **✨ AI** generate panel with real
photos/logos. Everything degrades gracefully offline (see below).

## Run it

```
cd studio
npm install
npm run dev      # local dev server (hot reload)
npm run build    # typecheck (tsc strict) + production build -> dist/
npm run preview  # serve the production build
```

## Shared features

- **Export PNG / Copy** — `lib/useCapture.ts` rasterises the `#capture` frame with
  html2canvas (a bundled dep, so it also works in the self-contained preview). It
  neutralises the `<StageFit>` ancestor scale, hides the simulate chrome, and exports a
  2× PNG (download) or copies it to the clipboard.
- **Record** — the vendored vanilla recorder (`public/recorder.js` + `public/gif-encoder.js`,
  loaded via `index.html`) records only the device view (Chromium Region Capture) and opens
  a review studio (filmstrip trim → WebM/GIF). Desktop-Chromium only; degrades with a toast.
- **✨ AI** — `shell/AiPanel.tsx` POSTs a brief to `/api/generate` and maps the one schema
  message onto the active channel's store slice (`lib/applyAi.ts`). Name a channel or
  industry in the brief and the studio switches to it.
- **Real images / logos** — `lib/media.ts` (`photoFor` / `resolveBrandLogo`) hits
  `/api/photo` + `/api/logo` on the deploy; `content/pximg.ts` holds a pre-resolved photo
  set so common subjects show real photos even without a `PEXELS_KEY`. The offline
  `phImg(...)` placeholder is the permanent fallback, so the core render path stays
  self-contained and never breaks in the preview or a keyless deploy.

## Environment variables (all optional — set in Vercel → Settings → Environment Variables)

The serverless functions live at the **repo root** under `api/` and are shared with the
legacy tools. With none of these set, the app is fully functional — the AI button shows a
friendly "add a key" note and all imagery uses the built-in placeholders.

| Variable | Enables | Notes |
| --- | --- | --- |
| `GROQ_API_KEY` **or** `GEMINI_API_KEY` | AI copy (`/api/generate`) | Groq preferred (roomier free tier); either works. |
| `PEXELS_KEY` | Live photo search for arbitrary AI subjects (`/api/photo`) | Without it, the ~56 pre-resolved photos in `content/pximg.ts` still show for common keywords. |
| `LOGODEV_KEY` | Crisp real brand logos (`/api/logo`) | A Logo.dev *publishable* `pk_…` token. Without it, real brands fall back to keyless favicons; invented brands to the generated monogram. |

## How it's organized (add a channel = drop in one module)

```
src/
  main.tsx, App.tsx        entry (App renders <AppShell/> + <AiPanel/> + <Toaster/>)
  styles/global.css        design tokens + shell layout + shared controls + AI panel
  store/                   Zustand state (shared context + per-channel slices) + toast + AI panel
  content/model.ts         industries, content packs, confirmations (typed)
  content/pximg.ts         pre-resolved real photos + keyword synonyms (data only)
  lib/                     placeholder images, text formatting, icons, useCapture,
                           useRecorder, useAutoTemplate, media (photos/logos), applyAi
  shell/                   AppShell, SectionNav, TopBar, PhoneFrame, DesktopFrame,
                           StageFit, StatusBar, AiPanel, Toaster
  channels/
    registry.tsx           one entry per channel -> its sections + Preview
    <id>/                  Preview.tsx + panels.tsx + templates.ts + (css) per channel
```

To migrate/adjust a channel: edit its module under `src/channels/<id>/` and its
`registry.tsx` entry. The shell, state, nav, device frames, simulate handling, capture,
record, AI, and design system are all shared.
