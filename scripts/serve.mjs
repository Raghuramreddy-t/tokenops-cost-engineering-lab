import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
const port = Number(process.env.PORT || 4173);
const root = process.cwd();
const types = { '.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml' };
createServer(async (request, response) => {
  try {
    const requestPath = decodeURIComponent((request.url || '/').split('?')[0]);
    let filePath = normalize(join(root, requestPath === '/' ? 'index.html' : requestPath.replace(/^\/+/, '')));
    const metadata = await stat(filePath).catch(() => null);
    if (metadata?.isDirectory()) filePath = join(filePath, 'index.html');
    const body = await readFile(filePath);
    response.writeHead(200, { 'Content-Type': types[extname(filePath)] || 'application/octet-stream', 'Cache-Control':'no-store' });
    response.end(body);
  } catch {
    response.writeHead(404, { 'Content-Type':'text/plain; charset=utf-8' });
    response.end('Not found');
  }
}).listen(port, () => console.log(`TokenOps local portfolio harness: http://localhost:${port}`));
