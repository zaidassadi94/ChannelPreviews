import type { ReactNode } from 'react'

const LINK = "(?:https?:\\/\\/[^\\s]+|\\b[a-z0-9.-]+\\.(?:com|net|org|io|in|co|app|ai|tv|gg|shop|store)\\/[^\\s]*)"
const TOKEN = new RegExp(`(\\*[^*]+\\*)|(_[^_]+_)|(~[^~]+~)|(${LINK})`, 'gi')

/** Render WhatsApp/RCS-style markdown-lite: *bold* _italic_ ~strike~, links, newlines. */
export function formatText(text: string): ReactNode {
  const src = text == null ? '' : String(text)
  return src.split('\n').map((line, li) => (
    <span key={li}>
      {li > 0 && <br />}
      {inline(line)}
    </span>
  ))
}

function inline(line: string): ReactNode[] {
  const out: ReactNode[] = []
  let last = 0
  let m: RegExpExecArray | null
  let k = 0
  TOKEN.lastIndex = 0
  while ((m = TOKEN.exec(line))) {
    if (m.index > last) out.push(line.slice(last, m.index))
    const tok = m[0]
    if (m[1]) out.push(<b key={k++}>{tok.slice(1, -1)}</b>)
    else if (m[2]) out.push(<i key={k++}>{tok.slice(1, -1)}</i>)
    else if (m[3]) out.push(<s key={k++}>{tok.slice(1, -1)}</s>)
    else out.push(<span key={k++} style={{ color: '#0096de' }}>{tok}</span>)
    last = m.index + tok.length
  }
  if (last < line.length) out.push(line.slice(last))
  return out
}
