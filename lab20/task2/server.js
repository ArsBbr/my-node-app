'use strict';

const http = require('http');

const PORT = 3000;
const GROUP = '478';

function sendJson(req, res, status, data) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('X-Powered-By', 'Node.js');
  res.setHeader('X-Group', GROUP);
  res.setHeader('Cache-Control', 'no-cache');
  res.end(req.method === 'HEAD' ? undefined : JSON.stringify(data, null, 2));
}

function logRequest(method, url, status) {
  const time = new Date().toISOString().replace('T', ' ').slice(0, 19);
  console.log('[' + time + '] [' + GROUP + '] ' + method + ' ' + url + ' ' + status);
}

const server = http.createServer((req, res) => {
  const path = new URL(req.url, 'http://localhost').pathname;
  const isHead = req.method === 'HEAD';
  const method = isHead ? 'GET' : req.method;
  let status = 200;

  res.setHeader('X-Group', GROUP);
  res.setHeader('X-Powered-By', 'Node.js');
  res.setHeader('Cache-Control', 'no-cache');

  if (method === 'GET' && path === '/headers') {
    sendJson(req, res, 200, {
      headers: req.headers,
      method: req.method,
      url: req.url,
      httpVersion: req.httpVersion
    });
  } else if (method === 'GET' && path === '/headers/set') {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('X-Custom-Header', 'ArsBbr');
    res.setHeader('X-Temporary', 'remove-me');
    const beforeRemove = res.hasHeader('X-Temporary');
    res.removeHeader('X-Temporary');
    const result = {
      contentType: res.getHeader('Content-Type'),
      poweredBy: res.getHeader('X-Powered-By'),
      xGroup: res.getHeader('X-Group'),
      custom: res.getHeader('X-Custom-Header'),
      temporaryBeforeRemove: beforeRemove,
      temporaryAfterRemove: res.hasHeader('X-Temporary')
    };
    const items = Object.keys(result).map((key) => '<li>' + key + ': ' + result[key] + '</li>').join('');
    res.statusCode = 200;
    res.end(isHead ? undefined : '<h1>Установленные заголовки</h1><ul>' + items + '</ul>');
  } else if (method === 'GET' && path === '/headers/check') {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    sendJson(req, res, 200, {
      hasContentType: res.hasHeader('Content-Type'),
      hasXGroup: res.hasHeader('X-Group'),
      hasUnknown: res.hasHeader('X-Unknown')
    });
  } else {
    status = 404;
    sendJson(req, res, 404, { error: 'Not Found', path: req.url });
  }

  logRequest(req.method, req.url, status);
});

server.listen(PORT, () => {
  console.log('Сервер запущен на порту ' + PORT);
});

