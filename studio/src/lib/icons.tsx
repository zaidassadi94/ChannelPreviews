import type { ReactNode } from 'react'

/* Inline SVG icons (ported from the tools' IC set). Keyed for easy reuse. */
export const Icon: Record<string, ReactNode> = {
  back: <svg viewBox="0 0 24 24" fill="none"><path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  call: <svg viewBox="0 0 24 24" fill="none"><path d="M6.5 4h-2A1.5 1.5 0 003 5.6C3 13 10.9 21 18.4 21A1.5 1.5 0 0020 19.5v-2a1.4 1.4 0 00-1.1-1.4l-3-.6a1.4 1.4 0 00-1.4.6l-.6.9a11.5 11.5 0 01-5.3-5.3l.9-.6a1.4 1.4 0 00.6-1.4l-.6-3A1.4 1.4 0 006.5 4z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" /></svg>,
  menu: <svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="12" cy="19" r="2" /></svg>,
  video: <svg viewBox="0 0 24 24" fill="none"><rect x="2" y="7" width="13" height="10" rx="2" stroke="currentColor" strokeWidth="1.9" /><path d="M15 11l5-3v8l-5-3" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" /></svg>,
  link: <svg viewBox="0 0 24 24" fill="none"><path d="M9 15l6-6M10.5 6.5l1-1a4 4 0 015.9 5.4l-1.4 1.4M7 11.6l-1.4 1.5a4 4 0 005.7 5.7l1-1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>,
  reply: <svg viewBox="0 0 24 24" fill="none"><path d="M9 10V6l-6 6 6 6v-4c5 0 8 1.4 10 4-1-6-4-8-10-8z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /></svg>,
  copy: <svg viewBox="0 0 24 24" fill="none"><rect x="9" y="9" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.7" /><path d="M5 15V5a2 2 0 012-2h10" stroke="currentColor" strokeWidth="1.7" /></svg>,
  mic: <svg viewBox="0 0 24 24" fill="none"><rect x="9" y="2.5" width="6" height="11" rx="3" fill="currentColor" /><path d="M5.5 11a6.5 6.5 0 0013 0M12 17.5v4M8.5 21.5h7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>,
  emoji: <svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" /><circle cx="9" cy="10" r="1.1" fill="currentColor" /><circle cx="15" cy="10" r="1.1" fill="currentColor" /><path d="M8.5 14.5a4.5 4.5 0 007 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>,
  clip: <svg viewBox="0 0 24 24" fill="none"><path d="M20 11l-8.5 8.5a5 5 0 01-7-7L13 4a3.3 3.3 0 015 4.7l-8.6 8.6a1.6 1.6 0 01-2.3-2.3l7.8-7.8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  camera: <svg viewBox="0 0 24 24" fill="none"><path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 011 1v9a1 1 0 01-1 1H4a1 1 0 01-1-1V9a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" /><circle cx="12" cy="13" r="3.4" stroke="currentColor" strokeWidth="1.7" /></svg>,
  plus: <svg viewBox="0 0 24 24" fill="none"><path d="M12 6v12M6 12h12" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" /></svg>,
  sticker: <svg viewBox="0 0 24 24" fill="none"><path d="M4 5a1 1 0 011-1h14a1 1 0 011 1v9l-6 6H5a1 1 0 01-1-1V5z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" /><path d="M14 20v-5a1 1 0 011-1h5" stroke="currentColor" strokeWidth="1.7" /><circle cx="9" cy="10" r=".9" fill="currentColor" /><circle cx="14" cy="10" r=".9" fill="currentColor" /></svg>,
  verifWA: <svg viewBox="0 0 24 24" fill="none"><path d="M12 2l2.4 1.8 3-.2 1 2.8 2.6 1.6-1 2.8 1 2.8-2.6 1.6-1 2.8-3-.2L12 22l-2.4-1.8-3 .2-1-2.8L3 14.2l1-2.8-1-2.8 2.6-1.6 1-2.8 3 .2z" fill="#25d366" /><path d="M8.5 12.5l2.2 2.2 4.8-4.8" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  tick: <svg viewBox="0 0 24 24" fill="none"><path d="M1.5 13l4 4 8-9M9.5 17l1 0 8-9" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  play: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 5v14l12-7z" /></svg>,
  pause: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 5h4v14H6zM14 5h4v14h-4z" /></svg>,
  download: <svg viewBox="0 0 24 24" fill="none"><path d="M12 3v12m0 0l-4-4m4 4l4-4M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  phone: <svg viewBox="0 0 24 24" fill="none"><rect x="6" y="2" width="12" height="20" rx="3" stroke="currentColor" strokeWidth="2" /></svg>,
  android: <svg viewBox="0 0 24 24" fill="none"><rect x="6" y="2" width="12" height="20" rx="2" stroke="currentColor" strokeWidth="2" /><path d="M10 5h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>,
  chat: <svg viewBox="0 0 24 24" fill="none"><path d="M7 5.5h10a3 3 0 0 1 3 3v4a3 3 0 0 1-3 3h-4.8l-3.4 2.6c-.6.45-1.3.02-1.3-.72V15.5H7a3 3 0 0 1-3-3v-4a3 3 0 0 1 3-3z" fill="#fff" /></svg>,
}

export const btnIcon = (t: string): ReactNode => (t === 'call' ? Icon.phone : t === 'url' ? Icon.link : t === 'copy' ? Icon.copy : Icon.reply)
