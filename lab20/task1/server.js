'use strict';

const http = require('http');

const PORT = 3000;
const GROUP = '478';
const FIO = 'Барбажинский Арсений';
const EMAIL = 'arsenbarbaz@gmail.com';
const LAB = 20;
const DATE = '2026-11-24';

const routes = [
  { method: 'GET', path: '/', description: 'главная страница' },
  { method: 'GET', path: '/about', description: 'информация о студенте' }
];

function logRequest(method, url, status) {
  const time = new Date().toISOString().replace('T', ' ').slice(0, 19);
  console.log('[' + time + '] [' + GROUP + '] ' + method + ' ' + url + ' ' + status);
}

function page(title, content) {
  return '<!DOCTYPE html>\n<html>\n<head><meta charset="utf-8"><title>' + title + '</title></head>\n<body>\n' + content + '\n</body>\n</html>';
}

const server = http.createServer((req, res) => {
  const path = new URL(req.url, 'http://localhost').pathname;
  let status = 200;
  let content = '';

  res.setHeader('X-Group', GROUP);
  res.setHeader('Content-Type', 'text/html; charset=utf-8');

  if (req.method === 'GET' && path === '/') {
    const items = routes.map((route) => '<li>' + route.method + ' ' + route.path + ' - ' + route.description + '</li>').join('');
    content = page('Лабораторная работа №' + LAB,
      '<h1>Лабораторная работа №' + LAB + '</h1>' +
      '<p>Группа: ' + GROUP + '</p>' +
      '<p>Студент: ' + FIO + '</p>' +
      '<p>Email: ' + EMAIL + '</p>' +
      '<p>Дата: ' + DATE + '</p>' +
      '<p>Метод: ' + req.method + '</p>' +
      '<p>URL: ' + req.url + '</p>' +
      '<ul>' + items + '</ul>');
  } else if (req.method === 'GET' && path === '/about') {
    content = page('О студенте',
      '<h1>О студенте</h1>' +
      '<p>Группа: ' + GROUP + '</p>' +
      '<p>Студент: ' + FIO + '</p>' +
      '<p>Email: ' + EMAIL + '</p>' +
      '<p>Метод: ' + req.method + '</p>' +
      '<p>URL: ' + req.url + '</p>');
  } else {
    status = 404;
    content = page('404 Not Found', '<h1>404 Not Found</h1><p>Путь ' + req.url + ' не найден</p>');
  }

  res.statusCode = status;
  res.end(content);
  logRequest(req.method, req.url, status);
});

server.listen(PORT, () => {
  console.log('Сервер запущен на порту ' + PORT);
});

