// logger.js — Задание 2: система логирования через события
const fs = require('fs');

function setupLogger(app) {
  const events = ['server:started', 'server:stopped', 'request:received'];

  events.forEach((eventName) => {
    app.on(eventName, (data) => {
      const time = new Date().toISOString();

      let info;
      if (eventName === 'request:received') {
        info = `${data.method} ${data.url}`;
      } else if (eventName === 'server:started') {
        info = `port=${data}`;
      } else {
        info = 'server stopped';
      }

      const line = `[${time}] ${eventName}: ${info}\n`;

      fs.appendFile('logs.txt', line, (err) => {
        if (err) console.error('Ошибка записи в лог:', err);
      });
    });
  });
}

module.exports = { setupLogger };
