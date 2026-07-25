export function StubSidebar({ label }: { label: string }) {
  return (
    <div style={{ padding: '18px 20px' }}>
      <div className="hint" style={{ margin: 0 }}>
        The <b>{label}</b> controls are being ported into this new shared app. The nav on the left already
        switches with no page reload — this channel's editor + preview land next.
      </div>
    </div>
  )
}

export function StubPreview({ label }: { label: string }) {
  return (
    <div className="stub">
      <h2>{label}</h2>
      Migrating into the unified app. WhatsApp is done as the proof-of-concept; the rest follow one at a time.
    </div>
  )
}
