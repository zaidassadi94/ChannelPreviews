/* Verify multi-message AI generation: a brief that lists several messages must produce
   one rendered message per item (no hard-coded filler), across the stackable channels.
   /api/generate is mocked (page.route) so this runs offline and deterministically. */
import { chromium } from 'playwright'
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join, extname, resolve } from 'node:path'

const __dir = dirname(fileURLToPath(import.meta.url))
const DIST = resolve(__dir, '../dist')
const MIME = { '.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.json':'application/json','.png':'image/png' }
function serve() {
  return new Promise((res) => {
    const srv = createServer(async (req, rq) => {
      try {
        const url = decodeURIComponent((req.url || '/').split('?')[0])
        let file = join(DIST, url === '/' ? 'index.html' : url), body
        try { body = await readFile(file) } catch { file = join(DIST, 'index.html'); body = await readFile(file) }
        rq.writeHead(200, { 'content-type': MIME[extname(file)] || 'application/octet-stream' }); rq.end(body)
      } catch { rq.writeHead(500); rq.end('err') }
    })
    srv.listen(0, () => res({ srv, port: srv.address().port }))
  })
}

/* The three cases: {channel label regex, mock message, card/message selector, expected titles} */
const CASES = [
  {
    name: 'cards',
    pick: /inbox|card/i,
    message: {
      brand: 'D360', industry: 'fintech', domain: 'd360.com', screenTitle: 'Updates',
      messages: [
        { title: 'FIFA World Cup', body: '0% international remittance fees ⚽', tag: 'Offer', imageQuery: 'soccer ball' },
        { title: '25% off iHerb', body: 'Exclusive member wellness offer.', tag: 'Deal' },
        { title: 'Transfer salary to D360', body: 'Unlock exclusive perks when your salary lands.', tag: 'Reward' },
      ],
    },
    itemSel: '#capture .cd-card',
    titleSel: '.cd-t',
    expect: ['FIFA World Cup', '25% off iHerb', 'Transfer salary to D360'],
    forbid: ['shipped', 'Legendary Crate'],
  },
  {
    name: 'whatsapp',
    pick: /whatsapp/i,
    message: {
      brand: 'QuickBite', industry: 'food', domain: 'quickbite.com',
      messages: [
        { type: 'text', text: 'Your order is confirmed 🎉' },
        { type: 'template', body: 'Track it live — arriving in *25 min*.', footer: 'QuickBite', imageQuery: 'pizza box', buttons: [{ label: 'Track order', type: 'url', value: 'https://quickbite.com' }] },
        { type: 'text', text: 'Rate your rider when it lands ⭐' },
      ],
    },
    itemSel: '#capture .wa-row, #capture .wa-msg, #capture .wa-bubble',
    minItems: 3,
  },
  {
    name: 'push',
    pick: /^push$|push notif/i,
    message: {
      brand: 'Streamly', industry: 'streaming', domain: 'streamly.com',
      messages: [
        { title: 'New episode is live', body: 'Season 3 just dropped — pick up where you left off.', imageQuery: 'tv remote', expanded: true },
        { title: 'Your watchlist got cheaper', body: 'A film you saved is now included.', },
        { title: 'Continue watching?', body: 'You left 12 min left on the finale.' },
      ],
    },
    itemSel: '#capture .pn-ios, #capture .pn-and',
    minItems: 3,
  },
]

async function run(page, base, c, onlyChannel) {
  if (onlyChannel && c.name !== onlyChannel) return null
  const problems = []
  // Mock the AI endpoint for this case.
  await page.route('**/api/generate', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json',
      body: JSON.stringify({ ok: true, provider: 'mock', channel: c.name, model: 'mock', message: c.message }) }))

  await page.goto(base, { waitUntil: 'networkidle' })

  // Switch to the target channel.
  await page.click('.chpick-btn'); await page.waitForTimeout(80)
  const label = await page.$$eval('.chpick-item .nm', (els, re) => {
    const rx = new RegExp(re.source, re.flags)
    return els.map((e) => e.textContent.trim()).find((t) => rx.test(t)) || null
  }, { source: c.pick.source, flags: c.pick.flags })
  if (!label) { await page.unroute('**/api/generate'); return [`[${c.name}] channel not found in picker`] }
  const item = await page.evaluateHandle((nm) => [...document.querySelectorAll('.chpick-item')].find((i) => i.querySelector('.nm')?.textContent.trim() === nm) || null, label)
  await item.asElement().click(); await page.waitForTimeout(250)

  // Open the AI panel, type a brief, generate.
  await page.click('button[title="Generate with AI"]'); await page.waitForTimeout(150)
  await page.fill('.cs-ai-ta', `3 messages for ${c.message.brand}: 1) ${c.message.messages[0].title} 2) ${c.message.messages[1].title} 3) ${c.message.messages[2].title}`)
  await page.click('.cs-ai-go')
  await page.waitForTimeout(1200)

  const items = await page.$$(c.itemSel)
  if (c.expect) {
    const titles = await page.$$eval(`${c.itemSel} ${c.titleSel}`, (els) => els.map((e) => e.textContent.trim()))
    for (const t of c.expect) if (!titles.some((x) => x.includes(t))) problems.push(`[${c.name}] missing card "${t}" (got: ${titles.join(' | ')})`)
    for (const f of c.forbid || []) if (titles.some((x) => x.includes(f))) problems.push(`[${c.name}] filler card leaked: "${f}"`)
    if (items.length !== c.expect.length) problems.push(`[${c.name}] expected ${c.expect.length} cards, got ${items.length}`)
  } else if (c.minItems) {
    if (items.length < c.minItems) problems.push(`[${c.name}] expected ≥${c.minItems} stacked messages, got ${items.length}`)
  }

  await page.unroute('**/api/generate')
  return problems
}

async function main() {
  const only = process.argv[2] || ''   // optional: run one channel
  const { srv, port } = await serve()
  const base = `http://localhost:${port}/`
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  const errors = []
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
  page.on('pageerror', (e) => errors.push(e.message))

  const problems = []
  for (const c of CASES) {
    const r = await run(page, base, c, only)
    if (r) problems.push(...r)
  }
  if (errors.length) problems.push('console errors: ' + errors.join(' | '))

  await browser.close(); srv.close()
  if (problems.length) { console.error('FAIL:\n - ' + problems.join('\n - ')); process.exit(1) }
  console.log(`✓ Multi-message AI generation verified${only ? ` (${only})` : ''}.`)
}
main().catch((e) => { console.error(e); process.exit(1) })
