import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
const base = resolve(process.cwd());
const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
};
http
  .createServer(async (req, res) => {
    const path = resolve(
      base,
      '.' +
        decodeURIComponent(
          new URL(req.url, 'http://localhost').pathname === '/'
            ? '/frontend/index.html'
            : new URL(req.url, 'http://localhost').pathname,
        ),
    );
    if (
      !(path === base || path.startsWith(base + sep)) ||
      !['.html', '.css', '.js'].includes(extname(path))
    ) {
      res.writeHead(404);
      res.end();
      return;
    }
    try {
      const body = await readFile(path);
      res.writeHead(200, { 'Content-Type': types[extname(path)] });
      res.end(body);
    } catch {
      res.writeHead(404);
      res.end('No encontrado');
    }
  })
  .listen(3000, () => console.log('AgendaYA: http://localhost:3000'));
