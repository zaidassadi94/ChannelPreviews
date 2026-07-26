/* Stored (base64) product photos, keyed by the same keywords as pximg.ts's PXIMG map.
 *
 * EMPTY by default. Populate it with `node scripts/prefetch-photos.mjs`, which downloads
 * the curated Pexels photos and writes them here as self-contained data: URIs. Once
 * populated, `tphoto()` (lib/photo.ts) prefers these — so templates show real photos
 * OFFLINE and in the artifact preview, with zero network calls, and Export/Record stay
 * CORS-clean.
 *
 * Why it ships empty: this build environment's egress proxy blocks images.pexels.com, so
 * the harvest can't run here. Run the prefetch on any machine (or a Vercel prebuild) that
 * can reach Pexels; until then `tphoto()` falls back to the curated remote URL, then to
 * the gradient placeholder — nothing breaks. */
export const PHOTO: Record<string, string> = {}
