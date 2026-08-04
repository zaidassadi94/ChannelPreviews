/* Logo fields expose a brand-logo search (type a brand/site → the real logo via /api/logo,
   which is mocked here). Verifies the search result renders and applies to the field. */
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

const LOGO = 'data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20width=%2240%22%20height=%2240%22%3E%3Crect%20width=%2240%22%20height=%2240%22%20fill=%22%23c1121f%22/%3E%3C/svg%3E'

async function main() {
  const { srv, port } = await serve()
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  const errors = []
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
  page.on('pageerror', (e) => errors.push(e.message))
  // Mock the logo API for any domain.
  await page.route('**/api/logo*', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, url: LOGO }) }))
  await page.goto(`http://localhost:${port}/`, { waitUntil: 'networkidle' })
  const problems = []

  // Gmail → Sender section (has the Sender logo field).
  await page.click('.chpick-btn'); await page.waitForTimeout(80)
  const label = await page.$$eval('.chpick-item .nm', (els) => els.map((e) => e.textContent.trim()).find((t) => /gmail/i.test(t)) || null)
  const item = await page.evaluateHandle((nm) => [...document.querySelectorAll('.chpick-item')].find((i) => i.querySelector('.nm')?.textContent.trim() === nm) || null, label)
  await item.asElement().click(); await page.waitForTimeout(250)
  const idx = (await page.$$eval('.rail-item', (b) => b.map((x) => x.textContent.trim()))).findIndex((t) => /^brand$/i.test(t))
  await (await page.$$('.rail-item'))[idx].click(); await page.waitForTimeout(200)

  // The logo search box should be present, and its seeded auto-search should surface a result.
  const searchBox = await page.$('input.pick-search[placeholder^="Find a logo"]')
  if (!searchBox) problems.push('no logo search box on the Sender logo field')
  await page.waitForTimeout(600)
  let thumb = await page.$('.pick-thumb.logo')
  if (!thumb) {
    // Fall back to an explicit search.
    await page.fill('input.pick-search[placeholder^="Find a logo"]', 'arbys.com')
    await page.locator('.pick .pick-btn', { hasText: 'Search' }).click()
    await page.waitForTimeout(600)
    thumb = await page.$('.pick-thumb.logo')
  }
  if (!thumb) problems.push('logo search returned no result thumbnail')
  else {
    await thumb.click(); await page.waitForTimeout(200)
    const applied = await page.$eval('.imgf .imgf-thumb', (im) => im.getAttribute('src')).catch(() => null)
    if (!applied || !applied.startsWith('data:image/svg')) problems.push(`picking the logo did not apply it to the field (src=${applied})`)
  }

  if (errors.length) problems.push('console errors: ' + errors.join(' | '))
  await browser.close(); srv.close()
  if (problems.length) { console.error('FAIL:\n - ' + problems.join('\n - ')); process.exit(1) }
  console.log('✓ Logo search: brand-logo lookup renders a result and applies to the field.')
}
main().catch((e) => { console.error(e); process.exit(1) })
