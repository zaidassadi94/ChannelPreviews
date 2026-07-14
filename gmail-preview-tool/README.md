# Gmail Preview Studio

A single self-contained HTML file that renders pixel-accurate **Gmail mockups** for
email creatives — built for producing screenshots for decks (e.g. MoEngage campaign
previews). No backend, no build step, no AI. Everything runs in the browser.

## Use it

Open `index.html` in any browser, or host the folder anywhere static
(GitHub Pages, Vercel, Netlify, S3, an internal share). It's one file.

## What it does

- **Two skins** — iPhone mobile app frame **and** desktop web (browser chrome).
- **Two views** — the **inbox list** and the **open email** (reading view). Toggle live.
- **Three ways to supply the email body:**
  - **Upload HTML** — drag/drop or browse an existing `.html` email file.
  - **Paste HTML** — paste raw markup (from MoEngage, an ESP, wherever) and apply.
  - **Plain** — build a simple email from heading + copy + button + accent color.
- **Editable metadata** — sender name/email, logo (or auto Gmail-style monogram
  avatar), subject, snippet, timestamp, "to" line, unread / starred / important
  states, category tab (Primary / Promotions / Social / Updates), label chip.
- **Gmail Promotions annotations** — the rich deal card Gmail shows under Promotions
  (brand logo, deal text, promo code, expiry, hero images). Toggle on for the inbox view.
- **Realistic filler rows** — surround your email with believable inbox rows so the
  list view looks like a real inbox; choose where your email sits.
- **Light & dark** Gmail themes.
- **Export** — one click **Export PNG** (2× resolution) or **Copy** to clipboard for
  pasting straight into a slide. Falls back to native OS screenshot if the
  screenshot library can't load (e.g. fully offline).

## Notes

- The email body renders in an isolated iframe for maximum fidelity (respects the
  email's own `<style>` blocks and media queries). Export re-renders it inline so the
  PNG captures reliably.
- PNG export uses [html2canvas](https://html2canvas.hertzen.com/) loaded from a CDN.
  If you need it to work **fully offline**, download `html2canvas.min.js` next to
  `index.html` and change the `<script src="…">` tag to point at the local copy.
- Remote images in an email/annotation that block cross-origin requests may not appear
  in the exported PNG (browser security). If that happens, use a native OS screenshot
  (macOS `Cmd+Shift+4`, Windows `Win+Shift+S`) — the on-screen preview always looks right.
