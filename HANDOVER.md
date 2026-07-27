# Handover — AI "Generate" identity & image drift (brand-website feature)

_Last updated: 2026-07-27. Owner asked to pause here, hand over, and have a fresh
session investigate the "Generate with AI" identity/image problems before we go further._

## TL;DR

The **brand-website field** (added this session) was meant to pin smaller brands so
the AI gets them right. Instead the AI section now behaves worse than before it
existed: for the **same** brief + website, the business name comes out **correct one
time, stale the next, invented the next**, and the copy/image drift off-topic (into
gaming/electronics for a shoe brand). The owner's instinct — "we were better off
before the website field" — is reasonable; rolling this part back is a valid option
(see **Rollback**). A fresh session should investigate with the prompt at the bottom
and come back with options before changing more code.

## What the product is (quick orientation)

- React 19 + Vite + TS SPA at `studio/`. Zustand store: `studio/src/store/useStudio.ts`.
- 12 marketing channels (WhatsApp, RCS, SMS, Push, In-App, Game, Gmail, OSM, Instagram,
  Facebook, Web Push, Cards). Each has `panels.tsx` / `*Preview.tsx` / `templates.ts`.
- "Generate with AI" panel: `studio/src/shell/AiPanel.tsx` → POSTs a brief to the
  serverless generator `api/generate.js` (Groq if `GROQ_API_KEY` set, else Gemini;
  schema-locked JSON) → `studio/src/lib/applyAi.ts` maps the one message onto the
  active channel's store slice, the same way built-in templates do.
- Campaign continuity: `studio/src/lib/aiCampaign.ts` (added this session) auto-generates
  other channels for the same brand when you switch to them.
- Deploy: Vercel, from `main`. **API changes only take effect after redeploy** — several
  confusing test results this session were the previous deploy still being live.
- CI: `.github/workflows/ci.yml` runs `studio` build + `studio/tests/smoke.mjs`.

## Reproduced symptom (owner's screenshots, all WhatsApp, brief "50% off on new models")

| Brand website typed | Business name shown | Copy topic | Image |
|---|---|---|---|
| `birkenstock` | **Birkenstock** (correct) | suede sandals | sandals |
| `birkenstock` | **Stadium Goods** (stale, from an earlier test) | "drops in the game" | Dreamcast console |
| `birkenstock.com` | **SmartStyle** (invented) | "gaming laptops" | gaming laptop |

Same input, three different identities. The image always matches the (wrong) copy, so
**image search itself is working** — the defect is upstream, in **which brand/industry
the model writes for**.

## Preliminary diagnosis (hypotheses, most→least likely)

1. **Stale identity is fed back into every generation.** `applyIdentity()`
   (`studio/src/lib/applyAi.ts:57`) writes the model's `brand` and `industry` into the
   store on every generation and they persist. Both `AiPanel.generate()` and
   `aiCampaign.fetchGeneratedMessage()` then send `brand: s.brand.name` **and**
   `industry: s.industry` back to `api/generate.js` on the next run. So once a prior
   test set brand=`SmartStyle`, industry=`gaming` (owner tested telecom/gaming earlier),
   those ride along as strong context. The pinned website is a **third, competing**
   signal, and the model resolves the conflict inconsistently — hence Birkenstock vs
   Stadium Goods vs SmartStyle for identical input. **This is the core issue and it
   predates the website field; the website field just made it obvious by raising the
   expectation that the site fully drives identity.**

2. **Pinned site is authoritative in words only, not in the payload.** The prompt says
   the site "overrides any brand from the brief or the app" (`api/generate.js`
   `systemPrompt`, the `ctx.site ? …` line), but we still send the stale
   `brand`/`industry` and still tell the model "keep the current brand if the brief
   implies no business." A capable model would obey; Groq's llama-3.1/3.3 under
   conflicting context sometimes doesn't.

3. **Bare-word "websites" without a TLD are accepted as domains.** `cleanDomain()`
   (`studio/src/lib/media.ts:42`) does not require a dot, so `birkenstock` (no `.com`)
   is passed as `domain`. `api/generate.js` then sets `message.domain = "birkenstock"`
   (not resolvable → logo lookup fails, a stale logo lingers) and the prompt quotes a
   non-domain as the "website." Decide whether a no-dot value should be treated as a
   brand-name hint instead of a domain, or ignored.

4. **"new models" is genuinely ambiguous** ("new models" = product models, or console/
   laptop models). With a gaming/electronics industry still in state (#1), the model
   reads it as gaming. Not a bug on its own, but it interacts badly with #1.

5. **Owner's hypothesis — "keyword not being used / image search broken by the site."**
   Likely **not** the mechanism: images render and match the copy. The image just
   matches the *wrong* copy. Worth confirming but not the primary lead.

Not yet ruled out: the **"New image"** button re-dispatches the stored `lastAi` message
(`studio/src/lib/aiCampaign.ts` `regenerateImage`); if `lastAi` is stale it would
re-apply an old brand/copy with a new photo. Confirm whether the screenshots came from
Generate or from New image.

## Key files & code paths

- `api/generate.js` — `systemPrompt(ctx)` (identity + image rules), `schemaFor(channel)`,
  the `ctx.site` handling, and `message.domain = ctx.site` near the `send(200)`.
- `studio/src/shell/AiPanel.tsx` — `generate()`: builds the POST (`brand`, `industry`,
  `brief`, `domain`), resolves the logo, calls `applyAiMessage`, `startAiCampaign`.
- `studio/src/lib/applyAi.ts` — `applyIdentity()` (persists brand/industry),
  `applyAiMessage()` (dispatch + `setBrandIdentity` + `lastAi`), `producedImage()`.
- `studio/src/lib/aiCampaign.ts` — `fetchGeneratedMessage()`, `generateChannelForCampaign()`,
  `useAiChannelSync()`, `regenerateImage()`.
- `studio/src/store/useStudio.ts` — `setIndustry` (resets brand identity on industry
  change only), `setBrandIdentity`, campaign state (`aiBrief`/`aiSite`/`aiLogo`/`aiDone`/
  `lastAi`), `setBrand`.
- `studio/src/lib/media.ts` — `cleanDomain`, `resolveBrandLogo`, `guessDomain`, `AiMessage`.

## Rollback options (all viable — owner explicitly asked)

The brand-website behavior is entangled with other good changes from the same commits
(New-image button, cycling tips, collapsed examples, campaign continuity), so prefer a
**surgical** rollback over reverting whole commits.

- **A. Surgical (recommended if pausing the feature):** remove the website field and its
  threading only — the `site` input in `AiPanel.tsx`, `aiSite` in the store, the
  `domain` param in both fetch paths, and the `ctx.site` block + prompt line in
  `api/generate.js`. Keep New-image, tips, examples, campaign. ~small, mechanical.
- **B. Fix forward (recommended if keeping the feature):** make the site the single
  source of truth — when a site (or brand) is pinned, **stop sending the stale
  `industry`**, send the pinned brand as `brand`, and reset `industry`/`brand` context
  so it can't leak from a previous run; require a real domain (a dot) before treating a
  value as a site. Consider a "clear / new brand" affordance in the panel.
- **C. Full git revert:** revert `a84b18d`, `42d317d`, `ea76753`, `c90eb8a`, `cd093a4`
  (and `9efd9b4` for the campaign). Loses the bundled improvements — least preferred.

Relevant commits this session (newest first): `cd093a4` revert image restriction ·
`c90eb8a` trust model for brand id · `ea76753` brand spacing · `42d317d` lock brand to
site + collapse examples · `a84b18d` AI panel (New-image, website field, examples, tips,
sensible-images) · `9efd9b4` campaign continuity.

## How to verify any change

```
cd studio && npm run build && node tests/smoke.mjs     # must print "Smoke test passed"
node -c api/generate.js                                 # API is CommonJS, syntax-check it
```
Remember: `api/*` changes need a Vercel redeploy of `main` before they show on the live
site. Test the live behavior only after the deploy lands.

## Working agreement / conventions (for the next session)

- Branch: `claude/studio-channel-dropdown-fix-evp6aj`. Owner works trunk-based: fast-
  forward `main` from the branch, `git push origin main`, keep the branch synced.
- Commits must be authored `Claude <noreply@anthropic.com>` (a stop-hook enforces this;
  if it complains, `git commit --amend --no-edit --reset-author` then force-with-lease).
- White-label only: fictional demo brands; don't ship real logos as assets.
- Don't put the model identifier in commits/PRs/code.

## Investigation prompt for the fresh session

> See the copy-paste block the owner has — it's reproduced in the chat message that
> accompanied this handover, and below.
