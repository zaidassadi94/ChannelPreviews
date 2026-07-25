/* Small shared helpers (ported from the tools' inline utils). */

const AV = ['#5b6abf', '#e07a5f', '#3aa99f', '#d96a97', '#7b68c9', '#8a63d2', '#2aa9c9', '#5aab6a', '#e0a34e', '#a1887f', '#4a90d9', '#0b8043', '#e26b3a']

export function hueOf(s: string): number {
  let h = 0
  const t = s || '?'
  for (let i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) >>> 0
  return h % 360
}
export function avColor(n: string): string {
  let h = 0
  const s = n || '?'
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return AV[h % AV.length]
}
export function initial(n: string): string {
  const t = (n || '?').trim()
  return t ? t[0].toUpperCase() : '?'
}

/** Random 6-digit one-time code (never a hardcoded value). */
export function genOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000))
}

const escXml = (s: string) => (s == null ? '' : String(s)).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** SVG gradient placeholder image as a data: URI (headline + optional subtitle). */
export function phImg(text: string, sub: string | null, hue?: number, w = 600, h = 340): string {
  if (hue == null) hue = hueOf(text)
  const h2 = (hue + 38) % 360
  const fs = Math.round(Math.min(w / 8, 46))
  const fs2 = Math.round(fs * 0.62)
  const t = escXml(text || '')
  const s2 = sub ? escXml(sub) : ''
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'>` +
    `<defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='hsl(${hue},66%,56%)'/><stop offset='1' stop-color='hsl(${h2},62%,42%)'/></linearGradient></defs>` +
    `<rect width='100%' height='100%' fill='url(#g)'/>` +
    `<circle cx='${Math.round(w * 0.84)}' cy='${Math.round(h * 0.2)}' r='${Math.round(h * 0.55)}' fill='rgba(255,255,255,0.08)'/>` +
    `<circle cx='${Math.round(w * 0.12)}' cy='${Math.round(h * 0.9)}' r='${Math.round(h * 0.4)}' fill='rgba(0,0,0,0.06)'/>` +
    `<text x='50%' y='${s2 ? '45%' : '53%'}' fill='#fff' font-family='Inter,Arial,sans-serif' font-weight='700' font-size='${fs}' text-anchor='middle' dominant-baseline='middle'>${t}</text>` +
    (s2 ? `<text x='50%' y='63%' fill='rgba(255,255,255,0.92)' font-family='Inter,Arial,sans-serif' font-weight='600' font-size='${fs2}' text-anchor='middle' dominant-baseline='middle'>${s2}</text>` : '') +
    `</svg>`
  return 'data:image/svg+xml,' + encodeURIComponent(svg)
}

export function brandMark(name: string, size = 96): string {
  const bg = avColor(name)
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}'>` +
    `<rect width='100%' height='100%' fill='${bg}'/>` +
    `<text x='50%' y='54%' fill='#fff' font-family='Inter,Arial,sans-serif' font-weight='700' font-size='${Math.round(size * 0.44)}' text-anchor='middle' dominant-baseline='middle'>${escXml(initial(name))}</text>` +
    `</svg>`
  return 'data:image/svg+xml,' + encodeURIComponent(svg)
}

/* ---- button / card parsing (WhatsApp uses `Label | type | value` per line) ---- */
export type BtnType = 'reply' | 'url' | 'call' | 'copy' | 'map'
export interface Btn { label: string; type: BtnType; value: string; response: string }

export function parseButtons(raw: string): Btn[] {
  return (raw || '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      // "Label | type | value >> response"  (>> makes it branch in Simulate)
      const [main, response = ''] = l.split('>>').map((x) => x.trim())
      const p = main.split('|').map((x) => x.trim())
      let type = (p[1] || 'reply').toLowerCase() as BtnType
      if (!['reply', 'url', 'call', 'copy', 'map'].includes(type)) type = 'reply'
      return { label: p[0] || '', type, value: p[2] || '', response }
    })
    .filter((b) => b.label)
}
