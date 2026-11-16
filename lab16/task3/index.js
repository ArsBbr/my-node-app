const express = require('express');
const compression = require('compression');

const app = express();
const PORT = 3000;

app.use(express.json());

const rateStore = new Map();
const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 100;

const formatDate = (date) => {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

app.use((req, res, next) => {
  const start = Date.now();
  const timestamp = formatDate(new Date());
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${timestamp}] ${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
  });
  next();
});

app.use((req, res, next) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const record = rateStore.get(ip);

  if (!record || now > record.resetTime) {
    rateStore.set(ip, { count: 1, resetTime: now + WINDOW_MS });
    res.setHeader('X-RateLimit-Limit', MAX_REQUESTS);
    res.setHeader('X-RateLimit-Remaining', MAX_REQUESTS - 1);
    return next();
  }

  record.count += 1;
  const remaining = Math.max(0, MAX_REQUESTS - record.count);
  res.setHeader('X-RateLimit-Limit', MAX_REQUESTS);
  res.setHeader('X-RateLimit-Remaining', remaining);
  res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000));

  if (record.count > MAX_REQUESTS) {
    return res.status(429).json({
      error: 'Слишком много запросов. Повторите попытку позже.',
      status: 429
    });
  }

  next();
});

app.use(compression());

app.get('/books', (req, res) => {
  res.json([
    { id: 1, title: 'Война и мир', author: 'Толстой', year: 1869 },
    { id: 2, title: 'Преступление и наказание', author: 'Достоевский', year: 1866 }
  ]);
});

app.get('/error', (req, res) => {
  const err = new Error('Тестовая синхронная ошибка сервера');
  err.status = 500;
  throw err;
});

app.get('/async-error', async (req, res, next) => {
  try {
    await new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Тестовая асинхронная ошибка сервера')), 10)
    );
  } catch (err) {
    err.status = 500;
    next(err);
  }
});

app.use((req, res) => {
  res.status(404).json({ error: 'Маршрут не найден', status: 404 });
});

app.use((err, req, res, next) => {
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'Внутренняя ошибка сервера',
    status
  });
});

app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});
