/* Channel Studio — CI smoke test.
 *
 * Serves the built ./dist itself (no external server needed), opens it in
 * headless Chromium, then walks EVERY channel × section and toggles Simulate,
 * failing the run if any channel logs a console error or throws. A screenshot
 * of each channel is written to tests/screenshots/ and uploaded by the Action.
 *
 * Run locally after `npm run build`:
 *   npm run test:smoke
 * (locally you may need NODE_PATH=/opt/node22/lib/node_modules if playwright is
 *  installed globally; in CI it's a devDependency so the bare import resolves.) */
import { chromium } from 'playwright'
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, extname, resolve } from 'node:path'

const __dir = dirname(fileURLToPath(import.meta.url))
const DIST = resolve(__dir, '../dist')
const SHOTS = join(__dir, 'screenshots')
mkdirSync(SHOTS, { recursive: true })

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.wasm': 'application/wasm',
}

/** Minimal static server for dist/ — falls back to index.html (SPA). */
function serve() {
  return new Promise((res) => {
    const srv = createServer(async (req, rq) => {
      try {
        const url = decodeURIComponent((req.url || '/').split('?')[0])
        let file = join(DIST, url === '/' ? 'index.html' : url)
        let body
        try { body = await readFile(file) }
        catch { file = join(DIST, 'index.html'); body = await readFile(file) }
        rq.writeHead(200, { 'content-type': MIME[extname(file)] || 'application/octet-stream' })
        rq.end(body)
      } catch { rq.writeHead(500); rq.end('err') }
    })
    srv.listen(0, () => res({ srv, port: srv.address().port }))
  })
}

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

async function main() {
  const { srv, port } = await serve()
  const base = `http://localhost:${port}/`
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })

  const failures = []
  let channel = '(load)'
  page.on('console', (m) => { if (m.type() === 'error') failures.push(`[${channel}] console: ${m.text()}`) })
  page.on('pageerror', (e) => failures.push(`[${channel}] pageerror: ${e.message}`))

  await page.goto(base, { waitUntil: 'networkidle' })

  // Discover every channel label from the picker (open, read, close).
  await page.click('.chpick-btn')
  const labels = await page.$$eval('.chpick-item .nm', (els) => els.map((e) => e.textContent.trim()))
  await page.keyboard.press('Escape')
  if (labels.length < 10) failures.push(`expected 10+ channels, found ${labels.length}`)

  for (const label of labels) {
    channel = label
    await page.click('.chpick-btn')
    await page.waitForTimeout(80)
    const item = await page.evaluateHandle(
      (nm) => [...document.querySelectorAll('.chpick-item')].find((i) => i.querySelector('.nm')?.textContent.trim() === nm) || null,
      label,
    )
    const el = item.asElement()
    if (!el) { failures.push(`[${label}] picker item not found`); continue }
    await el.click()
    await page.waitForTimeout(200)

    // Walk every section in the rail.
    const sectionCount = await page.$$eval('.rail-item', (b) => b.length)
    for (let i = 0; i < sectionCount; i++) {
      const btn = (await page.$$('.rail-item'))[i]
      if (btn) { await btn.click(); await page.waitForTimeout(120) }
    }

    // Toggle Simulate on then off (button text flips to "Editing" while on).
    const simBtn = await page.$('button:has-text("Simulate"), button:has-text("Editing")')
    if (simBtn) {
      await simBtn.click(); await page.waitForTimeout(200)
      const off = await page.$('button:has-text("Editing")')
      if (off) { await off.click(); await page.waitForTimeout(120) }
    }

    await page.screenshot({ path: join(SHOTS, `${slug(label)}.png`) })
  }

  await browser.close()
  srv.close()

  if (failures.length) {
    console.error(`\n✗ Smoke test FAILED — ${failures.length} issue(s):`)
    for (const f of failures) console.error('  • ' + f)
    process.exit(1)
  }
  console.log(`\n✓ Smoke test passed — ${labels.length} channels, zero console errors.`)
}

main().catch((e) => { console.error(e); process.exit(1) })
