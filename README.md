# Channel Studio

Realistic, self-contained **channel mockup tools** for building marketing/campaign
previews to drop into decks and screenshots — no build step; everything runs in the
browser. Built for producing MoEngage-style creative mocks across email and messaging
channels. An **optional** AI generator (a tiny serverless function, off unless you add
a key) can draft a message for you — see "Generate with AI" below.

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
| **WhatsApp** | [`messaging-preview-tool/?channel=whatsapp`](messaging-preview-tool/index.html) | Business chat · template messages (header image/body/footer/buttons) · quick-reply & CTA buttons · product carousels · list menus · documents |
| **Push** | [`notify-preview-tool/?channel=push`](notify-preview-tool/index.html) | Mobile push notifications · iOS lock-screen + banner, Android heads-up + shade · collapsed & expanded (big picture) · app icon/name · up to 3 action buttons · wallpaper picker · 6 templates per vertical |
| **In-App** | [`notify-preview-tool/?channel=inapp`](notify-preview-tool/index.html?channel=inapp) | MoEngage-style in-app messages over a dimmed app screen · Modal · Banner (top/bottom) · Full-screen · Bottom sheet · Image-only · headline/body/image · 1–2 CTAs (primary/secondary/text) · close button · 6 templates per vertical |
| **In-App Gamification** | [`notify-preview-tool/?channel=game`](notify-preview-tool/index.html?channel=game) | Premium dark "reward moment" takeovers (CRED / Cult-UI style) · **Scratch card** · **Spin the wheel** · **Mystery box** · **Slot machine** · headline/sub/prize/CTA · **Simulate** to reveal the win (scratch fades, wheel spins, box opens, reels land) with confetti · editable wheel segments · 4 templates per vertical |


## Real product photos (one-time setup)

By default the tools render clean product **illustrations** (always relevant,
self-contained). To use **real photos** instead:

**Easiest (no terminal):** open `setup.html` on your deployed site (e.g.
`https://your-site.vercel.app/setup.html`), paste your Pexels key, click the
button, and copy the result — then commit it as `images.js` (or paste it to Claude).

**Or via terminal:** resolve them once from Pexels:

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

## Generate with AI (optional, free)

Each tool has an **✨ AI** button in the top bar. It opens a prompt box on the right —
type a short brief ("Diwali sale, 40% off, urgent tone") and it writes **one** on-brand
message and drops it straight into the editor, where you can tweak every field. The copy
is written by a senior-copywriter prompt (clever hooks, tasteful emoji, real channel
length, banned filler) with per-channel voice notes — and it works on **In-App
Gamification** too (headline / prize / CTA for the game). For the image it emits both a
short fallback keyword **and** a precise, literal search phrase (`imageQuery`) that drives
a sharper Pexels lookup — see "AI photos" below.

**The brief drives the studio.** You don't have to set the sidebar first — the AI reads
the brief and switches everything to match. Name a **channel** ("give me an *in-app* for…",
"an *email*…", "a *scratch card*…") and it jumps to that channel (hopping to the right tool
if needed); imply an **industry** ("for a *grocery* retailer") and the Industry/Sub-industry
selectors follow; the **brand** and **logo** are set from the brief too (a real brand gets
its real logo — see "Brand logos"). So *"an in-app abandoned-cart for a grocery store"*
typed while you're on WhatsApp/Travel lands as an In-App message for a grocery brand, no
manual switching. If an industry isn't one of the built-in verticals, it still switches the
channel + brand + copy so you can fine-tune the rest by hand.

**Setup (one-time, no terminal):**

1. Get a **free** key — either **Groq** (recommended: generous free tier, no card) at
   https://console.groq.com/keys, or **Google Gemini** at https://aistudio.google.com/apikey.
2. In Vercel → your project → **Settings → Environment Variables**, add
   `GROQ_API_KEY` (or `GEMINI_API_KEY`) = your key, then redeploy.
3. That's it — the **✨ AI** button now works on the live site.

If both keys are set, Groq is used (it has the roomier free tier); set `AI_PROVIDER=gemini`
to force Gemini. The key lives only on the server (in `api/generate.js`, a Vercel function)
and is never exposed in the browser. The generator is deliberately locked down: it returns
exactly one message that matches a fixed schema — no browsing, no tools, no conversation —
with a per-request length cap and best-effort rate limiting, and it tries a couple of free
models before giving up. If no key is set, the button just shows a friendly "add your key"
note and nothing else changes. Optional env vars: `GROQ_MODEL` (default
`llama-3.3-70b-versatile`), `GEMINI_MODEL` (default `gemini-2.0-flash`), `AI_PROVIDER`,
`CS_ALLOW_ORIGINS`.

**AI photos (optional, sharper):** the AI returns a precise `imageQuery` (e.g. *"festive
silk saree flatlay"*, *"iced caramel coffee cup"*) describing exactly what should be in
frame. `api/photo.js` (a Vercel function, key server-side) searches Pexels for that
phrase, pulls a **pool of candidates**, and picks the best by matching the photo's own
alt-text to the query and preferring high resolution — instead of blindly taking the
first hit. It also honours **orientation** (portrait for full-screen / image-only,
landscape elsewhere). A rich query beats the generic pre-resolved keyword, so AI images
are much more on-point. To enable it, add `PEXELS_KEY` (your free Pexels key) in Vercel
and redeploy. Results are cached in the visitor's browser, so each phrase is fetched at
most once — Pexels is barely touched. Without `PEXELS_KEY` set, subjects fall back to the
pre-resolved keyword photo, then a clean illustration; nothing breaks.

**Brand logos:** every business gets an auto-generated monogram logo (no setup). When the AI
recognizes a **real** brand it also returns its domain, and `api/logo.js` fetches the real
logo. Clearbit's old keyless API is gone, so this uses **[Logo.dev](https://logo.dev)** (free
tier 500k/month) — add its **publishable** token as `LOGODEV_KEY` in Vercel for crisp logos.
With no key it still falls back to **keyless favicons** (so real brands get an icon), and
otherwise the generated monogram is used.

## How it works

- **Pick a channel** (hub tabs, or open a folder).
- **Start from a template** — every channel ships with ready-made, realistic
  messages (OTP, promo, order confirmation, appointment, product carousel, list
  menu, …). Pick one, then tweak.
- **Edit** the sender/business identity, the conversation (add/remove/reorder
  message bubbles, set each bubble's type and who it's from), logo, verified
  badge, timestamps, theme.
- **Export** — one-click **PNG** (2×) or **copy to clipboard**, ready for a slide.
- **Record** — capture a **screen recording of just the device** (mobile or desktop
  view — no sidebar or browser chrome) as a `.webm`. Click **Record**, approve the
  one-time "share this tab" prompt, demo your flow (scroll, tap Simulate buttons…),
  then click **Stop** to download. Uses the browser's Region Capture API — works in
  **Chrome or Edge**; other browsers record the whole tab instead.

### Message types supported

- **SMS** — text, MMS image
- **RCS** — text, image, rich card, carousel (+ suggestion chips on any message)
- **WhatsApp** — text, image + caption, template (header/body/footer + buttons),
  product carousel, list menu, document
- **Push** — iOS lock-screen & banner, Android heads-up & notification shade;
  collapsed or expanded (big-picture) with a large image; up to 3 action buttons
- **In-App** — modal, slim banner (top/bottom), full-screen takeover, bottom sheet,
  image-only; headline/body/image, 1–2 CTAs (primary/secondary/text), close button
- **In-App Gamification** — scratch card, spin the wheel, mystery box, slot machine;
  premium dark reward takeover with headline/sub/prize/CTA; **Simulate** to play (tap to
  reveal the prize) with confetti; wheel segments editable (one per line, `*` marks the
  winning wedge)

Buttons use a simple one-per-line format: `Label | reply|url|call | value`.
Carousel cards: `imageURL | title | subtitle | buttonLabel | buttonValue` per line.
Templates pre-fill these so you can see the format.

## Notes

- Each tool is a static HTML file; a few shared files at the repo root (`images.js`,
  `recorder.js`, `gif-encoder.js`) are loaded via `<script>`. The root `index.html`
  redirects into the messaging tool; switch tools/channels from the **Channel** dropdown.
- **Record** captures the device view to `.webm`, then a review panel lets you **trim**
  and export **WebM** or **GIF** (GIF encoded in-browser via the bundled `gif-encoder.js`).
  Recording needs Chrome/Edge (Region Capture); other browsers record the whole tab.
- PNG export uses [html2canvas](https://html2canvas.hertzen.com/) from a CDN. For a
  **fully offline** build, drop `html2canvas.min.js` next to the tool and repoint the
  `<script src="…">` tag. If a remote image ever blocks cross-origin capture, the
  on-screen preview is always correct — use a native OS screenshot as a fallback.
- All previews are mockups for internal creative review — not affiliated with or
  endorsed by Google, Apple, Meta/WhatsApp.
