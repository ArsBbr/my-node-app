const EventEmitter = require('events');

const STUDENT = 'Барбажинский Арсений';
const GROUP = '478';

const emitter = new EventEmitter();

emitter.on('greet', (name) => {
  console.log(`[greet] Привет, ${name}!`);
});

emitter.on('info', () => {
  console.log(`[info] Группа: ${GROUP}`);
  console.log(`[info] Студент: ${STUDENT}`);
});

emitter.on('bye', () => {
  console.log('[bye] До свидания!');
});

console.log('=== Демонстрация EventEmitter ===');
console.log('');

emitter.emit('greet', 'Иван');
emitter.emit('info');
emitter.emit('bye');

console.log('');
console.log(`Событие "unknown" без слушателей: ${emitter.emit('unknown')}`);
console.log('');

const hasListeners = emitter.emit('greet', 'Иван');

console.log(`Событие "greet" со слушателями: ${hasListeners}`);
