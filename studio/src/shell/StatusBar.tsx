import { useStudio } from '@/store/useStudio'

/** Minimal iOS/Android status bar (time + signal/wifi/battery). */
export function StatusBar({ light = false }: { light?: boolean }) {
  const device = useStudio((s) => s.device)
  return (
    <div className={'statusbar' + (light ? ' lt' : '')}>
      <span>9:41</span>
      <span className="r">
        {device === 'ios' ? (
          <>
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M2 16h3v4H2zM7 12h3v8H7zM12 8h3v12h-3zM17 4h3v16h-3z" /></svg>
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 4C7 4 3 7 1 11l11 9 11-9c-2-4-6-7-11-7z" opacity=".9" /></svg>
            <svg viewBox="0 0 26 24" fill="none"><rect x="1" y="7" width="19" height="10" rx="2.5" stroke="currentColor" strokeWidth="1.4" /><rect x="3" y="9" width="14" height="6" rx="1" fill="currentColor" /><rect x="21" y="10" width="2" height="4" rx="1" fill="currentColor" /></svg>
          </>
        ) : (
          <>
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 4C7 4 3 7 1 11l11 9 11-9c-2-4-6-7-11-7z" opacity=".9" /></svg>
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M2 16h3v4H2zM7 12h3v8H7zM12 8h3v12h-3zM17 4h3v16h-3z" /></svg>
            <svg viewBox="0 0 26 24" fill="none"><rect x="1" y="7" width="19" height="10" rx="2.5" stroke="currentColor" strokeWidth="1.4" /><rect x="3" y="9" width="14" height="6" rx="1" fill="currentColor" /><rect x="21" y="10" width="2" height="4" rx="1" fill="currentColor" /></svg>
          </>
        )}
      </span>
    </div>
  )
}
