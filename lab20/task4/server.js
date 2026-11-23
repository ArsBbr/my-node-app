'use strict';

const http = require('http');

const PORT = 3000;
const GROUP = '478';
const FIO = 'Барбажинский Арсений';

let students = [
  { id: 1, name: 'Иван', group: '478' },
  { id: 2, name: 'Мария', group: '499' }
];
let nextId = 3;

function compile(pattern) {
  const names = [];
  const source = pattern.split('/').map((part) => {
    if (part.startsWith(':')) {
      names.push(part.slice(1));
      return '([^/]+)';
    }
    return part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }).join('/');
  return { regex: new RegExp('^' + source + '$'), names: names };
}

function sendJson(res, status, data) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('X-Group', GROUP);
  res.end(JSON.stringify(data, null, 2));
}

function sendHtml(res, status, html) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('X-Group', GROUP);
  res.end(html);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

async function readJson(req) {
  const raw = await readBody(req);
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch (err) {
    return null;
  }
}

function logRequest(method, url, status) {
  const time = new Date().toISOString().replace('T', ' ').slice(0, 19);
  console.log('[' + time + '] [' + GROUP + '] ' + method + ' ' + url + ' ' + status);
}

const routes = [];

function add(method, pattern, handler) {
  routes.push({ method: method, pattern: pattern, route: compile(pattern), handler: handler });
}

add('GET', '/', (ctx) => {
  const items = routes.map((r) => '<li>' + r.method + ' ' + r.pattern + '</li>').join('');
  sendHtml(ctx.res, 200, '<h1>Лабораторная работа №20</h1><p>Группа: ' + GROUP + '</p><p>Студент: ' + FIO + '</p><ul>' + items + '</ul>');
});

add('GET', '/users/:id', (ctx) => {
  sendJson(ctx.res, 200, { userId: ctx.params.id });
});

add('GET', '/users/:userId/posts/:postId', (ctx) => {
  sendJson(ctx.res, 200, { userId: ctx.params.userId, postId: ctx.params.postId });
});

add('GET', '/search', (ctx) => {
  const q = ctx.query.q || '';
  const limit = Number(ctx.query.limit) || 10;
  const results = students.filter((s) => s.name.toLowerCase().includes(q.toLowerCase())).slice(0, limit);
  sendJson(ctx.res, 200, { q: q, limit: limit, results: results });
});

add('GET', '/api/students', (ctx) => {
  const result = ctx.query.group ? students.filter((s) => s.group === ctx.query.group) : students;
  sendJson(ctx.res, 200, result);
});

add('GET', '/api/students/:id', (ctx) => {
  const student = students.find((s) => s.id === Number(ctx.params.id));
  if (!student) {
    sendJson(ctx.res, 404, { error: 'Student not found' });
    return;
  }
  sendJson(ctx.res, 200, student);
});

add('POST', '/api/students', async (ctx) => {
  const data = await readJson(ctx.req);
  if (!data) {
    sendJson(ctx.res, 400, { error: 'Invalid JSON' });
    return;
  }
  const student = { id: nextId++, name: data.name || '', group: data.group || GROUP };
  students.push(student);
  sendJson(ctx.res, 201, student);
});

add('PUT', '/api/students/:id', async (ctx) => {
  const student = students.find((s) => s.id === Number(ctx.params.id));
  if (!student) {
    sendJson(ctx.res, 404, { error: 'Student not found' });
    return;
  }
  const data = await readJson(ctx.req);
  if (!data) {
    sendJson(ctx.res, 400, { error: 'Invalid JSON' });
    return;
  }
  if (data.name !== undefined) student.name = data.name;
  if (data.group !== undefined) student.group = data.group;
  sendJson(ctx.res, 200, student);
});

add('DELETE', '/api/students/:id', (ctx) => {
  const id = Number(ctx.params.id);
  const index = students.findIndex((s) => s.id === id);
  if (index === -1) {
    sendJson(ctx.res, 404, { error: 'Student not found' });
    return;
  }
  students.splice(index, 1);
  sendJson(ctx.res, 200, { deleted: true, id: id });
});

const server = http.createServer(async (req, res) => {
  res.setHeader('X-Group', GROUP);
  let status = 200;

  try {
    const url = new URL(req.url, 'http://localhost');
    const pathname = decodeURIComponent(url.pathname);
    const query = Object.fromEntries(url.searchParams.entries());
    let matchedPath = false;

    for (const item of routes) {
      const match = item.route.regex.exec(pathname);
      if (!match) continue;
      matchedPath = true;
      if (item.method !== req.method) continue;
      const params = {};
      item.route.names.forEach((name, index) => {
        params[name] = decodeURIComponent(match[index + 1]);
      });
      await item.handler({ req: req, res: res, params: params, query: query });
      status = res.statusCode;
      logRequest(req.method, req.url, status);
      return;
    }

    if (matchedPath) {
      status = 405;
      res.setHeader('Allow', routes.filter((r) => r.route.regex.test(pathname)).map((r) => r.method).join(', '));
      sendJson(res, 405, { error: 'Method Not Allowed' });
    } else {
      status = 404;
      sendJson(res, 404, { error: 'Not Found', path: req.url });
    }
    logRequest(req.method, req.url, status);
  } catch (err) {
    status = 500;
    sendJson(res, 500, { error: err.message });
    logRequest(req.method, req.url, status);
  }
});

server.listen(PORT, () => {
  console.log('Сервер запущен на порту ' + PORT);
});

