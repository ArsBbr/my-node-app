const os = require('os');

const cpus = os.cpus();
const coreCount = cpus.length;
const cpuModel = cpus[0] ? cpus[0].model.trim() : 'Неизвестно';
const totalSpeed = cpus.reduce((sum, cpu) => sum + cpu.speed, 0);
const avgSpeed = coreCount > 0 ? Math.round(totalSpeed / coreCount) : 0;

console.log('=== Информация о процессоре ===');
console.log(`Количество логических ядер: ${coreCount}`);
console.log(`Модель процессора: ${cpuModel}`);
cpus.forEach((cpu, index) => {
  console.log(`Ядро ${index + 1}: ${cpu.speed} МГц`);
});
console.log(`Средняя частота: ${avgSpeed} МГц`);

const bytesInGB = 1024 ** 3;
const totalMem = os.totalmem();
const freeMem = os.freemem();
const usedMem = totalMem - freeMem;

const totalGB = (totalMem / bytesInGB).toFixed(2);
const freeGB = (freeMem / bytesInGB).toFixed(2);
const usedGB = (usedMem / bytesInGB).toFixed(2);
const usedPercent = ((usedMem / totalMem) * 100).toFixed(1);
const freePercent = (freeMem / totalMem) * 100;

console.log('\n=== Информация о памяти ===');
console.log(`Общий объём: ${totalGB} ГБ`);
console.log(`Свободно: ${freeGB} ГБ`);
console.log(`Использовано: ${usedGB} ГБ (${usedPercent}%)`);

const loadAvg = os.loadavg().map((v) => Number(v.toFixed(2)));
const loadNote = os.platform() === 'win32' ? ' (недоступно в Windows)' : '';
console.log(`\nСредняя загрузка (1, 5, 15 мин): [${loadAvg.join(', ')}]${loadNote}`);

console.log('Группа: 478');
if (freePercent < 20) {
  console.log('Предупреждение: мало свободной памяти (менее 20%)!');
} else {
  console.log('Память в норме');
}
