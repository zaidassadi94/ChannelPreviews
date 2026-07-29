/* Gmail HTML mode on mobile: a fixed-width (desktop) email must be scaled to fit the phone
   pane — never cut off — while a responsive email fills the width without scaling. */
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

const FIXED = '<html><body style="margin:0"><table width="640" cellpadding="0" cellspacing="0" style="width:640px;background:#c1121f"><tr><td style="height:380px;color:#fff;font:40px Arial;text-align:center">FIXED 640px EMAIL</td></tr></table></body></html>'
const FLUID = '<html><body style="margin:0"><div style="width:100%;height:220px;background:#0a7d34;color:#fff;font:24px Arial;text-align:center">FLUID 100% EMAIL</div></body></html>'

async function metrics(page) {
  return page.$eval('.email-frame', (f) => {
    const wrap = f.parentElement
    const cs = getComputedStyle(f)
    let scale = 1
    const m = cs.transform
    if (m && m.indexOf('matrix') === 0) scale = parseFloat(m.slice(m.indexOf('(') + 1, -1).split(',')[0])
    return { scale, naturalW: parseFloat(f.style.width) || wrap.clientWidth, wrapW: wrap.clientWidth }
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

  // Switch to Gmail (defaults: mobile skin + open view).
  await page.click('.chpick-btn'); await page.waitForTimeout(80)
  const label = await page.$$eval('.chpick-item .nm', (els) => els.map((e) => e.textContent.trim()).find((t) => /gmail/i.test(t)) || null)
  const item = await page.evaluateHandle((nm) => [...document.querySelectorAll('.chpick-item')].find((i) => i.querySelector('.nm')?.textContent.trim() === nm) || null, label)
  await item.asElement().click(); await page.waitForTimeout(250)

  // Content section → HTML mode.
  const railIdx = (await page.$$eval('.rail-item', (b) => b.map((x) => x.textContent.trim()))).findIndex((t) => /^content$/i.test(t))
  await (await page.$$('.rail-item'))[railIdx].click(); await page.waitForTimeout(150)
  await page.locator('.seg-in button', { hasText: 'HTML' }).click(); await page.waitForTimeout(150)
  const ta = page.locator('textarea[placeholder^="Paste your full email HTML"]')

  // Fixed-width email → must be scaled down to fit the pane.
  await ta.fill(FIXED); await page.waitForTimeout(700)
  const fx = await metrics(page)
  if (!(fx.scale < 0.95)) problems.push(`fixed-width email not scaled (scale=${fx.scale})`)
  if (!(fx.naturalW > fx.wrapW)) problems.push(`fixed-width email not rendered at natural width (${fx.naturalW} vs pane ${fx.wrapW})`)
  if (Math.abs(fx.naturalW * fx.scale - fx.wrapW) > 8) problems.push(`fixed-width email not fit to pane (scaled ${Math.round(fx.naturalW * fx.scale)} vs pane ${fx.wrapW})`)

  // Fluid email → fills the width, no scaling.
  await ta.fill(FLUID); await page.waitForTimeout(700)
  const fl = await metrics(page)
  if (fl.scale < 0.99) problems.push(`fluid email should not be scaled (scale=${fl.scale})`)

  if (errors.length) problems.push('console errors: ' + errors.join(' | '))
  await browser.close(); srv.close()
  if (problems.length) { console.error('FAIL:\n - ' + problems.join('\n - ')); process.exit(1) }
  console.log('✓ Gmail mobile: fixed-width email fits to pane (scaled), fluid email fills width — no cut-off.')
}
main().catch((e) => { console.error(e); process.exit(1) })
