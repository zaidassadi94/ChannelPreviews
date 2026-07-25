export function StubPreview({ label }: { label: string }) {
  return (
    <div className="stub">
      <span className="badge">● Migrating</span>
      <h2>{label}</h2>
      This channel is being ported into the unified app. WhatsApp is done as the proof-of-concept —
      the rest follow one at a time, all sharing this same shell.
    </div>
  )
}
