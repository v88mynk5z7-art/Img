const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const specs = require(process.argv[2]);
const outDir = process.argv[3]; fs.mkdirSync(outDir, { recursive: true });
const only = process.argv[4] ? process.argv[4].split(',') : null;
const types = { '.html': 'text/html', '.js': 'text/javascript', '.woff2': 'font/woff2' };
const srv = http.createServer((q, r) => {
  const f = path.join(__dirname, decodeURIComponent(q.url.split('?')[0]));
  fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); r.end(d); });
}).listen(8765, async () => {
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage();
  p.on('console', m => console.log('console:', m.text())); p.on('pageerror', e => console.log('ERR', e.message));
  await p.goto('http://localhost:8765/index.html');
  await p.waitForFunction(() => window.ready); await p.evaluate(() => window.ready);
  for (const s of specs) {
    if (only && !only.includes(s.file)) continue;
    const t = Date.now();
    const url = await p.evaluate(s => window.renderShot(s), s);
    fs.writeFileSync(path.join(outDir, s.file + '.png'), Buffer.from(url.split(',')[1], 'base64'));
    console.log(s.file, Date.now() - t, 'ms');
  }
  await b.close(); srv.close();
});
