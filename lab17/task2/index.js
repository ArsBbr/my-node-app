const fs = require('fs');
const path = require('path');
const { Command } = require('commander');

const STUDENT = 'Барбажинский Арсений';
const GROUP = '478';
const LAB_NUMBER = 17;
const ALLOWED_TYPES = ['html', 'pdf', 'json', 'csv'];
const ALLOWED_FORMATS = ['json', 'csv', 'txt'];

function buildReport(type) {
  const data = {
    type,
    student: STUDENT,
    group: GROUP,
    lab: LAB_NUMBER,
    createdAt: new Date().toISOString()
  };

  if (type === 'json') {
    return JSON.stringify(data, null, 2);
  }

  if (type === 'csv') {
    const rows = Object.entries(data).map(([key, value]) => `${key},"${value}"`);
    return ['field,value', ...rows].join('\n');
  }

  if (type === 'html') {
    return [
      '<h1>Отчёт</h1>',
      `<p>Студент: ${STUDENT}</p>`,
      `<p>Группа: ${GROUP}</p>`,
      `<p>Лабораторная работа: №${LAB_NUMBER}</p>`,
      `<p>Дата: ${data.createdAt}</p>`
    ].join('\n');
  }

  return `Отчёт\nСтудент: ${STUDENT}\nГруппа: ${GROUP}\nЛабораторная работа: №${LAB_NUMBER}\nДата: ${data.createdAt}\n`;
}

function failWith(message, hint) {
  console.error(`Ошибка: ${message}`);
  if (hint) {
    console.error('');
    console.error(hint);
  }
  process.exit(1);
}

function writeFile(target, content, force) {
  if (fs.existsSync(target) && !force) {
    failWith(`файл "${target}" уже существует. Используйте --force для перезаписи.`);
  }

  fs.mkdirSync(path.dirname(path.resolve(target)), { recursive: true });
  fs.writeFileSync(target, content, 'utf8');
}

const program = new Command();

program
  .name('my-cli')
  .description('CLI-приложение для лабораторной работы №17')
  .version('1.0.0')
  .option('-v, --verbose', 'подробный вывод');

program
  .command('generate')
  .description('сгенерировать отчёт')
  .option('-t, --type <type>', 'тип отчёта', 'html')
  .option('-o, --output <path>', 'путь для сохранения')
  .option('-f, --force', 'перезаписать существующий файл')
  .option('--dry-run', 'показать что будет сделано без выполнения')
  .option('-v, --verbose', 'подробный вывод')
  .action(function () {
    const options = this.opts();
    const type = String(options.type).toLowerCase();
    const output = options.output || `./output.${type}`;
    const verbose = Boolean(options.verbose || program.opts().verbose);

    if (!ALLOWED_TYPES.includes(type)) {
      failWith(
        `недопустимый тип отчёта "${type}".`,
        'Допустимые значения: html, pdf, json, csv'
      );
    }

    if (options.dryRun) {
      console.log(`[DRY-RUN] Будет сгенерирован отчёт типа: ${type}`);
      console.log(`[DRY-RUN] Файл будет сохранён в: ${output}`);
      console.log('');
      console.log('[DRY-RUN] Действия не выполнены (режим проверки)');
      return;
    }

    if (verbose) {
      console.log('[VERBOSE] Запуск генерации отчёта...');
      console.log(`[VERBOSE] Тип отчёта: ${type}`);
      console.log(`[VERBOSE] Путь сохранения: ${output}`);
      console.log('');
    }

    writeFile(output, buildReport(type), options.force);
    console.log(`Отчёт успешно сгенерирован: ${output}`);
  });

program
  .command('convert')
  .description('конвертировать файл')
  .argument('<input>', 'входной файл')
  .option('-t, --to <format>', 'формат результата (по умолчанию: "json")', 'json')
  .option('-o, --output <path>', 'путь для сохранения')
  .option('-f, --force', 'перезаписать существующий файл')
  .option('-v, --verbose', 'подробный вывод')
  .action(function (input) {
    const options = this.opts();
    const format = String(options.to).toLowerCase();
    const output = options.output || `./converted.${format}`;
    const verbose = Boolean(options.verbose || program.opts().verbose);

    if (!ALLOWED_FORMATS.includes(format)) {
      failWith(
        `недопустимый формат "${format}".`,
        'Допустимые значения: json, csv, txt'
      );
    }

    if (!fs.existsSync(input)) {
      failWith(`файл "${input}" не найден.`);
    }

    if (verbose) {
      console.log('[VERBOSE] Запуск конвертации...');
      console.log(`[VERBOSE] Исходный файл: ${input}`);
      console.log(`[VERBOSE] Формат результата: ${format}`);
      console.log('');
    }

    const source = fs.readFileSync(input, 'utf8');
    const lines = source.split(/\r?\n/);

    let content;

    if (format === 'json') {
      content = JSON.stringify({ source: input, lines }, null, 2);
    } else if (format === 'csv') {
      const rows = lines.map((line, index) => `${index + 1},"${line.replace(/"/g, '""')}"`);
      content = ['line,text', ...rows].join('\n');
    } else {
      content = lines.join('\n');
    }

    writeFile(output, content, options.force);
    console.log(`Файл сконвертирован: ${output}`);
  });

program.parse(process.argv);
