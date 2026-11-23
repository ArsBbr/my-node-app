'use strict';

const http = require('http');

const PORT = 3000;
const GROUP = '478';
const LIMIT = 1024 * 1024;

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    let overflow = false;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > LIMIT) {
        overflow = true;
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      if (overflow) {
        const err = new Error('Payload Too Large');
        err.tooLarge = true;
        err.size = size;
        reject(err);
        return;
      }
      resolve({ buffer: Buffer.concat(chunks), size: size });
    });
    req.on('error', reject);
  });
}

function parseBody(buffer, contentType) {
  const raw = buffer.toString('utf8');
  if (contentType.includes('application/json')) {
    try {
      return { type: 'json', value: JSON.parse(raw) };
    } catch (err) {
      return { type: 'error', value: { error: 'Invalid JSON' } };
    }
  }
  if (contentType.includes('application/x-www-form-urlencoded')) {
    const params = new URLSearchParams(raw);
    const value = {};
    params.forEach((val, key) => {
      value[key] = val;
    });
    return { type: 'form', value: value };
  }
  if (contentType.includes('text/plain')) {
    return { type: 'text', value: raw };
  }
  return { type: 'binary', value: buffer };
}

function sendJson(res, status, data) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('X-Group', GROUP);
  res.end(JSON.stringify(data, null, 2));
}

function logRequest(method, url, status, size) {
  const time = new Date().toISOString().replace('T', ' ').slice(0, 19);
  console.log('[' + time + '] [' + GROUP + '] ' + method + ' ' + url + ' ' + status + ' size=' + size);
}

const server = http.createServer((req, res) => {
  const path = new URL(req.url, 'http://localhost').pathname;
  res.setHeader('X-Group', GROUP);

  if (req.method !== 'POST') {
    sendJson(res, 404, { error: 'Not Found', path: req.url });
    logRequest(req.method, req.url, 404, 0);
    return;
  }

  readBody(req).then((body) => {
    const parsed = parseBody(body.buffer, req.headers['content-type'] || '');
    let status = 200;

    if (path === '/echo') {
      if (parsed.type === 'json') {
        const value = parsed.value;
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          value.group = GROUP;
        }
        sendJson(res, 200, value);
      } else if (parsed.type === 'form') {
        sendJson(res, 200, parsed.value);
      } else if (parsed.type === 'error') {
        status = 400;
        sendJson(res, 400, parsed.value);
      } else if (parsed.type === 'text') {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.end(parsed.value);
      } else {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/octet-stream');
        res.end(parsed.value);
      }
    } else if (path === '/form') {
      sendJson(res, 200, parsed.type === 'form' ? parsed.value : { error: 'Expected form-data' });
    } else {
      status = 404;
      sendJson(res, 404, { error: 'Not Found', path: req.url });
    }

    logRequest(req.method, req.url, status, body.size);
  }).catch((err) => {
    if (err.tooLarge) {
      res.statusCode = 413;
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.end('413 Payload Too Large');
      logRequest(req.method, req.url, 413, err.size);
    } else {
      res.statusCode = 500;
      res.end('Internal Server Error');
      logRequest(req.method, req.url, 500, 0);
    }
  });
});

server.listen(PORT, () => {
  console.log('Сервер запущен на порту ' + PORT);
});

