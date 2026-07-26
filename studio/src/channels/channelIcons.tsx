import type { ReactNode } from 'react'

/* Recognizable, colored channel icons for the channel picker (replace the emoji set).
   Brand marks for the branded surfaces (WhatsApp, Gmail, Instagram, Facebook, Google
   Messages/RCS); clean colored glyphs for the generic ones (Push, In-App, …). Sized by
   `.chpick .em svg` in global.css. */
export const CH_ICON: Record<string, ReactNode> = {
  whatsapp: (
    <svg viewBox="0 0 24 24"><path fill="#25D366" d="M12 2a10 10 0 0 0-8.6 15L2 22l5.1-1.3A10 10 0 1 0 12 2z" /><path fill="#fff" d="M9.3 7.3c-.2-.5-.4-.5-.6-.5h-.5c-.2 0-.5.1-.7.3-.3.3-.9.9-.9 2.1 0 1.3.9 2.5 1 2.7.1.2 1.8 2.9 4.5 3.9 2.2.9 2.7.7 3.2.7.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3-.3-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1-.2.3-.7.8-.8 1-.2.2-.3.2-.6.1-.3-.1-1.1-.4-2-1.2-.7-.7-1.2-1.5-1.4-1.8-.1-.2 0-.4.1-.5l.4-.5c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5 0-.2-.6-1.6-.9-2.1z" /></svg>
  ),
  rcs: (
    <svg viewBox="0 0 24 24"><path fill="#1A73E8" d="M12 3C6.9 3 3 6.6 3 11.1c0 2.4 1.2 4.6 3.2 6v4l3.6-2c.7.1 1.5.2 2.2.2 5.1 0 9-3.6 9-8.2S17.1 3 12 3z" /><circle cx="8.3" cy="11" r="1.3" fill="#fff" /><circle cx="12" cy="11" r="1.3" fill="#fff" /><circle cx="15.7" cy="11" r="1.3" fill="#fff" /></svg>
  ),
  sms: (
    <svg viewBox="0 0 24 24"><path fill="#33B579" d="M5 4h14a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3h-6.5L7 20.5V16H5a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3z" /><circle cx="8.5" cy="10" r="1.1" fill="#fff" /><circle cx="12" cy="10" r="1.1" fill="#fff" /><circle cx="15.5" cy="10" r="1.1" fill="#fff" /></svg>
  ),
  gmail: (
    <svg viewBox="0 0 48 48"><path fill="#4caf50" d="M45 16.2l-5 2.75-5 4.75L35 40h7c1.657 0 3-1.343 3-3V16.2z" /><path fill="#1e88e5" d="M3 16.2l3.614 1.71L13 23.7V40H6c-1.657 0-3-1.343-3-3V16.2z" /><polygon fill="#e53935" points="35,11.2 24,19.45 13,11.2 12,17 13,23.7 24,31.95 35,23.7 36,17" /><path fill="#c62828" d="M3 12.298V16.2l10 7.5V11.2L9.876 8.859C7.454 7.043 3 8.671 3 12.298z" /><path fill="#fbc02d" d="M45 12.298V16.2l-10 7.5V11.2l3.124-2.341C40.546 7.043 45 8.671 45 12.298z" /></svg>
  ),
  push: (
    <svg viewBox="0 0 24 24"><path fill="#F59E0B" d="M12 2a1.5 1.5 0 0 1 1.5 1.5v.7A6 6 0 0 1 18 10v3.5l1.4 2.1a1 1 0 0 1-.8 1.6H5.4a1 1 0 0 1-.8-1.6L6 13.5V10a6 6 0 0 1 4.5-5.8v-.7A1.5 1.5 0 0 1 12 2z" /><path fill="#F59E0B" d="M9.5 19a2.5 2.5 0 0 0 5 0z" /></svg>
  ),
  inapp: (
    <svg viewBox="0 0 24 24"><rect x="5" y="2" width="14" height="20" rx="3" fill="#6366F1" /><rect x="7.5" y="8" width="9" height="7" rx="1.6" fill="#fff" /></svg>
  ),
  game: (
    <svg viewBox="0 0 24 24"><rect x="3.5" y="10" width="17" height="11" rx="2" fill="#EC4899" /><rect x="3" y="7.5" width="18" height="4" rx="1.5" fill="#F472B6" /><rect x="10.5" y="7.5" width="3" height="13.5" fill="#fff" opacity=".92" /><path fill="#F472B6" d="M12 7.5C10.9 5 7.8 4.7 7.2 6.3 6.7 7.6 9.2 7.5 12 7.5zm0 0c1.1-2.5 4.2-2.8 4.8-1.2.5 1.3-2 1.2-4.8 1.2z" /></svg>
  ),
  cards: (
    <svg viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="13" rx="2.5" fill="#14B8A6" /><rect x="3" y="4.5" width="14" height="2.5" rx="1.25" fill="#5EEAD4" /><rect x="6" y="11" width="12" height="2" rx="1" fill="#fff" /><rect x="6" y="15" width="8" height="2" rx="1" fill="#fff" opacity=".8" /></svg>
  ),
  osm: (
    <svg viewBox="0 0 24 24"><rect x="2.5" y="4.5" width="19" height="15" rx="2.5" fill="#fff" stroke="#0EA5E9" strokeWidth="2" /><path d="M2.5 8.5h19" stroke="#0EA5E9" strokeWidth="2" /><circle cx="5.5" cy="6.5" r=".8" fill="#0EA5E9" /><circle cx="8" cy="6.5" r=".8" fill="#0EA5E9" /></svg>
  ),
  webpush: (
    <svg viewBox="0 0 24 24"><rect x="2.5" y="4" width="19" height="13" rx="2.5" fill="#fff" stroke="#7C3AED" strokeWidth="2" /><path d="M2.5 8h13" stroke="#7C3AED" strokeWidth="2" /><path fill="#7C3AED" stroke="#fff" strokeWidth="1.1" d="M18.5 8.7a3.4 3.4 0 0 1 3.4 3.4v2.2l.9 1.2a.6.6 0 0 1-.5 1h-7.6a.6.6 0 0 1-.5-1l.9-1.2v-2.2a3.4 3.4 0 0 1 3.4-3.4z" /></svg>
  ),
  instagram: (
    <svg viewBox="0 0 24 24"><defs><radialGradient id="chig" cx="30%" cy="107%" r="140%"><stop offset="0" stopColor="#fdf497" /><stop offset=".05" stopColor="#fdf497" /><stop offset=".45" stopColor="#fd5949" /><stop offset=".6" stopColor="#d6249f" /><stop offset=".9" stopColor="#285AEB" /></radialGradient></defs><rect x="2" y="2" width="20" height="20" rx="6" fill="url(#chig)" /><rect x="5.6" y="5.6" width="12.8" height="12.8" rx="4" fill="none" stroke="#fff" strokeWidth="2" /><circle cx="12" cy="12" r="3.1" fill="none" stroke="#fff" strokeWidth="2" /><circle cx="16.6" cy="7.4" r="1.1" fill="#fff" /></svg>
  ),
  facebook: (
    <svg viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="6" fill="#1877F2" /><path fill="#fff" d="M15.4 12.3l.44-2.6H13.3V8c0-.72.35-1.42 1.48-1.42h1.16V4.36S14.8 4.2 13.8 4.2c-2.06 0-3.4 1.25-3.4 3.5v1.99H8.1v2.6h2.3V19h2.9v-6.7z" /></svg>
  ),
}
