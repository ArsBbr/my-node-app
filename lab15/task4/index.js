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

function parseGroupInfo(group) {
  const match = /^([А-ЯЁA-Z]{2,6})-(\d{2})-(\d{2})$/i.exec(group.trim());
  if (!match) return null;
  const admissionYear = 2000 + Number(match[3]);
  const calculatedCourse = Math.min(4, Math.max(1, new Date().getFullYear() - admissionYear + 1));
  return {
    department: match[1].toUpperCase(),
    groupNumber: Number(match[2]),
    admissionYear,
    calculatedCourse,
  };
}

let students = [
  { id: 1, name: 'Иванов Иван', group: 'ББМО-01-23', course: 3 },
  { id: 2, name: 'Смирнова Анна', group: 'ББМО-01-23', course: 3 },
  { id: 3, name: 'Петров Пётр', group: 'ББМО-02-24', course: 2 },
];
let nextId = 4;

router.get('/students', (ctx) => {
  const { group } = ctx.query;
  if (group !== undefined) {
    const filtered = students.filter(
      (s) => s.group.toLowerCase() === String(group).trim().toLowerCase()
    );
    ctx.body = filtered;
    return;
  }
  ctx.body = students;
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
  const groupInfo = parseGroupInfo(group);
  const resolvedCourse = course !== undefined ? course : (groupInfo ? groupInfo.calculatedCourse : 1);
  if (!Number.isInteger(resolvedCourse) || resolvedCourse < 1 || resolvedCourse > 4) {
    ctx.throw(400, 'Поле course должно быть целым числом от 1 до 4');
  }
  const newStudent = {
    id: nextId++,
    name: name.trim(),
    group: group.trim().toUpperCase(),
    course: resolvedCourse,
    groupInfo,
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
    ctx.throw(400, 'Передайте хотя бы одно поле для обновления');
  }
  if (name !== undefined) {
    if (typeof name !== 'string' || !name.trim()) ctx.throw(400, 'Невалидное поле name');
    student.name = name.trim();
  }
  if (group !== undefined) {
    if (typeof group !== 'string' || !group.trim()) ctx.throw(400, 'Невалидное поле group');
    student.group = group.trim().toUpperCase();
    student.groupInfo = parseGroupInfo(group);
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
