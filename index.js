
const http = require('http');
const EventEmitter = require('events'); // for fix
const { setupLogger } = require('./logger');

class AppServer extends EventEmitter {
  constructor() {
    super();
    this.server = null;

    this.on('server:started', (port) => {
      console.log(` Сервер запущен на порту ${port}`);
    });
    this.on('request:received', (req) => {
      console.log(` Получен запрос: ${req.method} ${req.url}`);
    });
    this.on('server:stopped', () => {
      console.log(' Сервер остановлен');
    });
  }

  start(port) {
    this.server = http.createServer((req, res) => {
      this.emit('request:received', req);
      res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Hello from Event-Driven Server!');
    });
    this.server.listen(port, () => {
      this.emit('server:started', port);
    });
  }

  stop() {
    if (this.server) {
      this.server.close(() => this.emit('server:stopped'));
    }
  }
}

const app = new AppServer();


setupLogger(app);

app.start(3000);

setTimeout(() => {
  app.stop();
}, 10000);