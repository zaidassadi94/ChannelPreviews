# Channel Studio — unified app (React + Vite + TypeScript)

This is the **new, consolidated** Channel Studio: one single-page app with a shared
shell (nav rail, top bar, device frame) where switching channels swaps only the
sidebar + preview — **no page reloads**. It replaces the six separate standalone
HTML tools at the repo root, migrated one channel at a time.

**Status:** proof-of-concept. **WhatsApp** is fully migrated. The other channels are
registered (so the nav + no-reload switching are real) and show a short "migrating"
placeholder until each module is ported.

## Run it

```
cd studio
npm install
npm run dev      # local dev server (hot reload)
npm run build    # typecheck + production build -> dist/
npm run preview  # serve the production build
```

## How it's organized (add a channel = drop in one module)

```
src/
  main.tsx, App.tsx        entry
  styles/global.css        design tokens + shell layout + shared controls
  store/                   Zustand state (shared context + per-channel slices) + toast
  content/model.ts         industries, content packs, confirmations (typed)
  lib/                     helpers: placeholder images, text formatting, icons
  shell/                   AppShell, NavRail, TopBar, PhoneFrame, StatusBar, Accordion, Toaster
  channels/
    registry.tsx           one entry per channel -> its Sidebar + Preview
    whatsapp/              a fully-migrated channel module (Sidebar + Preview + templates + css)
```

To migrate a channel: add its `Sidebar` and `Preview` components under
`src/channels/<id>/`, then wire them into `registry.tsx`. The shell, state, nav,
device frame, simulate handling, and design system are all shared — you only build
that channel's editor fields and its preview.
