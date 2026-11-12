const Koa = require('koa');
const Router = require('@koa/router');
const bodyParser = require('koa-bodyparser');

const app = new Koa();
const router = new Router();

const PORT = 3000;

app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    ctx.status = err.status || 500;
    ctx.body = { error: err.message, status: ctx.status };
  }
});

app.use(bodyParser());

let users = [
  { id: 1, name: 'Иванов Иван', group: 'ББМО-01-23' },
  { id: 2, name: 'Петрова Анна', group: 'ББМО-01-23' },
];
let nextId = 3;

router.get('/api/users', (ctx) => {
  ctx.body = users;
});

router.get('/api/users/:id', (ctx) => {
  const user = users.find((u) => u.id === Number(ctx.params.id));
  if (!user) {
    ctx.throw(404, 'Пользователь не найден');
  }
  ctx.body = user;
});

router.post('/api/users', (ctx) => {
  const { name, group } = ctx.request.body || {};
  if (typeof name !== 'string' || !name.trim() || typeof group !== 'string' || !group.trim()) {
    ctx.throw(400, 'Невалидные данные: требуются поля name и group');
  }
  const newUser = {
    id: nextId++,
    name: name.trim(),
    group: group.trim(),
  };
  users.push(newUser);
  ctx.status = 201;
  ctx.body = newUser;
});

router.put('/api/users/:id', (ctx) => {
  const user = users.find((u) => u.id === Number(ctx.params.id));
  if (!user) {
    ctx.throw(404, 'Пользователь не найден');
  }
  const { name, group } = ctx.request.body || {};
  if (name === undefined && group === undefined) {
    ctx.throw(400, 'Невалидные данные: укажите name или group');
  }
  if (name !== undefined && (typeof name !== 'string' || !name.trim())) {
    ctx.throw(400, 'Невалидное поле name');
  }
  if (group !== undefined && (typeof group !== 'string' || !group.trim())) {
    ctx.throw(400, 'Невалидное поле group');
  }
  if (name !== undefined) user.name = name.trim();
  if (group !== undefined) user.group = group.trim();
  ctx.body = user;
});

router.delete('/api/users/:id', (ctx) => {
  const index = users.findIndex((u) => u.id === Number(ctx.params.id));
  if (index === -1) {
    ctx.throw(404, 'Пользователь не найден');
  }
  users.splice(index, 1);
  ctx.body = { message: `Пользователь с ID ${ctx.params.id} успешно удалён` };
});

app.use(router.routes());
app.use(router.allowedMethods());

app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});
