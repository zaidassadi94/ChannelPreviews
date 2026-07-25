// Build the single-file, body-only HTML the Artifact wrapper expects:
// <style>…css…</style> + <div id="root"></div> + <script type="module">…js…</script>
// (the wrapper supplies <!doctype>/<head>/<body>). Run AFTER `npm run build`.
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

const d = 'dist'
const html = readFileSync(join(d, 'index.html'), 'utf8')
const js = html.match(/src="([^"]*\.js)"/)[1].replace(/^\//, '')
const css = html.match(/href="([^"]*\.css)"/)[1].replace(/^\//, '')

// Vendored recorder libs live in public/ (served at the site root). Vite copies them to
// dist/ verbatim; inline them as classic scripts BEFORE the module so window.gifenc /
// window.ChannelStudioRecorder exist when the app's effects run inside the artifact too.
// They degrade gracefully there (getDisplayMedia is blocked by the artifact sandbox).
const gif = readFileSync(join(d, 'gif-encoder.js'), 'utf8')
const rec = readFileSync(join(d, 'recorder.js'), 'utf8')

const out =
  `<style>\n${readFileSync(join(d, css), 'utf8')}\n</style>\n` +
  `<div id="root"></div>\n` +
  `<script>\n${gif}\n</script>\n` +
  `<script>\n${rec}\n</script>\n` +
  `<script type="module">\n${readFileSync(join(d, js), 'utf8')}\n</script>\n`

writeFileSync('channel-studio.html', out)
console.log('wrote channel-studio.html', (out.length / 1024).toFixed(0) + 'KB', '(js=' + js + ', css=' + css + ', +recorder libs)')
