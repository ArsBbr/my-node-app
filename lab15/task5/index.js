const Koa = require('koa');
const Router = require('@koa/router');
const bodyParser = require('koa-bodyparser');

const app = new Koa();
const router = new Router();

const PORT = 3000;
const BASE_GROUP = 'ББМО-01-23';

app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    ctx.status = err.status || 500;
    ctx.body = { error: err.message, status: ctx.status };
  }
});

app.use(bodyParser());

function generateStudents(baseGroup, count = 50) {
  const firstNames = [
    'Александр', 'Алексей', 'Анна', 'Анастасия', 'Антон',
    'Андрей', 'Дмитрий', 'Екатерина', 'Иван', 'Мария',
    'Максим', 'Никита', 'Ольга', 'Сергей', 'Татьяна',
  ];
  const lastNames = [
    'Иванов', 'Смирнов', 'Кузнецова', 'Попова', 'Петров',
    'Соколова', 'Морозов', 'Волкова', 'Новиков', 'Лебедева',
    'Козлов', 'Новикова', 'Фёдоров', 'Морозова', 'Волков',
  ];
  const match = /^([А-ЯЁA-Z]{2,6})-(\d{2})-(\d{2})$/i.exec(baseGroup);
  const prefix = match ? match[1].toUpperCase() : 'ББМО';
  const year = match ? Number(match[3]) : 23;
  const groups = [
    baseGroup,
    `${prefix}-02-${String(year).padStart(2, '0')}`,
    `${prefix}-03-${String(year).padStart(2, '0')}`,
    `${prefix}-01-${String(year + 1).padStart(2, '0')}`,
  ];

  return Array.from({ length: count }, (_, idx) => ({
    id: idx + 1,
    name: `${firstNames[(idx * 3) % firstNames.length]} ${lastNames[(idx * 7) % lastNames.length]}`,
    group: groups[idx % groups.length],
    course: (idx % 4) + 1,
  }));
}

let students = generateStudents(BASE_GROUP, 50);
let nextId = 51;

router.get('/students', (ctx) => {
  const { limit = '10', offset = '0', sort, search, group } = ctx.query;
  const numLimit = Number(limit);
  const numOffset = Number(offset);

  if (!Number.isInteger(numLimit) || numLimit < 1 || !Number.isInteger(numOffset) || numOffset < 0) {
    ctx.throw(400, 'Некорректные параметры limit или offset');
  }

  let result = [...students];

  if (group) {
    result = result.filter((s) => s.group.toLowerCase() === String(group).trim().toLowerCase());
  }

  if (search) {
    const term = String(search).trim().toLowerCase();
    result = result.filter((s) => s.name.toLowerCase().includes(term));
  }

  if (sort) {
    const desc = sort.startsWith('-');
    const field = desc ? sort.slice(1) : sort;
    if (!['name', 'course', 'id'].includes(field)) {
      ctx.throw(400, 'Недопустимый параметр sort');
    }
    result.sort((a, b) => {
      const cmp = field === 'name' ? a.name.localeCompare(b.name, 'ru') : a[field] - b[field];
      return desc ? -cmp : cmp;
    });
  }

  ctx.body = {
    total: result.length,
    limit: numLimit,
    offset: numOffset,
    students: result.slice(numOffset, numOffset + numLimit),
  };
});

router.get('/students/:id', (ctx) => {
  const student = students.find((s) => s.id === Number(ctx.params.id));
  if (!student) {
    ctx.throw(404, 'Студент не найден');
  }
  ctx.body = student;
});

router.post('/students', (ctx) => {
  const { name, group, course } = ctx.request.body || {};
  if (typeof name !== 'string' || !name.trim() || typeof group !== 'string' || !group.trim()) {
    ctx.throw(400, 'Обязательные поля: name и group');
  }
  if (!Number.isInteger(course) || course < 1 || course > 4) {
    ctx.throw(400, 'Поле course должно быть целым числом от 1 до 4');
  }
  const newStudent = {
    id: nextId++,
    name: name.trim(),
    group: group.trim().toUpperCase(),
    course,
  };
  students.push(newStudent);
  ctx.status = 201;
  ctx.body = newStudent;
});

router.put('/students/:id', (ctx) => {
  const student = students.find((s) => s.id === Number(ctx.params.id));
  if (!student) {
    ctx.throw(404, 'Студент не найден');
  }
  const { name, group, course } = ctx.request.body || {};
  if (name === undefined && group === undefined && course === undefined) {
    ctx.throw(400, 'Укажите поля для обновления');
  }
  if (name !== undefined) {
    if (typeof name !== 'string' || !name.trim()) ctx.throw(400, 'Невалидное поле name');
    student.name = name.trim();
  }
  if (group !== undefined) {
    if (typeof group !== 'string' || !group.trim()) ctx.throw(400, 'Невалидное поле group');
    student.group = group.trim().toUpperCase();
  }
  if (course !== undefined) {
    if (!Number.isInteger(course) || course < 1 || course > 4) {
      ctx.throw(400, 'Поле course должно быть целым числом от 1 до 4');
    }
    student.course = course;
  }
  ctx.body = student;
});

router.delete('/students/:id', (ctx) => {
  const index = students.findIndex((s) => s.id === Number(ctx.params.id));
  if (index === -1) {
    ctx.throw(404, 'Студент не найден');
  }
  students.splice(index, 1);
  ctx.body = { message: `Студент с ID ${ctx.params.id} успешно удалён` };
});

app.use(router.routes());
app.use(router.allowedMethods());

app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});
