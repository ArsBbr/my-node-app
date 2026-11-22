const EventEmitter = require('events');

const GROUP = '478';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

class PluginManager extends EventEmitter {
  constructor(group) {
    super();
    this.group = group;
    this.plugins = new Map();

    this.on('newListener', (event) => {
      if (event === 'newListener' || event === 'removeListener') {
        return;
      }

      console.log(`[newListener] Добавлен слушатель "${event}"`);
    });

    this.on('removeListener', (event) => {
      if (event === 'newListener' || event === 'removeListener') {
        return;
      }

      console.log(`[removeListener] Удалён слушатель "${event}"`);
    });

    this.on('plugin:registered', (plugin) => {
      console.log(`[PLUGIN] Зарегистрирован: ${plugin.name}`);
    });

    this.on('plugin:removed', (plugin) => {
      console.log(`[PLUGIN] Удалён: ${plugin.name}`);
    });
  }

  register(plugin) {
    this.plugins.set(plugin.name, plugin);
    this.emit('plugin:registered', plugin);
    plugin.install(this);
    return this;
  }

  unregister(name) {
    const plugin = this.plugins.get(name);

    if (!plugin) {
      return this;
    }

    plugin.uninstall(this);
    this.plugins.delete(name);
    this.emit('plugin:removed', plugin);
    return this;
  }
}

class LoggerPlugin {
  constructor() {
    this.name = 'LoggerPlugin';
    this.handler = (message) => console.log(`[LoggerPlugin] ${message}`);
  }

  install(manager) {
    manager.on('log', this.handler);
  }

  uninstall(manager) {
    manager.removeListener('log', this.handler);
  }
}

class AlertPlugin {
  constructor() {
    this.name = 'AlertPlugin';
    this.handler = (message) => console.log(`[AlertPlugin] ${message}`);
  }

  install(manager) {
    manager.on('alert', this.handler);
  }

  uninstall(manager) {
    manager.removeListener('alert', this.handler);
  }
}

console.log('=== Система плагинов ===');

const manager = new PluginManager(GROUP);

console.log('');
manager.register(new LoggerPlugin());
console.log('');
manager.register(new AlertPlugin());
console.log('');
manager.unregister('LoggerPlugin');

console.log('');
console.log('=== Демонстрация утечки ===');

const leaky = new EventEmitter();

leaky.setMaxListeners(2000);

for (let index = 0; index < 10; index += 1) {
  leaky.on('leak', () => {});
}

console.log(`Слушателей до: ${leaky.listenerCount('leak')}`);

for (let index = 0; index < 1000; index += 1) {
  leaky.on('leak', () => {});
}

console.log(`Слушателей после добавления 1000: ${leaky.listenerCount('leak')}`);

leaky.removeAllListeners('leak');

console.log(`Слушателей после removeAllListeners: ${leaky.listenerCount('leak')}`);

console.log('');
console.log('=== Асинхронные слушатели ===');

const asyncEmitter = new EventEmitter();

asyncEmitter.on('async:run', async () => {
  await sleep(100);
  setImmediate(() => console.log(`[${GROUP}] async-слушатель завершён через 100ms`));
});

asyncEmitter.emit('async:run');
console.log(`[${GROUP}] emit вызван (не ждёт async-слушатель)`);
