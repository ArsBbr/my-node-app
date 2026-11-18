const os = require('os');

const platform = os.platform();
const osType = os.type();
const arch = os.arch();
const release = os.release();
const hostname = os.hostname();
const uptimeSeconds = Math.floor(os.uptime());

const hours = Math.floor(uptimeSeconds / 3600);
const minutes = Math.floor((uptimeSeconds % 3600) / 60);
const seconds = uptimeSeconds % 60;

let platformMessage = 'Неизвестная платформа';
if (platform === 'win32') {
  platformMessage = 'Вы работаете в Windows';
} else if (platform === 'linux') {
  platformMessage = 'Вы работаете в Linux';
} else if (platform === 'darwin') {
  platformMessage = 'Вы работаете в macOS';
}

console.log('=== Информация о системе (группа 478) ===');
console.log(`Платформа: ${platform}`);
console.log(`Тип ОС: ${osType}`);
console.log(`Архитектура: ${arch}`);
console.log(`Версия ОС: ${release}`);
console.log(`Имя хоста: ${hostname}`);
console.log(`Время работы: ${hours} ч ${minutes} мин ${seconds} сек (${uptimeSeconds} сек)`);
console.log(platformMessage);
