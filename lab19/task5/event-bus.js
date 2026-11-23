const EventEmitter = require('events');
const http = require('http');
const os = require('os');

const GROUP = '478';
const PORT = 3000;

function plural(count, forms) {
  const tens = count % 100;
  const units = count % 10;

  if (units === 1 && tens !== 11) {
    return forms[0];
  }

  if (units >= 2 && units <= 4 && (tens < 12 || tens > 14)) {
    return forms[1];
  }

  return forms[2];
}

class EventBus extends EventEmitter {
  constructor(options = {}) {
    super();
    this.group = options.group || GROUP;
    this.calls = new Map();
    this.failures = new Map();
    this.wildcards = [];
    this.lastCall = null;
  }

  on(event, listener, priority = 0) {
    listener.priority = priority;
    return super.on(event, listener);
  }

  once(event, listener, priority = 0) {
    const wrapper = (...args) => {
      this.off(event, wrapper);
      listener(...args);
    };

    wrapper.priority = priority;
    return super.on(event, wrapper);
  }

  off(event, listener) {
    return super.removeListener(event, listener);
  }

  onAny(listener) {
    this.wildcards.push(listener);
    return this;
  }

  offAny(listener) {
    this.wildcards = this.wildcards.filter((item) => item !== listener);
    return this;
  }

  emit(event, ...args) {
    this.calls.set(event, (this.calls.get(event) || 0) + 1);
    this.lastCall = new Date();

    for (const wildcard of this.wildcards) {
      wildcard(event, args);
    }

    const listeners = this.listeners(event)
      .slice()
      .sort((left, right) => (right.priority || 0) - (left.priority || 0));

    if (listeners.length === 0) {
      if (event === 'error') {
        throw args[0];
      }

      return false;
    }

    for (const listener of listeners) {
      try {
        listener.apply(this, args);
      } catch (error) {
        this.failures.set(event, (this.failures.get(event) || 0) + 1);
        console.log(`[ERROR] [${this.group}] Ошибка в слушателе "${event}": ${error.message}`);
      }
    }

    return true;
  }

  getMetrics() {
    const events = {};
    const listeners = {};

    for (const [event, count] of this.calls) {
      events[event] = count;
    }

    for (const event of this.eventNames()) {
      listeners[String(event)] = this.listenerCount(event);
    }

    const total = [...this.calls.values()].reduce((sum, value) => sum + value, 0);

    return {
      group: this.group,
      events,
      total,
      lastCall: this.lastCall ? this.lastCall.toISOString() : null,
      listeners
    };
  }
}

function requestJson(url) {
  return new Promise((resolve, reject) => {
    const request = http.get(url, (response) => {
      let body = '';

      response.setEncoding('utf8');
      response.on('data', (chunk) => {
        body += chunk;
      });
      response.on('end', () => resolve({ status: response.statusCode, body }));
    });

    request.on('error', reject);
  });
}

async function main() {
  const bus = new EventBus({ group: GROUP });

  const wildcardLogger = (event, args) => {
    console.log(`[onAny] Событие "${event}" с аргументами: ${JSON.stringify(args)}`);
  };

  console.log(`=== EventBus (группа ${GROUP}) ===`);

  console.log('');
  console.log('--- Приоритеты ---');

  bus.on('priority', () => console.log('[priority 0] Низкий приоритет'), 0);
  bus.on('priority', () => console.log('[priority 10] Высокий приоритет'), 10);
  bus.on('priority', () => console.log('[priority 5] Средний приоритет'), 5);

  bus.emit('priority');

  console.log('');
  console.log('--- Wildcard ---');

  bus.onAny(wildcardLogger);

  bus.emit('greet', 'Иван');
  bus.emit('info', GROUP);

  bus.offAny(wildcardLogger);

  console.log('');
  console.log('--- Once-кэш ---');

  let onceCalls = 0;

  bus.on('tick', (index) => {
    console.log(`[tick] Вызов ${index}`);
  });

  bus.once('tick', () => {
    onceCalls += 1;
  });

  bus.emit('tick', 1);
  bus.emit('tick', 2);
  bus.emit('tick', 3);

  console.log(`once-слушатель вызван: ${onceCalls} раз`);

  console.log('');
  console.log('--- Обработка ошибок ---');

  bus.on('error', (error) => {
    console.log(`[ERROR] [${GROUP}] Событие error: ${error.message}`);
  }, 100);

  bus.on('test', () => {
    throw new Error('Сбой в обработчике');
  });

  bus.on('test2', () => {
    throw new Error('Сбой во втором обработчике');
  });

  bus.emit('error', new Error('Критический сбой'));
  bus.emit('test');
  bus.emit('test2');

  console.log('');
  console.log('--- Метрики ---');

  for (const [event, count] of bus.calls) {
    const failures = bus.failures.get(event) || 0;
    const suffix = failures > 0 ? ` (${failures} ${plural(failures, ['ошибка', 'ошибки', 'ошибок'])})` : '';
    console.log(`${event}: ${count} ${plural(count, ['вызов', 'вызова', 'вызовов'])}${suffix}`);
  }

  const metrics = bus.getMetrics();

  console.log(`Всего событий: ${metrics.total}`);

  console.log('');
  console.log('--- Система ---');

  bus.on('system', (info) => {
    console.log(`[system] Платформа: ${info.platform}, CPU: ${info.cpus}, свободно: ${info.memory} ГБ`);
  });

  bus.emit('system', {
    platform: os.platform(),
    cpus: os.cpus().length,
    memory: (os.freemem() / 1024 ** 3).toFixed(1)
  });

  const server = http.createServer((request, response) => {
    bus.emit('request', `${request.method} ${request.url}`);

    const stats = bus.getMetrics();

    response.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    response.end(JSON.stringify(stats, null, 2));
  });

  await new Promise((resolve) => server.listen(PORT, resolve));

  console.log('');
  console.log('--- HTTP-сервер ---');
  console.log(`Сервер слушает http://localhost:${PORT}`);

  bus.onAny(wildcardLogger);

  const result = await requestJson(`http://127.0.0.1:${PORT}/metrics`);

  bus.offAny(wildcardLogger);

  console.log(`GET /metrics -> ${result.status}`);
  console.log(result.body);

  server.close();
}

main();
