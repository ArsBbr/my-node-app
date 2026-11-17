const express = require('express');

const app = express();
const PORT = 3000;

app.use(express.json());

let books = [
  { id: 1, title: 'Война и мир', author: 'Толстой', year: 1869 },
  { id: 2, title: 'Анна Каренина', author: 'Толстой', year: 1877 },
  { id: 3, title: 'Евгений Онегин', author: 'Пушкин', year: 1833 }
];
let nextId = 4;

app.get('/api/books', (req, res) => {
  res.json(books);
});

app.get('/api/books/search', (req, res) => {
  const { author } = req.query;
  if (!author) {
    return res.status(400).json({ error: 'Укажите параметр author' });
  }
  const found = books.filter((b) =>
    b.author.toLowerCase().includes(String(author).toLowerCase())
  );
  res.json(found);
});

app.get('/api/books/:id', (req, res) => {
  const book = books.find((b) => b.id === Number(req.params.id));
  if (!book) {
    return res.status(404).json({ error: 'Книга не найдена' });
  }
  res.json(book);
});

app.post('/api/books', (req, res) => {
  const { title, author, year } = req.body;
  if (!title || !author || !Number.isInteger(Number(year))) {
    return res.status(400).json({ error: 'Некорректные данные книги' });
  }
  const newBook = {
    id: nextId++,
    title: String(title).trim(),
    author: String(author).trim(),
    year: Number(year)
  };
  books.push(newBook);
  res.status(201).json(newBook);
});

app.put('/api/books/:id', (req, res) => {
  const book = books.find((b) => b.id === Number(req.params.id));
  if (!book) {
    return res.status(404).json({ error: 'Книга не найдена' });
  }
  const { title, author, year } = req.body;
  if (title !== undefined) {
    if (!String(title).trim()) {
      return res.status(400).json({ error: 'Название не может быть пустым' });
    }
    book.title = String(title).trim();
  }
  if (author !== undefined) {
    if (!String(author).trim()) {
      return res.status(400).json({ error: 'Автор не может быть пустым' });
    }
    book.author = String(author).trim();
  }
  if (year !== undefined) {
    if (!Number.isInteger(Number(year))) {
      return res.status(400).json({ error: 'Некорректный год издания' });
    }
    book.year = Number(year);
  }
  res.json(book);
});

app.delete('/api/books/:id', (req, res) => {
  const index = books.findIndex((b) => b.id === Number(req.params.id));
  if (index === -1) {
    return res.status(404).json({ error: 'Книга не найдена' });
  }
  books.splice(index, 1);
  res.json({ message: `Книга с ID ${req.params.id} успешно удалена` });
});

app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});
