# Messaging Preview Studio — SMS · RCS · WhatsApp

A single self-contained HTML file that renders pixel-accurate **SMS, RCS, and
WhatsApp** conversation mockups for deck screenshots. No backend, no build, no AI.

Open `index.html`, or deep-link a channel with `?channel=sms|rcs|whatsapp`.

## Features

- **Three channels**, switchable via tabs:
  - **SMS** — iOS Messages & Android (Google Messages) skins, text + MMS image,
    live GSM-7 / Unicode character + segment counter.
  - **RCS** — Google Messages with a verified business header, rich cards,
    swipeable carousels, suggested reply/action chips, typing indicator.
  - **WhatsApp** — Business chat with the green header + verified badge, template
    messages (header image / body / footer / buttons), quick-reply and
    call-to-action buttons, product carousels, interactive list menus, documents,
    and light/dark themes.
- **Templates** per channel (OTP, promo, delivery, appointment, order
  confirmation, product catalog, list menu, feedback, …) — pick one, then tweak.
- **Conversation editor** — add / delete / reorder message bubbles; set each
  bubble's type and whether it's from the business (incoming) or the customer
  (outgoing).
- **Business identity** — name, logo (upload or auto monogram), status line,
  phone/sender ID, verified badge.
- **iPhone & Android** device frames, light/dark, date chip, encryption notice,
  typing indicator.
- **Export** to PNG (2×) or copy to clipboard.

## Editing formats

- **Buttons** — one per line: `Label | reply|url|call | value`
- **Carousel cards** — one per line: `imageURL | title | subtitle | buttonLabel | buttonValue`
- **List items** — one per line: `Title | description`
- **Suggested replies (RCS)** — comma-separated
- **Text** supports WhatsApp-style `*bold*` and `_italic_`, and auto-links URLs.

## Notes

- PNG export uses html2canvas from a CDN; for offline use, host the library
  locally and repoint the `<script>` tag. Remote images that block cross-origin
  requests may not appear in the PNG — the on-screen preview is always correct, so
  a native OS screenshot is the fallback.
- Mockups for internal creative review only — not affiliated with Google, Apple,
  or Meta/WhatsApp.
