import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const root = path.resolve('site'); const types = { '.html':'text/html; charset=utf-8', '.js':'text/javascript', '.svg':'image/svg+xml', '.css':'text/css', '.json':'application/json' };
http.createServer((q, r) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html'; const f = path.join(root, p);
  if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end('nf'); }
  r.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); }).listen(5174, '127.0.0.1');
