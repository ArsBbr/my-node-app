const fs = require('fs');
const path = require('path');
const { AppError } = require('../utils/errors');

const PROJECT_TYPES = ['web', 'cli', 'lib', 'micro'];

function validateType(type) {
  if (!PROJECT_TYPES.includes(type)) {
    throw new AppError(`недопустимый тип проекта "${type}"`, {
      hint: 'Допустимые значения: web, cli, lib, micro'
    });
  }
}

function resolveTarget(name, dir) {
  return path.resolve(dir || 'projects', name);
}

function initProject(options = {}) {
  const name = options.name || 'my-app';
  const type = options.type || 'cli';

  validateType(type);

  const target = resolveTarget(name, options.dir);

  if (options.dryRun) {
    return { name, type, target, dryRun: true };
  }

  if (fs.existsSync(target)) {
    throw new AppError(`каталог "${target}" уже существует`, {
      hint: 'Укажите другое имя через --name'
    });
  }

  const manifest = {
    name,
    version: '0.1.0',
    description: `Проект ${name}`,
    projectType: type,
    scripts: { start: 'node src/index.js' }
  };

  fs.mkdirSync(path.join(target, 'src'), { recursive: true });
  fs.writeFileSync(path.join(target, 'package.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  fs.writeFileSync(path.join(target, '.gitignore'), 'node_modules/\n', 'utf8');
  fs.writeFileSync(path.join(target, 'src', 'index.js'), `console.log(${JSON.stringify(name)});\n`, 'utf8');

  return { name, type, target, dryRun: false };
}

module.exports = { initProject, validateType, PROJECT_TYPES };
