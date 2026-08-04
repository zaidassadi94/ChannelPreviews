/* Verifies: (1) every channel's identity section is now labelled "Brand"; (2) the messaging
   + notify channels that lacked a logo control now have the logo search in their Brand section;
   (3) Gmail opens on the Content section, not View. /api/logo is mocked. */
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

async function pickChannel(page, re) {
  await page.click('.chpick-btn'); await page.waitForTimeout(80)
  const label = await page.$$eval('.chpick-item .nm', (els, src) => {
    const rx = new RegExp(src, 'i'); return els.map((e) => e.textContent.trim()).find((t) => rx.test(t)) || null
  }, re.source)
  const item = await page.evaluateHandle((nm) => [...document.querySelectorAll('.chpick-item')].find((i) => i.querySelector('.nm')?.textContent.trim() === nm) || null, label)
  await item.asElement().click(); await page.waitForTimeout(200)
}
const railLabels = (page) => page.$$eval('.rail-item', (b) => b.map((x) => x.textContent.trim()))
async function clickRail(page, re) {
  const labels = await railLabels(page)
  const idx = labels.findIndex((t) => re.test(t))
  if (idx < 0) return false
  await (await page.$$('.rail-item'))[idx].click(); await page.waitForTimeout(150)
  return true
}

async function main() {
  const { srv, port } = await serve()
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  const errors = []
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
  page.on('pageerror', (e) => errors.push(e.message))
  await page.route('**/api/logo*', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, url: 'data:image/svg+xml,%3Csvg/%3E' }) }))
  await page.goto(`http://localhost:${port}/`, { waitUntil: 'networkidle' })
  const problems = []

  // Every channel has a "Brand" section, and the 5 previously-missing ones show a logo search.
  const CHANS = ['whatsapp', 'rcs', 'sms', 'gmail', 'push', 'in-app|inapp', 'gamif', 'cards|inbox', 'onsite', 'web push', 'instagram', 'facebook']
  const WANT_LOGO = new Set(['whatsapp', 'rcs', 'sms', 'in-app|inapp', 'gamif'])
  for (const c of CHANS) {
    await pickChannel(page, new RegExp(c))
    const labels = await railLabels(page)
    if (!labels.some((t) => /^brand$/i.test(t))) { problems.push(`[${c}] no "Brand" section (rail: ${labels.join(',')})`); continue }
    await clickRail(page, /^brand$/i)
    if (WANT_LOGO.has(c)) {
      const box = await page.$('input.pick-search[placeholder^="Find a logo"]')
      if (!box) problems.push(`[${c}] Brand section has no logo search`)
    }
  }

  // Gmail opens on Content (not View): the active/open rail item is "Content".
  await pickChannel(page, /gmail/)
  const activeOpen = await page.$eval('.rail-item.on', (el) => el.textContent.trim()).catch(() => '(none)')
  if (!/content/i.test(activeOpen)) problems.push(`Gmail should open on Content, active section is "${activeOpen}"`)

  if (errors.length) problems.push('console errors: ' + errors.join(' | '))
  await browser.close(); srv.close()
  if (problems.length) { console.error('FAIL:\n - ' + problems.join('\n - ')); process.exit(1) }
  console.log('✓ Brand sections: every channel has one, logo search added where missing, Gmail opens on Content.')
}
main().catch((e) => { console.error(e); process.exit(1) })
