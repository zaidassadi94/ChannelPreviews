/* Detect an explicitly-requested channel in a brief (ported from ai.js CH_WORDS). In the
   single-page studio there's no cross-tool handoff — the panel just setChannel()s in place. */

const CH_WORDS: [RegExp, string][] = [
  [/\b(web\s*push|browser\s*(push|notification|notif)|website\s*(push|notification)|desktop\s*notification)\b/, 'webpush'],
  [/\bfacebook\b|\bfb\s*(ad|ads|feed|story|stories|post)\b/, 'facebook'],
  [/\b(instagram|insta)\b|\big\s*(ad|ads|story|stories|feed|post)\b|\b(story|feed)\s*ad\b|\bsponsored\s*(post|ad)\b/, 'instagram'],
  [/\b(osm|onsite|on-site|website\s*(popup|banner|message)|web\s*popup|exit[\s-]?intent|cookie\s*consent)\b/, 'osm'],
  [/\b(in[\s-]?app|inapp)\b/, 'inapp'],
  [/\b(scratch\s*card|spin\s*the\s*wheel|spin\s*wheel|slot\s*machine|mystery\s*box|gamif\w*|reward\s*(game|wheel))\b/, 'game'],
  [/\b(push|lock[\s-]?screen)\b/, 'push'],
  [/\b(e-?mail|gmail|inbox|subject\s*line|newsletter)\b/, 'gmail'],
  [/\b(whats\s?app|wa\b)\b/, 'whatsapp'],
  [/\brcs\b/, 'rcs'],
  [/\b(sms|text\s*message|text\s*msg)\b/, 'sms'],
]

export const CH_LABEL: Record<string, string> = {
  whatsapp: 'WhatsApp', rcs: 'RCS', sms: 'SMS', push: 'Push', inapp: 'In-App',
  game: 'Gamification', gmail: 'Gmail', instagram: 'Instagram Ads', facebook: 'Facebook Ads', osm: 'Onsite',
  webpush: 'Web Push',
}

export function detectChannel(brief: string): string | null {
  const b = ' ' + (brief || '').toLowerCase() + ' '
  for (const [re, ch] of CH_WORDS) if (re.test(b)) return ch
  return null
}
