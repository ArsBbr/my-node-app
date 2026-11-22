const fs = require('fs');
const { Command } = require('commander');
const chalk = require('chalk');
const ora = require('ora');
const cliProgress = require('cli-progress');

const isTTY = process.stdout.isTTY === true;

if (!isTTY) {
  chalk.level = 0;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const success = (message) => chalk.green(`✔ ${message}`);
const warning = (message) => chalk.yellow(`⚠ ${message}`);
const failure = (message) => chalk.red(`✖ ${message}`);
const note = (message) => chalk.blue(`ℹ ${message}`);

function writeInfo(message) {
  if (isTTY) {
    console.log(message);
  }
}

function writeWarning(message) {
  console.error(message);
}

function writeError(message) {
  console.error(message);
}

function createBar(total) {
  const bar = new cliProgress.SingleBar(
    {
      format: '|{bar}| {percentage}% | {value}/{total} | ETA: {eta_formatted}',
      hideCursor: true
    },
    cliProgress.Presets.shades_classic
  );

  bar.start(total, 0);
  return bar;
}

async function processFiles(files, options) {
  const found = files.filter((file) => fs.existsSync(file));
  const missing = files.filter((file) => !fs.existsSync(file));
  const useBar = isTTY && files.length >= 5;

  if (missing.length === 0) {
    writeInfo(success(`Файлы найдены (${files.length} шт.)`));
  }

  let bar = null;

  if (useBar) {
    const spinner = ora('Обработка файлов...').start();
    await sleep(500);
    spinner.stop();
    bar = createBar(files.length);
  }

  const processed = [];
  const skipped = [];

  for (let index = 0; index < files.length; index += 1) {
    const file = files[index];

    if (fs.existsSync(file)) {
      processed.push({ file, size: fs.statSync(file).size });
      if (missing.length > 0) {
        writeInfo(success(`Файл ${file} обработан`));
      }
    } else {
      skipped.push(file);
      writeError(failure(`Файл ${file} не найден`));
    }

    if (bar) {
      bar.update(index + 1);
      await sleep(120);
    } else if (missing.length > 0) {
      await sleep(120);
    }
  }

  if (bar) {
    bar.stop();
  }

  if (missing.length > 0) {
    writeWarning(warning(`Пропущено ${missing.length} файл(ов)`));
  } else {
    writeInfo(success('Обработка завершена'));
  }

  const payload = JSON.stringify({ total: files.length, files: processed, skipped }, null, 2);

  if (options.output) {
    fs.writeFileSync(options.output, payload, 'utf8');
    writeInfo(`Результат сохранён: ${options.output}`);
  } else if (isTTY) {
    fs.writeFileSync('output.json', payload, 'utf8');
    writeInfo('Результат сохранён: output.json');
  } else {
    process.stdout.write(`${payload}\n`);
  }

  process.exit(missing.length > 0 ? 1 : 0);
}

const program = new Command();

program
  .name('my-cli')
  .version('1.0.0')
  .description('CLI-приложение для лабораторной работы №17');

program
  .command('process')
  .description('обработать список файлов')
  .option('-f, --files <files...>', 'список файлов')
  .option('-o, --output <path>', 'путь для сохранения результата')
  .action(async function () {
    const options = this.opts();
    const files = options.files || [];

    if (files.length === 0) {
      writeError(failure('Ошибка: не указаны файлы. Используйте --files <файлы...>'));
      process.exit(1);
    }

    await processFiles(files, options);
  });

program
  .command('demo')
  .description('показать примеры цветного вывода, спиннера и прогресс-бара')
  .action(async function () {
    writeInfo(success('Успешная операция'));
    writeInfo(note('Информационное сообщение'));
    writeWarning(warning('Предупреждение'));
    writeError(failure('Ошибка'));

    const spinner = ora('Длительная операция...').start();
    await sleep(900);
    spinner.succeed('Операция завершена');

    const bar = createBar(10);

    for (let index = 1; index <= 10; index += 1) {
      bar.update(index);
      await sleep(90);
    }

    bar.stop();
    writeInfo(success('Готово'));
  });

program.parse(process.argv);
