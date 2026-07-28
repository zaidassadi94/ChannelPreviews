# Project guidance for Claude

## Start of every session — read these first
1. **`HANDOVER.md`** (repo root) — current state, what shipped, env vars, where the code lives.
2. **`deferred.md`** (repo root) — everything parked / to-discuss + improvement ideas. Read it
   before picking up new work, and confirm items with the owner before building.
3. **`studio/HANDOFF.md`** — architecture, the per-channel recipe, gotchas, session logs.

## Git workflow (owner's standing preference)
- **Always push when work is done.** Don't leave finished changes sitting locally — commit and push every time a task is complete.
- **Push to `main`.** The owner works trunk-based here and wants completed work on `main` (fast-forward from the working branch, then `git push origin main`). This preference is explicit and standing across sessions.
