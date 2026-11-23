const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const LOG_FILE = path.join(__dirname, 'operations.log');

app.use(express.json());

let books = [
  { id: 1, title: 'Война и мир', author: 'Толстой', year: 1869, genre: 'роман' },
  { id: 2, title: 'Преступление и наказание', author: 'Достоевский', year: 1866, genre: 'роман' },
  { id: 3, title: 'Мастер и Маргарита', author: 'Булгаков', year: 1967, genre: 'фантастика' },
  { id: 4, title: 'Евгений Онегин', author: 'Пушкин', year: 1833, genre: 'поэма' },
  { id: 5, title: 'Вишнёвый сад', author: 'Чехов', year: 1904, genre: 'пьеса' }
];
let nextId = 6;

const logOperation = (action, details) => {
  const line = `[${new Date().toISOString()}] ${action}: ${JSON.stringify(details)}
`;
  fs.appendFile(LOG_FILE, line, () => {});
};

app.get('/api/books', (req, res) => {
  let result = [...books];
  const { author, year, yearFrom, yearTo, sort, search } = req.query;

  if (author) {
    const q = String(author).toLowerCase();
    result = result.filter((b) => b.author.toLowerCase().includes(q));
  }

  if (year) {
    result = result.filter((b) => b.year === Number(year));
  }

  if (yearFrom) {
    result = result.filter((b) => b.year >= Number(yearFrom));
  }

  if (yearTo) {
    result = result.filter((b) => b.year <= Number(yearTo));
  }

  if (search) {
    const q = String(search).toLowerCase();
    result = result.filter(
      (b) => b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q)
    );
  }

  if (sort) {
    const field = String(sort);
    const desc = field.startsWith('-');
    const key = desc ? field.slice(1) : field;
    result.sort((a, b) => {
      if (typeof a[key] === 'string') {
        return desc
          ? b[key].localeCompare(a[key], 'ru')
          : a[key].localeCompare(b[key], 'ru');
      }
      return desc ? b[key] - a[key] : a[key] - b[key];
    });
  }

  const total = result.length;
  const limit = Math.max(1, Number(req.query.limit) || 10);
  const page = Math.max(1, Number(req.query.page) || 1);
  const start = (page - 1) * limit;
  const paginated = result.slice(start, start + limit);

  res.json({
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    books: paginated
  });
});

app.get('/api/books/stats', (req, res) => {
  const byAuthor = {};
  const byGenre = {};
  let oldestYear = books.length ? books[0].year : null;
  let newestYear = books.length ? books[0].year : null;

  for (const book of books) {
    byAuthor[book.author] = (byAuthor[book.author] || 0) + 1;
    byGenre[book.genre] = (byGenre[book.genre] || 0) + 1;
    if (book.year < oldestYear) oldestYear = book.year;
    if (book.year > newestYear) newestYear = book.year;
  }

  res.json({
    total: books.length,
    byAuthor,
    oldestYear,
    newestYear,
    byGenre
  });
});

app.get('/api/books/:id', (req, res) => {
  const book = books.find((b) => b.id === Number(req.params.id));
  if (!book) {
    return res.status(404).json({ error: 'Книга не найдена' });
  }
  res.json(book);
});

app.post('/api/books', (req, res) => {
  const { title, author, year, genre } = req.body;
  const currentYear = new Date().getFullYear();

  if (!title || !String(title).trim()) {
    return res.status(400).json({ error: 'Название книги не должно быть пустым' });
  }
  if (!author || !String(author).trim()) {
    return res.status(400).json({ error: 'Автор не должен быть пустым' });
  }
  const numYear = Number(year);
  if (!Number.isInteger(numYear) || numYear < 1000 || numYear > currentYear) {
    return res.status(400).json({ error: 'Некорректный год издания' });
  }

  const duplicate = books.some(
    (b) =>
      b.title.toLowerCase() === String(title).trim().toLowerCase() &&
      b.author.toLowerCase() === String(author).trim().toLowerCase()
  );
  if (duplicate) {
    return res.status(409).json({ error: 'Такая книга этого автора уже существует' });
  }

  const newBook = {
    id: nextId++,
    title: String(title).trim(),
    author: String(author).trim(),
    year: numYear,
    genre: genre ? String(genre).trim() : 'не указан'
  };
  books.push(newBook);
  logOperation('CREATE', newBook);
  res.status(201).json(newBook);
});

app.put('/api/books/:id', (req, res) => {
  const book = books.find((b) => b.id === Number(req.params.id));
  if (!book) {
    return res.status(404).json({ error: 'Книга не найдена' });
  }

  const { title, author, year, genre } = req.body;
  const currentYear = new Date().getFullYear();

  if (title !== undefined) {
    if (!String(title).trim()) {
      return res.status(400).json({ error: 'Название не должно быть пустым' });
    }
    book.title = String(title).trim();
  }
  if (author !== undefined) {
    if (!String(author).trim()) {
      return res.status(400).json({ error: 'Автор не должен быть пустым' });
    }
    book.author = String(author).trim();
  }
  if (year !== undefined) {
    const numYear = Number(year);
    if (!Number.isInteger(numYear) || numYear < 1000 || numYear > currentYear) {
      return res.status(400).json({ error: 'Некорректный год издания' });
    }
    book.year = numYear;
  }
  if (genre !== undefined) {
    book.genre = String(genre).trim();
  }

  logOperation('UPDATE', book);
  res.json(book);
});

app.delete('/api/books/:id', (req, res) => {
  const index = books.findIndex((b) => b.id === Number(req.params.id));
  if (index === -1) {
    return res.status(404).json({ error: 'Книга не найдена' });
  }
  const [deleted] = books.splice(index, 1);
  logOperation('DELETE', deleted);
  res.json({ message: `Книга "${deleted.title}" успешно удалена` });
});

app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});
