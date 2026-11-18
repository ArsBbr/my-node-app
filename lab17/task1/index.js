const STUDENT = 'Барбажинский Арсений';
const GROUP = '478';
const LAB_NUMBER = 17;

function printUsage() {
  console.log('Использование: my-cli <команда> [аргументы]');
  console.log('Доступные команды:');
  console.log('  greet <имя>  - поприветствовать пользователя');
  console.log('  info         - вывести информацию о группе');
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

const args = process.argv.slice(2);
const command = args[0];
const rest = args.slice(1);

if (!command || command === '--help' || command === '-h') {
  printUsage();
  process.exit(0);
}

if (command === 'greet') {
  const name = rest[0];

  if (!name) {
    fail('Ошибка: не указано имя\n\nДля справки используйте: my-cli --help');
  }

  console.log(`Привет, ${name}! Добро пожаловать в CLI-приложение группы ${GROUP}.`);
  process.exit(0);
}

if (command === 'info') {
  console.log(`Группа: ${GROUP}`);
  console.log(`Студент: ${STUDENT}`);
  console.log(`Лабораторная работа: №${LAB_NUMBER}`);
  console.log(`Дата: ${new Date().toISOString().slice(0, 10)}`);
  process.exit(0);
}

fail(`Ошибка: неизвестная команда "${command}"\n\nДля справки используйте: my-cli --help`);
