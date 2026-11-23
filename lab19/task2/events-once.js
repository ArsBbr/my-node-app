const EventEmitter = require('events');

const GROUP = '478';

const emitter = new EventEmitter();

let onCalls = 0;
let onceCalls = 0;

console.log('=== Сравнение on и once ===');

emitter.on('tick', (index) => {
  onCalls += 1;
  console.log(`[tick #${index}] on-слушатель`);
});

emitter.once('tick', (index) => {
  onceCalls += 1;
  console.log(`[tick #${index}] once-слушатель`);
});

emitter.emit('tick', 1);
emitter.emit('tick', 2);
emitter.emit('tick', 3);

console.log('');
console.log(`on-слушатель вызван: ${onCalls} раза`);
console.log(`once-слушатель вызван: ${onceCalls} раз`);

console.log('');
console.log('=== Управление подписками ===');

const first = () => console.log('первый');
const second = () => console.log('второй');
const third = () => console.log('третий');

emitter.on('manage', first);
emitter.on('manage', second);
emitter.on('manage', third);

console.log(`Слушателей до удаления: ${emitter.listenerCount('manage')}`);
console.log(`listeners() вернул функций: ${emitter.listeners('manage').length}`);

emitter.removeListener('manage', second);

console.log(`Слушателей после удаления одного: ${emitter.listenerCount('manage')}`);

emitter.removeAllListeners('manage');

console.log(`Слушателей после removeAllListeners: ${emitter.listenerCount('manage')}`);

console.log('');
console.log('=== Порядок вызова ===');

emitter.on('order', () => console.log(`1. Первый слушатель (группа ${GROUP})`));
emitter.on('order', () => console.log('2. Второй слушатель'));
emitter.on('order', () => console.log('3. Третий слушатель'));

emitter.emit('order');
