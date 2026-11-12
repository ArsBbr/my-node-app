const Koa = require('koa');
const Router = require('@koa/router');

const app = new Koa();
const router = new Router();

const PORT = 3000;
const GROUP = 'ББМО-01-23';

router.get('/', (ctx) => {
  const now = new Date().toLocaleString('ru-RU');
  ctx.type = 'text/html; charset=utf-8';
  ctx.body = `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8" />
  <title>Лабораторная работа №15</title>
</head>
<body style="font-family: Arial, sans-serif; margin: 40px;">
  <h1>Лабораторная работа №15</h1>
  <p>Добро пожаловать! Простой HTTP-сервер на Koa.js запущен.</p>
  <p><strong>Группа:</strong> ${GROUP}</p>
  <p><strong>Текущая дата и время:</strong> ${now}</p>
</body>
</html>`;
});

app.use(router.routes());
app.use(router.allowedMethods());

app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});
