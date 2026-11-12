const Koa = require('koa');
const Router = require('@koa/router');

const app = new Koa();
const router = new Router();

const PORT = 3000;

function formatDate(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
         `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    const status = err.status || err.statusCode || 500;
    ctx.status = status;
    ctx.body = {
      error: status === 500 ? 'Внутренняя ошибка сервера' : err.message,
      status,
    };
  }
});

app.use(async (ctx, next) => {
  const startTime = new Date();
  await next();
  const endTime = new Date();
  const duration = endTime - startTime;
  console.log(`[${formatDate(startTime)}] ${ctx.method} ${ctx.path} ${duration}ms`);
});

const authMiddleware = async (ctx, next) => {
  const authHeader = ctx.headers['authorization'];
  if (!authHeader || !authHeader.trim()) {
    ctx.throw(401, 'Требуется заголовок Authorization');
  }
  await next();
};

router.get('/users', (ctx) => {
  ctx.body = [{ id: 1, name: 'Иванов Иван', group: 'ББМО-01-23' }];
});

router.get('/protected', authMiddleware, (ctx) => {
  ctx.body = {
    message: 'Доступ к защищённому маршруту разрешён',
    authorization: ctx.headers['authorization'],
  };
});

router.get('/error', () => {
  throw new Error('Искусственная ошибка для тестирования');
});

app.use(router.routes());
app.use(router.allowedMethods());

app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});
