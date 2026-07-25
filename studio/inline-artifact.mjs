// Build the single-file, body-only HTML the Artifact wrapper expects:
// <style>…css…</style> + <div id="root"></div> + <script type="module">…js…</script>
// (the wrapper supplies <!doctype>/<head>/<body>). Run AFTER `npm run build`.
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

const d = 'dist'
const html = readFileSync(join(d, 'index.html'), 'utf8')
const js = html.match(/src="([^"]*\.js)"/)[1].replace(/^\//, '')
const css = html.match(/href="([^"]*\.css)"/)[1].replace(/^\//, '')

const out =
  `<style>\n${readFileSync(join(d, css), 'utf8')}\n</style>\n` +
  `<div id="root"></div>\n` +
  `<script type="module">\n${readFileSync(join(d, js), 'utf8')}\n</script>\n`

writeFileSync('channel-studio.html', out)
console.log('wrote channel-studio.html', (out.length / 1024).toFixed(0) + 'KB', '(js=' + js + ', css=' + css + ')')
