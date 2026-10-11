import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const serverDir = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(serverDir, '../dist/public');
const portFlagIndex = process.argv.indexOf('--port');
const port = Number(
  process.env.PORT ||
    (portFlagIndex !== -1 ? process.argv[portFlagIndex + 1] : undefined) ||
    3000,
);
const basePath = (process.env.BASE_PATH || '/').replace(/\/+$/, '');

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
};

function resolveRequestPath(pathname) {
  let route = decodeURIComponent(pathname);
  if (basePath && route.startsWith(basePath)) {
    route = route.slice(basePath.length) || '/';
  }
  const relative = route.replace(/^\/+/, '');
  const resolved = path.resolve(publicDir, relative || 'index.html');
  if (resolved !== publicDir && !resolved.startsWith(`${publicDir}${path.sep}`)) {
    return null;
  }
  return resolved;
}

const server = createServer(async (request, response) => {
  if (!['GET', 'HEAD'].includes(request.method || 'GET')) {
    response.writeHead(405, { allow: 'GET, HEAD' });
    response.end();
    return;
  }

  let target;
  try {
    const requestUrl = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`);
    target = resolveRequestPath(requestUrl.pathname);
  } catch {
    response.writeHead(400);
    response.end('Bad request');
    return;
  }

  if (!target) {
    response.writeHead(403);
    response.end('Forbidden');
    return;
  }

  try {
    const fileInfo = await stat(target);
    if (fileInfo.isDirectory()) target = path.join(target, 'index.html');
  } catch {
    target = path.join(publicDir, 'index.html');
  }

  try {
    const body = await readFile(target);
    response.writeHead(200, {
      'content-type': mimeTypes[path.extname(target).toLowerCase()] || 'application/octet-stream',
      'cache-control': path.basename(target) === 'index.html' ? 'no-cache' : 'public, max-age=3600',
    });
    response.end(request.method === 'HEAD' ? undefined : body);
  } catch {
    response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    response.end('Not found');
  }
});

server.listen(port, '0.0.0.0', () => {
  console.info(`TopFlex web app listening on port ${port}`);
});
