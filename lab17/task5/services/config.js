const fs = require('fs');
const path = require('path');
const { AppError } = require('../utils/errors');

function resolveConfigPath(options = {}) {
  return path.resolve(options.config || 'config.json');
}

function readConfig(options = {}) {
  const configPath = resolveConfigPath(options);
  const strict = process.env.NODE_ENV !== 'development';

  if (strict && !fs.existsSync(configPath)) {
    throw new AppError('файл конфигурации не найден', {
      hint: 'Укажите путь через --config',
      details: `${path.basename(configPath)} отсутствует в корне проекта`
    });
  }

  const raw = fs.readFileSync(configPath, 'utf8');

  return { configPath, config: JSON.parse(raw) };
}

module.exports = { resolveConfigPath, readConfig };
