export {}

/** Vanilla libraries loaded as classic <script>s from `public/` (index.html):
 *  the shared screen recorder + its review studio, and the vendored gifenc it uses.
 *  Both are optional — absent inside the artifact/CSP or on non-Chromium — so every
 *  access is guarded. */
declare global {
  interface Window {
    ChannelStudioRecorder?: {
      init: (opts: {
        button: HTMLElement
        getEl: () => HTMLElement | null
        filename: () => string
        toast: (m: string) => void
      }) => void
      _openReview?: (blob: Blob, type: string) => void
    }
    gifenc?: unknown
  }
}
