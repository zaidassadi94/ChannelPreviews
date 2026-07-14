# Channel Studio

Realistic, self-contained **channel mockup tools** for building marketing/campaign
previews to drop into decks and screenshots — no backend, no build step, no AI.
Everything runs in the browser. Built for producing MoEngage-style creative mocks
across email and messaging channels.

Open **`index.html`** (it opens the studio), or open any tool folder directly —
each is a standalone single HTML file you can host anywhere static (Vercel,
Netlify, GitHub Pages, S3, an internal share). Switch channels — including
Gmail — from the **Channel** dropdown inside the app.

## Channels

| Channel | Folder | Highlights |
|---|---|---|
| **Gmail** | [`gmail-preview-tool/`](gmail-preview-tool/) | Same Channel Studio shell · Industry/Sub dropdowns · 6 email templates per vertical (promo + transactional) · mobile + desktop skins · inbox & open-email · Promotions annotations |
| **SMS** | [`messaging-preview-tool/?channel=sms`](messaging-preview-tool/index.html) | iOS Messages & Android (Google Messages) · text + MMS image · GSM/Unicode segment counter |
| **RCS** | [`messaging-preview-tool/?channel=rcs`](messaging-preview-tool/index.html) | Verified business · rich cards · swipeable carousels · suggested reply/action chips · typing indicator |
| **WhatsApp** | [`messaging-preview-tool/?channel=whatsapp`](messaging-preview-tool/index.html) | Business chat · template messages (header image/body/footer/buttons) · quick-reply & CTA buttons · product carousels · list menus · documents · light/dark |


## Real product photos (one-time setup)

By default the tools render clean product **illustrations** (always relevant,
self-contained). To use **real photos** instead, resolve them once from Pexels:

1. Get a free Pexels API key: https://www.pexels.com/api/  (free tier: 200/hr, 20k/mo).
2. From the repo root, run once:
   ```
   PEXELS_KEY=your_key_here node resolve-images.js
   ```
   This looks up one product photo per keyword (~50 lookups) and writes `images.js`.
3. Commit `images.js` and redeploy.

After that the tools just load the resolved image URLs from Pexels' CDN — **that is
not an API call**, so it never counts against your rate limit no matter how many
people open the tool. The key is only used during the one-time lookup and never ships
in the app. Edit the query list at the top of `resolve-images.js` and re-run to swap
any specific image. Anything not resolved falls back to the illustration.

## How it works

- **Pick a channel** (hub tabs, or open a folder).
- **Start from a template** — every channel ships with ready-made, realistic
  messages (OTP, promo, order confirmation, appointment, product carousel, list
  menu, …). Pick one, then tweak.
- **Edit** the sender/business identity, the conversation (add/remove/reorder
  message bubbles, set each bubble's type and who it's from), logo, verified
  badge, timestamps, theme.
- **Export** — one-click **PNG** (2×) or **copy to clipboard**, ready for a slide.

### Message types supported

- **SMS** — text, MMS image
- **RCS** — text, image, rich card, carousel (+ suggestion chips on any message)
- **WhatsApp** — text, image + caption, template (header/body/footer + buttons),
  product carousel, list menu, document

Buttons use a simple one-per-line format: `Label | reply|url|call | value`.
Carousel cards: `imageURL | title | subtitle | buttonLabel | buttonValue` per line.
Templates pre-fill these so you can see the format.

## Notes

- Each tool is one self-contained HTML file. The hub (`index.html`) simply embeds
  the selected tool in an iframe, so hosting the whole folder Just Works.
- PNG export uses [html2canvas](https://html2canvas.hertzen.com/) from a CDN. For a
  **fully offline** build, drop `html2canvas.min.js` next to the tool and repoint the
  `<script src="…">` tag. If a remote image ever blocks cross-origin capture, the
  on-screen preview is always correct — use a native OS screenshot as a fallback.
- All previews are mockups for internal creative review — not affiliated with or
  endorsed by Google, Apple, Meta/WhatsApp.
