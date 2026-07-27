# Channel Previews

**Channel Studio** — a React + Vite + TypeScript single-page app that renders
pixel-accurate marketing-channel mockups (WhatsApp, RCS, SMS, Gmail, Push,
In-App, Gamification, Cards, Onsite, Web Push, Instagram & Facebook Ads). One
shared shell (top bar + section rail + device frame) swaps only the sidebar +
preview when you switch channels — no reload.

Shared features: Export PNG / Copy, screen Record (WebM/GIF + trim), an AI panel
(`/api/generate`), and real photos/logos (`/api/photo`, `/api/logo`).

## Layout

| Path | What it is |
|------|------------|
| [`studio/`](studio/) | The app. **Start here** — see [`studio/README.md`](studio/README.md) and [`studio/HANDOFF.md`](studio/HANDOFF.md). |
| `api/` | Vercel serverless functions (`generate`, `photo`, `logo`) used by the app. |
| `vercel.json` | Promotes `studio/dist` as the live deploy; `api/` stays at the repo root. |
| `.github/workflows/ci.yml` | Build (tsc strict + vite) + Playwright smoke test on every push/PR. |

## Develop

```bash
cd studio
npm install
npm run build        # tsc --noEmit strict + vite build (the release gate)
npm run preview      # serve the built app
npm run test:smoke   # headless smoke test across every channel
```

> The legacy standalone single-file tools that used to live at the repo root
> have been retired now that the studio covers every channel. They remain in
> git history if ever needed for reference.
