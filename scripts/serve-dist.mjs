// Pratinjau hasil build (dist/) dengan perilaku SPA fallback seperti di cPanel.
// Dipakai oleh `npm run preview:cpanel`. Tidak diperlukan saat hosting produksi.
import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { extname, join, normalize, resolve, sep } from 'node:path'

const root = resolve(process.argv[2] ?? 'dist')
const port = Number(process.env.PORT ?? 4173)

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.json': 'application/json',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
}

createServer(async (req, res) => {
  const pathname = decodeURIComponent(new URL(req.url ?? '/', 'http://localhost').pathname)
  let file = join(root, normalize(pathname))
  if (file !== root && !file.startsWith(root + sep)) {
    res.writeHead(403).end('forbidden')
    return
  }
  try {
    const info = await stat(file)
    if (info.isDirectory()) file = join(file, 'index.html')
  } catch {
    file = join(root, 'index.html')
  }
  try {
    const data = await readFile(file)
    res.writeHead(200, {
      'content-type': MIME[extname(file).toLowerCase()] ?? 'application/octet-stream',
      'cache-control': 'no-store',
    })
    res.end(data)
  } catch {
    res.writeHead(404).end('not found')
  }
}).listen(port, '0.0.0.0', () => {
  console.log(`Preview build siap di http://localhost:${port}`)
})
