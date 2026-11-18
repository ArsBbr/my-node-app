const os = require('os');

const maskMac = (mac) => {
  if (!mac || mac === '00:00:00:00:00:00') {
    return '00:00:00:**:**:**';
  }
  const parts = mac.toUpperCase().split(':');
  if (parts.length === 6) {
    return `${parts[0]}:${parts[1]}:${parts[2]}:**:**:**`;
  }
  return mac;
};

const interfaces = os.networkInterfaces();
const interfaceNames = Object.keys(interfaces);
let mainInterface = null;

console.log('=== Сетевые интерфейсы ===');
for (const name of interfaceNames) {
  const addresses = interfaces[name] || [];
  console.log(`Интерфейс: ${name}`);
  for (const addr of addresses) {
    console.log(`  ${addr.family}: ${addr.address}`);
    console.log(`  MAC: ${maskMac(addr.mac)}`);
    console.log(`  Внутренний: ${addr.internal ? 'да' : 'нет'}`);
    if (!mainInterface && addr.family === 'IPv4' && !addr.internal) {
      mainInterface = `${name} (${addr.address})`;
    }
  }
}

console.log(`Всего интерфейсов: ${interfaceNames.length}`);
console.log(`Основной интерфейс: ${mainInterface || 'не найден'}`);

const userInfo = os.userInfo();
const isRoot = userInfo.uid === 0 || userInfo.username.toLowerCase() === 'root';

console.log('\n=== Информация о пользователе ===');
console.log(`Имя пользователя: ${userInfo.username}`);
console.log(`UID: ${userInfo.uid}`);
console.log(`GID: ${userInfo.gid}`);
console.log(`Домашняя директория: ${userInfo.homedir}`);
console.log(`Оболочка по умолчанию: ${userInfo.shell || 'не задана'}`);
console.log('Группа: 478');
console.log(`Проверка root: ${isRoot ? 'да' : 'нет'}`);
