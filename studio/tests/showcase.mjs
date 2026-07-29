/* Showcase mode scaffold: toggling Showcase renders a 16:9 board of live channel tiles.
   Asserts the default row renders, toggling a channel chip adds/removes a tile, and no
   console errors. Also writes a screenshot of the board for eyeballing. */
import { chromium } from 'playwright'
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join, extname, resolve } from 'node:path'

const __dir = dirname(fileURLToPath(import.meta.url))
const DIST = resolve(__dir, '../dist')
const SHOTS = join(__dir, 'screenshots')
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

  const problems = []
  // Enter Showcase mode.
  await page.click('button:has-text("Showcase")')
  await page.waitForTimeout(500)

  const tiles = await page.$$('.sc-board .sc-tile')
  if (tiles.length !== 3) problems.push(`expected 3 default tiles, got ${tiles.length}`)
  const boardExists = await page.$('.sc-board#capture, #capture.sc-board')
  if (!boardExists) problems.push('board is not the #capture target')

  // Toggle a channel chip (SMS) → a 4th tile appears.
  const smsChip = page.locator('.sc-chip', { hasText: 'SMS' }).first()
  await smsChip.click(); await page.waitForTimeout(300)
  const after = await page.$$('.sc-board .sc-tile')
  if (after.length !== 4) problems.push(`toggling SMS should give 4 tiles, got ${after.length}`)
  await smsChip.click(); await page.waitForTimeout(200)
  const back = await page.$$('.sc-board .sc-tile')
  if (back.length !== 3) problems.push(`toggling SMS off should return to 3, got ${back.length}`)

  await page.screenshot({ path: join(SHOTS, 'showcase.png') })
  if (errors.length) problems.push('console errors: ' + errors.join(' | '))

  await browser.close(); srv.close()
  if (problems.length) { console.error('FAIL:\n - ' + problems.join('\n - ')); process.exit(1) }
  console.log('✓ Showcase scaffold verified — 3-tile board, chip add/remove, no console errors.')
}
main().catch((e) => { console.error(e); process.exit(1) })
