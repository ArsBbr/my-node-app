'use strict';

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const HTTP_PORT = 3000;
const HTTPS_PORT = 3443;
const GROUP = '478';
const FIO = 'Барбажинский Арсений';
const PUBLIC_DIR = path.join(__dirname, 'public');
const CERTS_DIR = path.join(__dirname, 'certs');
const LOG_FILE = path.join(__dirname, 'access.log');
const BIG_FILE = path.join(PUBLIC_DIR, 'big-file.bin');
const CACHE_TTL = 60000;

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.bin': 'application/octet-stream'
};

const metrics = {
  total: 0,
  byMethod: {},
  byStatus: {},
  startedAt: Date.now()
};

const cache = new Map();

function createApp() {
  const middlewares = [];
  return {
    use: function (fn) {
      middlewares.push(fn);
    },
    handle: function (req, res) {
      let index = 0;
      function next(err) {
        if (err) {
          res.statusCode = 500;
          res.setHeader('X-Group', GROUP);
          res.setHeader('Content-Type', 'text/plain; charset=utf-8');
          res.end('Internal Server Error: ' + err.message);
          return;
        }
        const fn = middlewares[index++];
        if (!fn) {
          res.statusCode = 404;
          res.setHeader('X-Group', GROUP);
          res.setHeader('Content-Type', 'text/plain; charset=utf-8');
          res.end('Not Found');
          return;
        }
        try {
          if (fn.length >= 3) {
            fn(req, res, next);
          } else {
            fn(req, res);
          }
        } catch (error) {
          next(error);
        }
      }
      next();
    }
  };
}

const app = createApp();

app.use((req, res, next) => {
  res.setHeader('X-Group', GROUP);
  const originalEnd = res.end;
  res.end = function () {
    const status = res.statusCode;
    metrics.total++;
    metrics.byMethod[req.method] = (metrics.byMethod[req.method] || 0) + 1;
    metrics.byStatus[status] = (metrics.byStatus[status] || 0) + 1;
    const time = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const line = '[' + time + '] [' + GROUP + '] ' + req.method + ' ' + req.url + ' ' + status;
    console.log(line);
    fs.appendFileSync(LOG_FILE, line + '\n');
    return originalEnd.apply(this, arguments);
  };
  next();
});

app.use((req, res, next) => {
  const rawPath = req.url.split('?')[0];
  if (!rawPath.startsWith('/static/')) {
    next();
    return;
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.statusCode = 405;
    res.end('Method Not Allowed');
    return;
  }
  let relative;
  try {
    relative = decodeURIComponent(rawPath.slice('/static/'.length));
  } catch (err) {
    res.statusCode = 400;
    res.end('Bad Request');
    return;
  }
  const file = path.join(PUBLIC_DIR, relative);
  if (relative.includes('..') || path.isAbsolute(relative) || !file.startsWith(PUBLIC_DIR + path.sep)) {
    res.statusCode = 403;
    res.end('Forbidden');
    return;
  }
  fs.stat(file, (err, stat) => {
    if (err || !stat.isFile()) {
      res.statusCode = 404;
      res.end('Not Found');
      return;
    }
    const etag = '"' + crypto.createHash('md5').update(String(stat.mtimeMs) + '-' + stat.size).digest('hex') + '"';
    res.setHeader('ETag', etag);
    res.setHeader('Last-Modified', stat.mtime.toUTCString());
    res.setHeader('Cache-Control', 'max-age=60');
    res.setHeader('Content-Type', mimeTypes[path.extname(file)] || 'application/octet-stream');
    const modifiedSince = req.headers['if-modified-since'];
    if (req.headers['if-none-match'] === etag || (modifiedSince && new Date(modifiedSince).getTime() >= stat.mtimeMs)) {
      res.statusCode = 304;
      res.end();
      return;
    }
    if (req.method === 'HEAD') {
      res.end();
      return;
    }
    res.statusCode = 200;
    fs.createReadStream(file).pipe(res);
  });
});

app.use((req, res, next) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname !== '/data') {
    next();
    return;
  }
  if (req.method === 'POST') {
    cache.clear();
    res.statusCode = 200;
    res.end('Cache invalidated');
    return;
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.statusCode = 405;
    res.end('Method Not Allowed');
    return;
  }
  const isHead = req.method === 'HEAD';
  const cached = cache.get('data');
  if (cached && Date.now() - cached.time < CACHE_TTL) {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'max-age=60');
    res.setHeader('X-Cache', 'HIT');
    res.end(isHead ? undefined : JSON.stringify(cached.value, null, 2));
    return;
  }
  const value = {
    group: GROUP,
    student: FIO,
    items: [{ id: 1, name: 'Иван' }, { id: 2, name: 'Мария' }],
    generatedAt: new Date().toISOString()
  };
  cache.set('data', { time: Date.now(), value: value });
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'max-age=60');
  res.setHeader('X-Cache', 'MISS');
  res.end(isHead ? undefined : JSON.stringify(value, null, 2));
});

app.use((req, res, next) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname !== '/stream') {
    next();
    return;
  }
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader('Content-Disposition', 'attachment; filename="big-file.bin"');
  if (req.method === 'HEAD') {
    res.end();
    return;
  }
  let sent = 0;
  const stream = fs.createReadStream(BIG_FILE);
  stream.on('data', (chunk) => {
    sent += chunk.length;
    console.log('[STREAM] ' + sent + ' bytes');
  });
  stream.on('error', (err) => {
    res.statusCode = 500;
    res.end(err.message);
  });
  stream.pipe(res);
});

app.use((req, res, next) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname !== '/metrics') {
    next();
    return;
  }
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(req.method === 'HEAD' ? undefined : JSON.stringify({
    group: GROUP,
    student: FIO,
    total: metrics.total,
    byMethod: metrics.byMethod,
    byStatus: metrics.byStatus,
    uptime: Math.floor((Date.now() - metrics.startedAt) / 1000)
  }, null, 2));
});

app.use((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname !== '/') {
    res.statusCode = 404;
    res.end('Not Found');
    return;
  }
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.end(req.method === 'HEAD' ? undefined : '=== HTTPS работает! ===\nГруппа: ' + GROUP + '\nСтудент: ' + FIO + '\n');
});

const handler = (req, res) => app.handle(req, res);
const servers = [http.createServer(handler)];
const httpServer = servers[0];

const keyFile = path.join(CERTS_DIR, 'key.pem');
const certFile = path.join(CERTS_DIR, 'cert.pem');
if (fs.existsSync(keyFile) && fs.existsSync(certFile)) {
  servers.push(https.createServer({ key: fs.readFileSync(keyFile), cert: fs.readFileSync(certFile) }, handler));
}

servers.forEach((server) => {
  server.on('error', (err) => {
    console.error('[ERROR] ' + err.message);
  });
  server.on('clientError', (err, socket) => {
    if (socket.writable) {
      socket.end('HTTP/1.1 400 Bad Request\r\nConnection: close\r\n\r\n');
    }
  });
});

httpServer.listen(HTTP_PORT, () => {
  console.log('[INFO] HTTP-сервер запущен на порту ' + HTTP_PORT);
});

if (servers[1]) {
  servers[1].listen(HTTPS_PORT, () => {
    console.log('[INFO] HTTPS-сервер запущен на порту ' + HTTPS_PORT);
  });
}

console.log('[INFO] Группа: ' + GROUP);

process.on('SIGINT', () => {
  console.log('[INFO] Корректное завершение работы');
  let remaining = servers.length;
  servers.forEach((server) => {
    server.close(() => {
      remaining--;
      if (remaining === 0) process.exit(0);
    });
  });
  setTimeout(() => process.exit(0), 3000).unref();
});

