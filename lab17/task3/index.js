const fs = require('fs');
const { Command } = require('commander');
const inquirer = require('inquirer');

const PROJECT_TYPES = [
  { name: 'Web-приложение', value: 'web' },
  { name: 'CLI-утилита', value: 'cli' },
  { name: 'Библиотека', value: 'lib' },
  { name: 'Микросервис', value: 'micro' }
];

const TYPE_LABELS = {
  web: 'Web-приложение',
  cli: 'CLI-утилита',
  lib: 'Библиотека',
  micro: 'Микросервис'
};

const FEATURES = [
  { name: 'TypeScript', value: 'typescript' },
  { name: 'ESLint', value: 'eslint' },
  { name: 'Prettier', value: 'prettier' },
  { name: 'Jest', value: 'jest' }
];

const FEATURE_LABELS = {
  typescript: 'TypeScript',
  eslint: 'ESLint',
  prettier: 'Prettier',
  jest: 'Jest'
};

function readStdin() {
  try {
    const data = fs.readFileSync(0, 'utf8');
    return data
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
  } catch (error) {
    return [];
  }
}

function fail(message) {
  console.error(`Ошибка: ${message}`);
  process.exit(1);
}

function checkType(type) {
  if (!type) {
    return;
  }

  if (!Object.prototype.hasOwnProperty.call(TYPE_LABELS, type)) {
    fail(`недопустимый тип проекта "${type}". Допустимые значения: web, cli, lib, micro`);
  }
}

function collectFeatures(options) {
  return FEATURES.filter((feature) => options[feature.value] === true).map((feature) => feature.value);
}

function printResult(result) {
  const features = result.features.map((value) => FEATURE_LABELS[value]).join(', ');

  console.log(`✔ Проект "${result.name}" успешно инициализирован!`);
  console.log(`  Тип: ${TYPE_LABELS[result.type]}`);
  console.log(`  Опции: ${features || 'нет'}`);
  console.log(`  Git: ${result.git ? 'да' : 'нет'}`);
}

async function main() {
  const program = new Command();

  program
    .name('my-cli')
    .version('1.0.0')
    .description('CLI-приложение для лабораторной работы №17');

  program
    .command('init')
    .description('инициализировать проект')
    .option('--name <name>', 'название проекта')
    .option('--type <type>', 'тип проекта: web, cli, lib, micro')
    .option('--typescript', 'добавить TypeScript')
    .option('--eslint', 'добавить ESLint')
    .option('--prettier', 'добавить Prettier')
    .option('--jest', 'добавить Jest')
    .option('--git', 'инициализировать Git-репозиторий')
    .option('--token <token>', 'токен доступа')
    .option('--no-interactive', 'отключить интерактивный режим')
    .action(async function () {
      const options = this.opts();
      const interactive = options.interactive !== false && process.stdin.isTTY === true && process.stdout.isTTY === true;

      checkType(options.type);

      if (!interactive) {
        let name = options.name;

        if (!name && process.stdin.isTTY !== true) {
          const piped = readStdin();
          if (piped.length > 0) {
            name = piped[0];
          }
        }

        if (!name) {
          fail('в неинтерактивном режиме необходимо указать --name и --type');
        }

        if (!options.type) {
          fail('недостаточно данных. Укажите --type');
        }

        printResult({
          name,
          type: options.type,
          features: collectFeatures(options),
          git: options.git === true
        });

        return;
      }

      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'name',
          message: 'Введите название проекта:',
          default: options.name || 'my-project'
        },
        {
          type: 'list',
          name: 'type',
          message: 'Выберите тип проекта:',
          choices: PROJECT_TYPES,
          default: options.type
        },
        {
          type: 'checkbox',
          name: 'features',
          message: 'Выберите дополнительные опции:',
          choices: FEATURES
        },
        {
          type: 'confirm',
          name: 'git',
          message: 'Использовать Git?',
          default: true
        },
        {
          type: 'password',
          name: 'token',
          message: 'Введите токен доступа:',
          mask: '*'
        }
      ]);

      printResult({
        name: answers.name,
        type: answers.type,
        features: answers.features,
        git: answers.git
      });
    });

  await program.parseAsync(process.argv);
}

main().catch((error) => {
  console.error(`Ошибка: ${error.message}`);
  process.exit(1);
});
