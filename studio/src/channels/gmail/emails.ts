import { type EmailPack, emailPackFor, confirmFor, cap } from '@/content/model'
import { genOtp } from '@/lib/util'
import { tphoto } from '@/lib/photo'

/* Email HTML builders (ported from gmail-preview-tool). Produce inline-styled HTML
   strings rendered into the reading pane. Placeholder images via phImg (offline-safe). */

const ePhoto = (kw: string, _seed: number | string) => tphoto(cap(kw), 600, 300)
const eBtn = (p: EmailPack, l: string) => `<a href="#" style="display:inline-block;background:${p.accent};color:#ffffff;text-decoration:none;padding:13px 30px;border-radius:9px;font-size:15px;font-weight:700;">${l}</a>`
/** The email header. Uses the full brand logo when one is available (that's the
    real mark a recipient recognises); falls back to the brand name in the accent
    color when there's no logo. */
const brandHeader = (brand: string, accent: string, logo?: string) => `<div style="padding:20px 30px;text-align:center;border-bottom:1px solid #f1f1f1;">${logo ? `<img src="${logo}" alt="${brand}" style="max-height:34px;max-width:180px;width:auto;vertical-align:middle;">` : `<span style="font-size:20px;font-weight:800;letter-spacing:-.4px;color:${accent};">${brand}</span>`}</div>`
const eBrand = (p: EmailPack) => brandHeader(p.brand, p.accent, p.logo)
const eHeroImg = (p: EmailPack, seed: number | string) => `<div style="height:220px;overflow:hidden;background:linear-gradient(135deg,${p.accent},#3a3a5a);"><img src="${ePhoto(p.brand, seed)}" width="600" height="220" style="width:100%;height:100%;object-fit:cover;display:block;"></div>`
const eGrid = (p: EmailPack) => `<div style="padding:14px 22px;">` + p.products.map((pr, i) => `<div style="display:inline-block;width:46%;vertical-align:top;margin:1.5%;text-align:center;"><div style="height:120px;border-radius:10px;overflow:hidden;background:linear-gradient(135deg,${p.accent},#3a3a5a);"><img src="${ePhoto(pr[0], i + 10)}" width="260" height="120" style="width:100%;height:100%;object-fit:cover;display:block;"></div><div style="font-size:14px;font-weight:600;color:#111;margin-top:8px;">${pr[0]}</div><div style="font-size:14px;color:${p.accent};font-weight:700;">${pr[1]}</div></div>`).join('') + `</div>`
const eOrderTable = (p: EmailPack) => { const rows = p.products.map((pr) => `<tr><td style="padding:11px 0;border-bottom:1px solid #f1f1f1;color:#333;font-size:14px;">${pr[0]}</td><td style="padding:11px 0;border-bottom:1px solid #f1f1f1;text-align:right;color:#333;font-size:14px;">${pr[1]}</td></tr>`).join(''); return `<table style="width:100%;border-collapse:collapse;">${rows}<tr><td style="padding:13px 0;font-weight:800;color:#111;">Total</td><td style="padding:13px 0;text-align:right;font-weight:800;color:${p.accent};">${p.total}</td></tr></table>` }
/** The default unsubscribe / footer copy — editable per email (Compose mode). */
export const DEFAULT_EMAIL_FOOTER = "You're receiving this because you subscribed.\nUnsubscribe · Manage preferences"
const escHtml = (s: string) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const eWrap = (inner: string, footer: string = DEFAULT_EMAIL_FOOTER) => `<div style="background:#eef0f3;padding:20px 12px;font-family:Arial,Helvetica,sans-serif;"><div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.08);">${inner}</div><div style="max-width:600px;margin:14px auto 0;text-align:center;color:#9aa0ac;font-size:12px;line-height:1.6;">${escHtml(footer).replace(/\n/g, '<br>')}</div></div>`

export interface EmailBuild { sender: string; from: string; category: string; subject: string; snippet: string; html: string }
export interface GmailTemplate {
  name: string
  kind: 'Promotional' | 'Transactional'
  icon: string
  desc: string
  build: (p: EmailPack, ctxId: string) => EmailBuild
}

export const GMAIL_TEMPLATES: GmailTemplate[] = [
  {
    name: 'Seasonal offer', kind: 'Promotional', icon: '🏷️', desc: 'Hero image + code + CTA',
    build: (p) => ({ sender: p.brand, from: p.from, category: 'promotions', subject: `${p.brand}: ${p.offer} 🎉`, snippet: `${p.offer}${p.code ? ` — use code ${p.code}` : ''}. Limited time only.`, html: eWrap(eBrand(p) + eHeroImg(p, 3) + `<div style="padding:32px 34px;text-align:center;"><h1 style="margin:0 0 10px;font-size:26px;color:#111;">${p.offer}</h1><p style="margin:0 0 8px;font-size:15px;color:#555;">Treat yourself — this week only.</p>${p.code ? `<div style="margin:16px 0;display:inline-block;border:2px dashed ${p.accent};border-radius:8px;padding:10px 22px;font-size:18px;font-weight:800;color:${p.accent};letter-spacing:1px;">${p.code}</div><br>` : ''}<div style="margin-top:12px;">${eBtn(p, 'Shop now')}</div></div>`) }),
  },
  {
    name: 'Confirmation', kind: 'Transactional', icon: '✅', desc: 'Order / booking confirmed',
    build: (p, ctxId) => {
      const c = confirmFor(ctxId); const ecta = c.email?.cta || c.cta
      const inner = c.ship
        ? `<div style="padding:30px 34px;"><h2 style="margin:0 0 6px;font-size:20px;color:#111;">${c.head} ✅</h2><p style="margin:0 0 18px;color:#666;font-size:14px;">${cap(c.noun)} <b>#${p.orderId}</b> · ${c.line}</p>` + eOrderTable(p) + `<div style="text-align:center;margin-top:22px;">${eBtn(p, ecta)}</div></div>`
        : `<div style="padding:36px 34px;text-align:center;"><div style="width:58px;height:58px;border-radius:50%;background:${p.accent}1f;color:${p.accent};font-size:30px;line-height:58px;margin:0 auto 16px;">✓</div><h2 style="margin:0 0 8px;font-size:22px;color:#111;">${c.head}</h2><p style="margin:0 0 8px;color:#555;font-size:15px;line-height:1.5;">${c.line}</p><p style="margin:0 0 22px;color:#999;font-size:13px;">${cap(c.noun)} #${p.orderId}</p>${eBtn(p, ecta)}</div>`
      return { sender: p.brand, from: p.from, category: 'updates', subject: `Your ${p.brand} ${c.noun} #${p.orderId} is confirmed`, snippet: c.line, html: eWrap(eBrand(p) + inner) }
    },
  },
  {
    name: 'Product picks', kind: 'Promotional', icon: '🖼️', desc: 'Featured products grid',
    build: (p) => ({ sender: p.brand, from: p.from, category: 'promotions', subject: `Fresh picks from ${p.brand} ✨`, snippet: 'Handpicked for you — new this week.', html: eWrap(eBrand(p) + `<div style="padding:26px 30px 6px;text-align:center;"><h1 style="margin:0 0 4px;font-size:22px;color:#111;">New this week</h1><p style="margin:0;color:#777;font-size:14px;">Handpicked, just for you</p></div>` + eGrid(p) + `<div style="text-align:center;padding:6px 0 30px;">${eBtn(p, 'Shop the collection')}</div>`) }),
  },
  {
    name: 'Verification code', kind: 'Transactional', icon: '🔐', desc: 'OTP email',
    build: (p) => { const otp = genOtp(); return { sender: p.brand, from: p.from, category: 'updates', subject: `Your ${p.brand} verification code`, snippet: `Use code ${otp} to continue. It expires in 10 minutes.`, html: eWrap(eBrand(p) + `<div style="padding:34px;text-align:center;"><h2 style="margin:0 0 8px;font-size:20px;color:#111;">Verify it's you</h2><p style="margin:0 0 20px;color:#666;font-size:14px;">Enter this code to complete your ${p.otpUse}.</p><div style="font-size:34px;font-weight:800;letter-spacing:8px;color:#111;background:#f5f6f8;border-radius:10px;padding:16px 0;">${otp}</div><p style="margin:18px 0 0;color:#999;font-size:12px;">Expires in 10 minutes. If you didn't request it, ignore this email.</p></div>`) } },
  },
  {
    name: 'Welcome', kind: 'Transactional', icon: '👋', desc: 'Onboarding email',
    build: (p) => ({ sender: p.brand, from: p.from, category: 'updates', subject: `Welcome to ${p.brand} 🎉`, snippet: `We're glad you're here. Here's how to get started.`, html: eWrap(eBrand(p) + eHeroImg(p, 15) + `<div style="padding:30px 34px;text-align:center;"><h1 style="margin:0 0 10px;font-size:24px;color:#111;">Welcome aboard!</h1><p style="margin:0 0 20px;color:#555;font-size:15px;line-height:1.6;">Thanks for joining ${p.brand}. Let's get you set up in a couple of taps.</p>${eBtn(p, 'Get started')}</div>`) }),
  },
  {
    name: 'Win-back', kind: 'Promotional', icon: '💛', desc: 'We miss you + offer',
    build: (p) => ({ sender: p.brand, from: p.from, category: 'promotions', subject: `We miss you 💛${p.code ? ` Here's ${p.code}` : ''}`, snippet: `Come back to ${p.brand} — enjoy a welcome-back treat.`, html: eWrap(eBrand(p) + `<div style="padding:36px 34px;text-align:center;"><h1 style="margin:0 0 12px;font-size:26px;color:#111;">We miss you!</h1><p style="margin:0 0 18px;color:#555;font-size:15px;">It's been a while. Here's ${p.offer} to welcome you back.</p>${p.code ? `<div style="margin:0 0 20px;display:inline-block;border:2px dashed ${p.accent};border-radius:8px;padding:10px 22px;font-size:18px;font-weight:800;color:${p.accent};">${p.code}</div><br>` : ''}${eBtn(p, 'Come back')}</div>`) }),
  },
]

/** Build a rich AI-generated email (brand bar + optional hero + heading/body/CTA), reusing
    the same inline-styled builders as the templates so it renders identically in the pane. */
export function buildAiEmail(o: { brand: string; logo?: string; accent: string; image?: string; heading: string; body: string; btn?: string; footer?: string }): string {
  const esc = (s: string) => (s == null ? '' : String(s)).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const brandBar = o.logo
    ? `<div style="padding:20px 30px;text-align:center;border-bottom:1px solid #f1f1f1;"><img src="${o.logo}" alt="${esc(o.brand)}" style="max-height:34px;max-width:180px;width:auto;vertical-align:middle;"></div>`
    : `<div style="padding:20px 30px;text-align:center;border-bottom:1px solid #f1f1f1;"><span style="font-size:20px;font-weight:800;letter-spacing:-.4px;color:${o.accent};">${esc(o.brand)}</span></div>`
  const hero = o.image ? `<div style="height:220px;overflow:hidden;background:linear-gradient(135deg,${o.accent},#3a3a5a);"><img src="${o.image}" width="600" height="220" style="width:100%;height:100%;object-fit:cover;display:block;"></div>` : ''
  const btn = o.btn ? `<div style="margin-top:16px;"><a href="#" style="display:inline-block;background:${o.accent};color:#ffffff;text-decoration:none;padding:13px 30px;border-radius:9px;font-size:15px;font-weight:700;">${esc(o.btn)}</a></div>` : ''
  const body = `<div style="padding:32px 34px;text-align:center;"><h1 style="margin:0 0 12px;font-size:24px;color:#111;">${esc(o.heading)}</h1><p style="margin:0;font-size:15px;color:#555;line-height:1.6;white-space:pre-wrap;">${esc(o.body)}</p>${btn}</div>`
  return eWrap(brandBar + hero + body, o.footer)
}

/** Build the plain-mode email HTML from composed fields. */
export function plainEmail(plain: { heading: string; body: string; btn: string; accent: string }): string {
  const esc = (s: string) => (s == null ? '' : String(s)).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return `<div style="font-family:-apple-system,Roboto,Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;"><div style="background:${esc(plain.accent)};padding:44px 30px;text-align:center;"><h1 style="color:#fff;margin:0;font-size:30px;font-weight:800;">${esc(plain.heading)}</h1></div><div style="padding:32px 30px;"><p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#333;white-space:pre-wrap;">${esc(plain.body)}</p>${plain.btn ? `<a href="#" style="display:inline-block;background:${esc(plain.accent)};color:#fff;text-decoration:none;padding:13px 32px;border-radius:8px;font-weight:700;font-size:15px;">${esc(plain.btn)}</a>` : ''}</div></div>`
}

export { emailPackFor }
