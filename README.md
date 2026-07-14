# Channel Previews

Realistic, self-contained **channel mockup tools** for building marketing/campaign
previews to drop into decks and screenshots — no backend, no build step, no AI.
Everything runs in the browser. Built for producing MoEngage-style creative mocks
across email and messaging channels.

Open **`index.html`** for the unified hub (tabs for every channel), or open any
tool folder directly — each one is a standalone single HTML file you can host
anywhere static (GitHub Pages, Vercel, Netlify, S3, an internal share).

## Channels

| Channel | Folder | Highlights |
|---|---|---|
| **Gmail** | [`gmail-preview-tool/`](gmail-preview-tool/) | Mobile (iPhone) + desktop-web skins · inbox list & open-email views · Promotions annotations · light/dark |
| **SMS** | [`messaging-preview-tool/?channel=sms`](messaging-preview-tool/index.html) | iOS Messages & Android (Google Messages) · text + MMS image · GSM/Unicode segment counter |
| **RCS** | [`messaging-preview-tool/?channel=rcs`](messaging-preview-tool/index.html) | Verified business · rich cards · swipeable carousels · suggested reply/action chips · typing indicator |
| **WhatsApp** | [`messaging-preview-tool/?channel=whatsapp`](messaging-preview-tool/index.html) | Business chat · template messages (header image/body/footer/buttons) · quick-reply & CTA buttons · product carousels · list menus · documents · light/dark |

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
