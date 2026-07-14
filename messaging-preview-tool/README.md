# Channel Studio — Messaging (SMS · RCS · WhatsApp)

A single self-contained HTML file that renders pixel-accurate **SMS, RCS, and
WhatsApp** conversation mockups for deck screenshots. No backend, no build, no AI.

Open `index.html`, or deep-link a channel with `?channel=sms|rcs|whatsapp`.

## Pick your context (3 dropdowns)

- **Channel** — WhatsApp · RCS · SMS
- **Industry** — E-commerce & Retail · Banking & Finance · Media & Entertainment ·
  Travel & Hospitality · Food & Delivery · EdTech · Gaming · Telecom
- **Sub-industry** — appears only where it matters (e.g. BFSI → Retail Banking /
  Insurance / Fintech; Travel → Airlines / Hotels & OTA)

Each combination loads **ready-made, industry-specific templates**. Templates
tagged **FLOW** are interactive branching conversations.

## Simulate (branching conversations)

Hit **Simulate** and the preview becomes clickable. Tap a WhatsApp quick-reply /
list item, or an RCS suggestion chip, and the flow advances: your choice appears
as an outgoing bubble, and the business's branched reply follows. Different
options lead to different replies — that's the branch. **Reset** clears it.

Author branches yourself by adding `>> your reply` after any option:

```
Confirm | reply >> ✅ All set! Your appointment is confirmed.
Reschedule | reply >> Sure — reply with a new date and time.
```

## Faithful to each channel

- **WhatsApp** — real green (light) / dark (dark) header, doodle wallpaper,
  template messages (header image / body / footer), attached CTA buttons (link ·
  call · copy code), separate quick-reply buttons, product carousels, interactive
  list menus, documents, and **platform-correct input bars** for both iPhone and
  Android.
- **RCS** — Google Messages (Android) **and** iOS Messages (iPhone) — the device
  toggle works. Verified-business header, **RBM verified-agent banner** (logo,
  description, verified pill), rich cards, carousels, suggestion chips, typing.
- **SMS** — iOS Messages & Android (Google Messages), text + MMS image, live
  GSM-7 / Unicode segment counter.

## Also

- **iPhone / Android** device frames, **Light / Dark** themes, scale-to-fit so the
  whole phone is always visible.
- **Sender / business** — name, logo (upload or auto monogram), status line,
  phone / sender ID, RCS agent description, verified badge, RBM agent banner.
- **Export** to PNG (2×, full-resolution) or copy to clipboard.

## Editing formats

- **Buttons** — `Label | reply|url|call|copy | value` (one per line; add `>> reply` to branch)
- **Carousel cards** — `imageURL | title | subtitle | buttonLabel | buttonValue`
- **List items** — `Title | description` (add `>> reply` to branch)
- **Suggested replies (RCS)** — comma-separated, or one per line with `>> reply`
- Text supports `*bold*`, `_italic_`, `~strike~`, and auto-links URLs.

Mockups for internal creative review only — not affiliated with Google, Apple,
or Meta/WhatsApp.
