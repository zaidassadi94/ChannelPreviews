import type { ReactNode } from 'react'

/* Gmail icon set (ported from gmail-preview-tool's I map). */
export const GI: Record<string, ReactNode> = {
  back: <svg viewBox="0 0 24 24" fill="none"><path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  archive: <svg viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="4" rx="1" stroke="currentColor" strokeWidth="2" /><path d="M5 8v11a1 1 0 001 1h12a1 1 0 001-1V8M10 12h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>,
  trash: <svg viewBox="0 0 24 24" fill="none"><path d="M4 7h16M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2m-9 0l1 13a1 1 0 001 1h6a1 1 0 001-1l1-13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  unread: <svg viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2" /><path d="M3 7l9 6 9-6" stroke="currentColor" strokeWidth="2" /></svg>,
  more: <svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="12" cy="19" r="2" /></svg>,
  star: <svg viewBox="0 0 24 24" fill="none"><path d="M12 3l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 18l-5.9 3 1.2-6.5L2.5 9.9 9.1 9 12 3z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /></svg>,
  starOn: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 18l-5.9 3 1.2-6.5L2.5 9.9 9.1 9 12 3z" /></svg>,
  imp: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 5l7 7-7 7h14l4-7-4-7z" /></svg>,
  impOff: <svg viewBox="0 0 24 24" fill="none"><path d="M3 5l7 7-7 7h14l4-7-4-7z" stroke="currentColor" strokeWidth="1.6" /></svg>,
  reply: <svg viewBox="0 0 24 24" fill="none"><path d="M10 9V5l-7 7 7 7v-4c5 0 8 1.5 10 5-1-6-4-11-10-11z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /></svg>,
  replyAll: <svg viewBox="0 0 24 24" fill="none"><path d="M7 9V5l-6 7 6 7v-4M13 9V5l7 7-7 7v-4c-3 0-5 .5-6 2" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /></svg>,
  forward: <svg viewBox="0 0 24 24" fill="none"><path d="M14 9V5l7 7-7 7v-4c-5 0-8 1.5-10 5 1-6 4-11 10-11z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /></svg>,
  search: <svg viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" /><path d="M21 21l-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>,
  menu: <svg viewBox="0 0 24 24" fill="none"><path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>,
  compose: <svg viewBox="0 0 24 24" fill="none"><path d="M4 20h4l10-10-4-4L4 16v4zM14 6l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  inbox: <svg viewBox="0 0 24 24" fill="none"><path d="M4 13h4l2 3h4l2-3h4M4 13V6a2 2 0 012-2h12a2 2 0 012 2v7M4 13v5a2 2 0 002 2h12a2 2 0 002-2v-5" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg>,
  dstar: <svg viewBox="0 0 24 24" fill="none"><path d="M12 3l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 18l-5.9 3 1.2-6.5L2.5 9.9 9.1 9 12 3z" stroke="currentColor" strokeWidth="1.6" /></svg>,
  snooze: <svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="13" r="8" stroke="currentColor" strokeWidth="1.8" /><path d="M12 9v4l3 2M9 2h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>,
  sent: <svg viewBox="0 0 24 24" fill="none"><path d="M3 11l18-8-8 18-2-7-8-3z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /></svg>,
  draft: <svg viewBox="0 0 24 24" fill="none"><path d="M4 20h4L18 10l-4-4L4 16v4z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /></svg>,
  refresh: <svg viewBox="0 0 24 24" fill="none"><path d="M4 12a8 8 0 018-8c3 0 5.5 1.6 7 4M20 4v4h-4M20 12a8 8 0 01-8 8c-3 0-5.5-1.6-7-4M4 20v-4h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  check: <svg viewBox="0 0 24 24" fill="none"><rect x="4" y="4" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="1.8" /></svg>,
  chevron: <svg viewBox="0 0 24 24" fill="none" width="14" height="14"><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" /></svg>,
}

export const GmailLogo = ({ h = 22 }: { h?: number }) => (
  <svg width={h * 1.34} height={h} viewBox="0 0 52 40" fill="none"><path d="M4 36h8V19L4 13v23z" fill="#4285F4" /><path d="M40 36h8V13l-8 6v17z" fill="#34A853" /><path d="M4 8l22 16L48 8v5L26 29 4 13V8z" fill="#EA4335" /><path d="M4 8v5l8 6V13L4 8z" fill="#C5221F" /><path d="M48 8v5l-8 6V13l8-5z" fill="#FBBC04" /><path d="M4 6a2 2 0 012-2h2l18 13L44 4h2a2 2 0 012 2v2L26 24 4 8V6z" fill="#EA4335" /></svg>
)
