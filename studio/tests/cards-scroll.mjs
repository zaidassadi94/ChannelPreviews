/* Repro/verify: Cards / App Inbox list must scroll when it overflows. */
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

async function main() {
  const { srv, port } = await serve()
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  const errors = []
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
  page.on('pageerror', (e) => errors.push(e.message))
  await page.goto(`http://localhost:${port}/`, { waitUntil: 'networkidle' })

  // Switch to the Cards / App Inbox channel via the real channel picker.
  await page.click('.chpick-btn')
  await page.waitForTimeout(80)
  const label = await page.$$eval('.chpick-item .nm', (els) => {
    const m = els.map((e) => e.textContent.trim()).find((t) => /inbox|card/i.test(t))
    return m || null
  })
  if (!label) { console.error('FAIL: no Cards/App Inbox channel in the picker'); process.exit(1) }
  const item = await page.evaluateHandle(
    (nm) => [...document.querySelectorAll('.chpick-item')].find((i) => i.querySelector('.nm')?.textContent.trim() === nm) || null,
    label,
  )
  await item.asElement().click()
  await page.waitForTimeout(250)

  // Open the "Cards" editor section (rail item) and add many cards.
  const railLabels = await page.$$eval('.rail-item', (b) => b.map((x) => x.textContent.trim()))
  const idx = railLabels.findIndex((t) => /^cards$/i.test(t))
  const rail = (await page.$$('.rail-item'))[idx >= 0 ? idx : 1]
  await rail.click()
  await page.waitForTimeout(150)

  const addBtn = page.getByRole('button', { name: /\+ Add card/i })
  if (!(await addBtn.count())) { console.error('FAIL: could not reach the Cards editor (no Add card button).'); process.exit(1) }
  for (let i = 0; i < 12; i++) { await addBtn.click(); await page.waitForTimeout(30) }
  await page.waitForTimeout(300)

  const m = await page.evaluate(() => {
    const list = document.querySelector('.cd-list')
    const screen = document.querySelector('#capture .screen')
    if (!list || !screen) return null
    const lr = list.getBoundingClientRect(), sr = screen.getBoundingClientRect()
    return {
      scrollH: list.scrollHeight, clientH: list.clientHeight,
      listBottom: lr.bottom, screenBottom: sr.bottom,
      overflowsScreen: lr.bottom > sr.bottom + 0.5,
      canScroll: list.scrollHeight > list.clientHeight + 1,
    }
  })
  if (!m) { console.error('FAIL: .cd-list / screen not found'); process.exit(1) }

  // Verify the scroll actually moves.
  const scrolled = await page.evaluate(() => {
    const list = document.querySelector('.cd-list')
    list.scrollTop = 9999
    return list.scrollTop
  })

  console.log('metrics:', JSON.stringify(m), 'scrolledTo:', scrolled)
  const problems = []
  if (m.overflowsScreen) problems.push(`list bottom (${m.listBottom.toFixed(0)}) is below the screen bottom (${m.screenBottom.toFixed(0)}) — scroll viewport is clipped`)
  if (!m.canScroll) problems.push('list does not overflow (scrollHeight ≤ clientHeight) despite 12 cards')
  if (scrolled <= 0) problems.push('scrollTop stayed at 0 — list is not scrollable')
  if (errors.length) problems.push('console errors: ' + errors.join(' | '))

  await browser.close(); srv.close()
  if (problems.length) { console.error('FAIL:\n - ' + problems.join('\n - ')); process.exit(1) }
  console.log('✓ Cards / App Inbox scrolls correctly with 12 cards, viewport within the screen.')
}
main().catch((e) => { console.error(e); process.exit(1) })
