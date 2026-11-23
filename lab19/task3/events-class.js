const EventEmitter = require('events');

const GROUP = '478';

class DatabaseConnection extends EventEmitter {
  constructor(name) {
    super();
    this.name = name;
    this.connected = false;
  }

  connect() {
    console.log('[EVENT] Подключение к БД...');
    this.connected = true;
    this.emit('connect', this.name);
  }

  query(sql) {
    if (!this.connected) {
      this.error('Соединение не установлено');
      return;
    }

    console.log(`[EVENT] Выполнение запроса: ${sql}`);

    const select = sql.trim().toUpperCase().startsWith('SELECT');
    const rows = select ? 50 : 1;

    this.emit('query', sql, rows);
  }

  close() {
    console.log('[EVENT] Закрытие соединения');
    this.connected = false;
    this.emit('close');
  }

  error(message) {
    this.emit('error', new Error(message));
  }
}

function runDemo() {
  const database = new DatabaseConnection('students');

  database.on('connect', () => {
    console.log('[EVENT] Соединение установлено');
  });

  database.on('query', (sql, rows) => {
    if (rows === 1) {
      console.log(`[EVENT] Результат: ${rows} запись добавлена`);
      return;
    }

    console.log(`[EVENT] Результат: ${rows} записей`);
  });

  database.on('close', () => {
    console.log('[EVENT] Соединение закрыто');
  });

  database.on('error', (error) => {
    console.log(`[EVENT] Ошибка: ${error.message}`);
  });

  console.log(`=== DatabaseConnection (группа ${GROUP}) ===`);

  database.connect();
  database.query('SELECT * FROM students');
  database.query('INSERT INTO students');
  database.close();

  console.log('');
  console.log('=== Демонстрация ошибки ===');

  database.error('Connection timeout');

  console.log('');
  console.log('(без слушателя error — процесс упал бы с исключением)');
}

function runCrash() {
  const database = new DatabaseConnection('students');

  console.log(`=== Падение без слушателя error (группа ${GROUP}) ===`);

  database.connect();
  database.error('Connection timeout');
}

if (process.argv.includes('--crash')) {
  runCrash();
} else {
  runDemo();
}
