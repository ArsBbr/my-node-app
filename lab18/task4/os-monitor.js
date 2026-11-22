const os = require('os');
const fs = require('fs');
const path = require('path');

const LOG_FILE = path.join(__dirname, 'monitor.log');
const GROUP = '478';

const formatDate = (date) => {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

const snapshot = {
  timestamp: formatDate(new Date()),
  group: GROUP,
  platform: os.platform(),
  type: os.type(),
  arch: os.arch(),
  hostname: os.hostname(),
  cpuModel: os.cpus()[0] ? os.cpus()[0].model.trim() : 'Неизвестно',
  cpuCores: os.cpus().length,
  totalMemGB: Number((os.totalmem() / 1024 ** 3).toFixed(2)),
  freeMemGB: Number((os.freemem() / 1024 ** 3).toFixed(2)),
  user: os.userInfo().username
};

console.log('Первичный слепок системы:');
console.log(snapshot);
console.log(`\nМониторинг (группа ${GROUP}). Ctrl+C для выхода.`);

const getCpuTimes = () => {
  return os.cpus().map((cpu) => {
    const { user, nice, sys, idle, irq } = cpu.times;
    const busy = user + nice + sys + irq;
    const total = busy + idle;
    return { busy, total };
  });
};

let prevTimes = getCpuTimes();
let warningsCount = 0;

const logAnomaly = (message) => {
  const line = `[${formatDate(new Date())}] [${GROUP}] Предупреждение: ${message}\n`;
  fs.appendFileSync(LOG_FILE, line, 'utf-8');
};

const checkSystem = () => {
  const currTimes = getCpuTimes();
  let busyDiff = 0;
  let totalDiff = 0;

  for (let i = 0; i < currTimes.length; i++) {
    busyDiff += currTimes[i].busy - prevTimes[i].busy;
    totalDiff += currTimes[i].total - prevTimes[i].total;
  }
  prevTimes = currTimes;

  const cpuPercent = totalDiff > 0 ? (busyDiff / totalDiff) * 100 : 0;
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const freeGB = freeMem / 1024 ** 3;
  const usedPercent = ((totalMem - freeMem) / totalMem) * 100;
  const freePercent = (freeMem / totalMem) * 100;

  let statusMark = '';
  const reasons = [];

  if (cpuPercent > 80) {
    statusMark = '!!';
    reasons.push(`критическая загрузка CPU (${cpuPercent.toFixed(1)}%)`);
  } else if (cpuPercent > 50) {
    statusMark = '!';
    reasons.push(`высокая загрузка CPU (${cpuPercent.toFixed(1)}%)`);
  }

  if (freePercent < 10) {
    statusMark += '!';
    reasons.push(`мало свободной RAM (${freePercent.toFixed(1)}%)`);
  }

  if (reasons.length > 0) {
    warningsCount += 1;
    logAnomaly(reasons.join(', '));
  }

  const line = `CPU: ${cpuPercent.toFixed(1)}% | RAM: ${usedPercent.toFixed(1)}% (${freeGB.toFixed(2)} ГБ свободно) ${statusMark}   `;
  process.stdout.write(`\r${line}`);
};

const timer = setInterval(checkSystem, 2000);

process.on('SIGINT', () => {
  clearInterval(timer);
  process.stdout.write(`\nМониторинг остановлен. Предупреждений: ${warningsCount}\n`);
  process.exit(0);
});
