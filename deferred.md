# Deferred / to-discuss

Open items that were **discussed and consciously parked** this session, plus improvement
ideas surfaced along the way. Nothing here is blocking — the app builds, the smoke test
passes, and everything shipped is live-on-`main`. A new session should read this **and**
`HANDOVER.md` before picking up work, and confirm each item with the owner before building.

_Last updated: 2026-07-28._

---

## Agreed but not yet built

### 1. Gmail "Designs" — a rich responsive-template gallery (owner agreed)
Add a new **left-nav section on Gmail ("Designs")** with a small gallery of rich, on-brand
email templates (hero → product grid → promo-code strip → category tiles → member banner →
footer), the kind of thing a real brand sends — see the Nike email the owner pasted.

- **Build them fluid-hybrid (inline styles + max-width + inline-block "ghost tables"), so
  they reflow on mobile WITHOUT `@media` queries.** That means they render correctly in our
  preview *and* in Outlook, and they export cleanly (no iframe needed — only pasted HTML
  needs the iframe; see `HANDOVER.md`).
- Reuse what the AI already returns: the product **cards** (same shape as carousels), brand
  color, logo/wordmark. Add a couple of schema fields (promo code, sections) if needed.
- Keep them **editable** — structured fields in Compose, not a wall of HTML.
- Plan: prototype **one** rich template end-to-end (AI → editable fields → responsive
  preview), show the owner, then expand. Medium effort.
- Tracked as task #12 in the last session.

### 2. Brand-API key rotation (+ optional multi-provider) — offered, owner leaning yes
To stretch the Logo.dev **Brand API** wordmark quota (see `HANDOVER.md` → wordmark):
- **Key rotation (recommended, ~15 lines):** read a comma-separated list
  `LOGODEV_SECRET = sk_a,sk_b,sk_c` in `api/logo.js`; try each in order, skip to the next on
  **429 / quota**, remember the spent one per warm instance. Degrades to the text wordmark if
  all are spent. No client change; forward-compatible (start with one key, add more later).
- **Multi-provider fallback (bigger):** Logo.dev → Brandfetch → LogoKit for provider-level
  redundancy (not just more quota). More code — each returns a different JSON shape. Only if
  the owner wants redundancy beyond quota.
- Note: caching already stretches quota hard — wordmarks are cached per **unique brand**
  (client `localStorage` + edge `s-maxage=7d`), so "100/month" ≈ ~100 distinct brands/month,
  not 100 generations.

---

## Needs a decision / owner input

### 3. Logo.dev Brand-API — live verification (blocked on a secret key)
The wordmark auto-fetch (`api/logo.js?wordmark=1` → `api.logo.dev/brand/{domain}`) is wired
but **unverified against a live response** because the Brand API needs a **secret key
(`sk_…`) on a Pro/Enterprise plan** — separate from the publishable image token; free returns
403. When the owner adds `LOGODEV_SECRET` in Vercel:
- Confirm the response field mapping — I assumed **`logo` = the wordmark URL** (vs `brandmark`
  = icon). Adjust `api/logo.js` if their shape differs.
- Confirm the actual free-tier terms (the owner mentioned "free 100/month"; docs I found say
  Brand API is paid-only — reconcile before relying on it).
- Until then it **falls back to the styled brand-name text wordmark**, which looks good.

### 4. Generic content-image pickers — auto-show or stay search-first?
Content image fields **with a subject** auto-load photos (carousel cards → product title;
Gmail Compose image → the AI's `imageQuery`). Fields **without** an obvious subject (e.g. a
WhatsApp template header, push image) currently show a **ready search box, no auto-fetch** —
deliberately, to avoid firing dozens of Pexels requests when a panel opens, and to avoid an
ugly "no results" for demo brands. If the owner wants them to auto-show something, options:
seed with the brand name, or the message headline (weaker as a photo query). Owner's call.

---

## Lower priority / optional

### 5. WhatsApp `list` and `document` message types
The legacy tool's WhatsApp had `list` (List menu) and `document` types; the studio restored
`carousel` but not these two. They have **no AI path and no preset** (they were manual
composer types), so low value. Add only if the owner wants them for manual composing.

### 6. The stale-identity reset (Option B from the original diagnosis)
The AI brand/identity drift was fixed by **Option A** (removing the competing brand-website
field) + brand-first image queries. But the deeper mechanism from the diagnosis — every
generation still sends the previous run's `brand`+`industry` back to `/api/generate` as
"current app" context — was **not** reset (that was Option B). Drift is much reduced, but if
it ever recurs, the lever is: when a generation's brand differs from the stored one, clear the
stale campaign/industry so it can't leak into the next run (a "new brand / clear" affordance).

---

## Improvement ideas (noticed, not requested)

- **Per-card "Select image" in the AI panel for carousels.** The AI-panel photo picker is
  hidden for carousels (per-card picking lives in the Chat/Compose editor instead). Fine as
  is, but a per-card entry point from the AI panel could be nicer.
- **Group-1 audit leftovers are done** (land-on-copy, Creative→Content, Gmail Content merge).
  The remaining audit idea is the **WhatsApp format-as-template tiles + a shared `FormatPicker`
  component** reused across WhatsApp/RCS/SMS and OSM/IG/FB — turn the small "type" segmented
  control into visual template-like tiles so every channel chooses format the same way.
  Medium; start WhatsApp-only, then unify. (This is "Group 2 / D" from the audit.)
- **Deploy lag:** the live Vercel site was repeatedly a build or two behind during the
  session, which caused confusion ("the change isn't there"). Worth confirming the Vercel
  auto-deploy on `main` is actually firing promptly, and that `api/` changes (which need a
  redeploy) are picked up.
