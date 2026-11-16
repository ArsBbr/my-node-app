const express = require('express');

const app = express();
const PORT = 3000;

const navLinks = `
  <nav>
    <a href="/">Главная</a> |
    <a href="/about">О разработчике</a> |
    <a href="/contacts">Контакты</a>
  </nav>
  <hr>
`;

app.get('/', (req, res) => {
  const now = new Date().toLocaleString('ru-RU');
  res.send(`
    <!DOCTYPE html>
    <html lang="ru">
    <head>
      <meta charset="UTF-8">
      <title>Лабораторная работа №16</title>
    </head>
    <body>
      ${navLinks}
      <h1>Лабораторная работа №16</h1>
      <p>Добро пожаловать! Веб-сервер на фреймворке Express.js успешно запущен.</p>
      <p><strong>Группа:</strong> 478</p>
      <p><strong>Текущая дата и время:</strong> ${now}</p>
      <h3>Доступные маршруты:</h3>
      <ul>
        <li><a href="/">GET /</a> — главная страница</li>
        <li><a href="/about">GET /about</a> — информация о разработчике</li>
        <li><a href="/contacts">GET /contacts</a> — контактная информация</li>
      </ul>
    </body>
    </html>
  `);
});

app.get('/about', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="ru">
    <head>
      <meta charset="UTF-8">
      <title>О разработчике</title>
    </head>
    <body>
      ${navLinks}
      <h1>Информация о разработчике</h1>
      <p><strong>Студент:</strong> Барбажинский Арсений</p>
      <p><strong>Группа:</strong> 478</p>
      <p><strong>Работа:</strong> Лабораторная работа №16 (Express.js)</p>
    </body>
    </html>
  `);
});

app.get('/contacts', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="ru">
    <head>
      <meta charset="UTF-8">
      <title>Контакты</title>
    </head>
    <body>
      ${navLinks}
      <h1>Контактная информация</h1>
      <p><strong>Email:</strong> arsenbarbaz@gmail.com</p>
      <p><strong>GitHub:</strong> <a href="https://github.com/ArsBbr">https://github.com/ArsBbr</a></p>
    </body>
    </html>
  `);
});

app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});
