const fs = require('fs');
const path = require('path');
const { buildBundle, resolveOutputPath } = require('./buildService');
const { resolveConfigPath } = require('./config');
const { initProject, validateType } = require('./initService');
const { AppError } = require('../utils/errors');

function throws(fn) {
  try {
    fn();
    return false;
  } catch (error) {
    return true;
  }
}

const CHECKS = [
  {
    name: 'buildBundle возвращает строку',
    run: () => typeof buildBundle({ name: 'app' }) === 'string'
  },
  {
    name: 'buildBundle содержит имя проекта',
    run: () => buildBundle({ name: 'my-app' }).includes('my-app')
  },
  {
    name: 'buildBundle экспортирует модуль',
    run: () => buildBundle({ name: 'my-app' }).includes('module.exports')
  },
  {
    name: 'buildBundle подставляет версию по умолчанию',
    run: () => buildBundle({ name: 'my-app' }).includes('0.1.0')
  },
  {
    name: 'resolveOutputPath добавляет расширение .js',
    run: () => resolveOutputPath({ name: 'app' }).endsWith('.js')
  },
  {
    name: 'resolveOutputPath учитывает каталог сборки',
    run: () => path.dirname(resolveOutputPath({ name: 'app' }, { dist: 'build' })).endsWith('build')
  },
  {
    name: 'resolveConfigPath по умолчанию ищет config.json',
    run: () => resolveConfigPath().endsWith('config.json')
  },
  {
    name: 'resolveConfigPath учитывает параметр --config',
    run: () => resolveConfigPath({ config: 'custom.json' }).endsWith('custom.json')
  },
  {
    name: 'resolveConfigPath возвращает абсолютный путь',
    run: () => path.isAbsolute(resolveConfigPath())
  },
  {
    name: 'validateType принимает тип cli',
    run: () => {
      validateType('cli');
      return true;
    }
  },
  {
    name: 'validateType отклоняет неизвестный тип',
    run: () => throws(() => validateType('unknown'))
  },
  {
    name: 'AppError сохраняет сообщение',
    run: () => new AppError('текст').message === 'текст'
  },
  {
    name: 'AppError сохраняет подсказку',
    run: () => new AppError('текст', { hint: 'подсказка' }).hint === 'подсказка'
  },
  {
    name: 'AppError является экземпляром Error',
    run: () => new AppError('текст') instanceof Error
  },
  {
    name: 'initProject с dry-run не создаёт файлы',
    run: () => {
      const result = initProject({ name: `probe-${Date.now()}`, dryRun: true });
      return result.dryRun === true && !fs.existsSync(result.target);
    }
  }
];

function runTests() {
  const results = CHECKS.map((check) => {
    try {
      return { name: check.name, passed: check.run() === true };
    } catch (error) {
      return { name: check.name, passed: false };
    }
  });

  const passed = results.filter((item) => item.passed).length;

  return { results, passed, total: results.length };
}

module.exports = { runTests };
