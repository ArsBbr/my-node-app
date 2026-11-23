const express = require('express');
const jwt = require('jsonwebtoken');
const swaggerUi = require('swagger-ui-express');

const app = express();
const PORT = 3000;
const JWT_SECRET = 'lab16_secret_478';
const CACHE_TTL = 5 * 60 * 1000;

app.use(express.json());

const genresList = ['роман', 'фантастика', 'детектив', 'поэзия', 'история'];
const authorsList = ['Толстой', 'Достоевский', 'Булгаков', 'Пушкин', 'Чехов', 'Лермонтов', 'Гоголь', 'Тургенев'];
const titlesList = [
  'Тени прошлого',
  'Хроники времени',
  'Северный ветер',
  'Тайна старого дома',
  'Дорога к звёздам',
  'Осенний вальс',
  'Забытый дневник',
  'Город на Неве',
  'Свет далёких окон',
  'Эхо эпохи'
];

let books = [];
for (let i = 1; i <= 100; i++) {
  const titleBase = titlesList[(i - 1) % titlesList.length];
  const author = authorsList[(i - 1) % authorsList.length];
  const genre = genresList[(i - 1) % genresList.length];
  const year = 1850 + ((i * 7) % 175);
  const isbn = `978-5-478-${String(i).padStart(5, '0')}-${i % 10}`;
  books.push({
    id: i,
    title: `${titleBase} (Том ${Math.ceil(i / 10)})`,
    author,
    year,
    genre,
    isbn,
    group: '478',
    available: i % 3 !== 0,
    reviews: []
  });
}
let nextBookId = 101;

const users = [
  {
    id: 1,
    email: 'arsenbarbaz@gmail.com',
    password: 'password123',
    name: 'Барбажинский Арсений',
    role: 'admin'
  }
];
let nextUserId = 2;

const cache = new Map();

const clearCache = () => {
  cache.clear();
};

const cacheMiddleware = (req, res, next) => {
  const key = req.originalUrl;
  const cached = cache.get(key);
  if (cached && Date.now() < cached.expiresAt) {
    res.setHeader('X-Cache', 'HIT');
    return res.json(cached.data);
  }
  const originalJson = res.json.bind(res);
  res.json = (body) => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      cache.set(key, { data: body, expiresAt: Date.now() + CACHE_TTL });
    }
    res.setHeader('X-Cache', 'MISS');
    return originalJson(body);
  };
  next();
};

const authenticate = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Требуется токен авторизации' });
  }
  const token = header.slice(7);
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Недействительный или истёкший токен' });
  }
};

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Доступ разрешён только администраторам' });
  }
  next();
};

const validateBook = (req, res, next) => {
  const { title, author, year, genre, isbn } = req.body;
  const currentYear = new Date().getFullYear();

  if (!title || !String(title).trim()) {
    return res.status(400).json({ error: 'Название книги обязательно' });
  }
  if (!author || !String(author).trim()) {
    return res.status(400).json({ error: 'Автор книги обязателен' });
  }
  const numYear = Number(year);
  if (!Number.isInteger(numYear) || numYear < 1000 || numYear > currentYear) {
    return res.status(400).json({ error: 'Год издания должен быть корректным числом' });
  }
  if (!genre || !genresList.includes(String(genre).toLowerCase())) {
    return res.status(400).json({
      error: `Жанр должен быть одним из: ${genresList.join(', ')}`
    });
  }
  if (isbn && !/^978-\d-\d{3}-\d{5}-\d$/.test(String(isbn))) {
    return res.status(400).json({ error: 'Неверный формат ISBN (пример: 978-5-478-00101-1)' });
  }
  next();
};

const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'Library REST API — Лабораторная работа №16 (Группа 478)',
    version: '1.0.0',
    description: 'REST API для управления библиотекой с JWT, фильтрацией, экспортом/импортом и кэшированием'
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    }
  },
  paths: {
    '/api/books': {
      get: {
        summary: 'Получить список книг',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Успешно' } }
      }
    }
  }
};

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.post('/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.find((u) => u.email === email && u.password === password);
  if (!user) {
    return res.status(401).json({ error: 'Неверный email или пароль' });
  }
  const token = jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role },
    JWT_SECRET,
    { expiresIn: '2h' }
  );
  res.json({ token, role: user.role });
});

app.get('/api/books', authenticate, cacheMiddleware, (req, res) => {
  res.json({ total: books.length, books: books.slice(0, 10) });
});

app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
  console.log(`Документация Swagger: http://localhost:${PORT}/api-docs`);
});
