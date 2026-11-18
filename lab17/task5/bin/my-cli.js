#!/usr/bin/env node
const { Command } = require('commander');
const pkg = require('../package.json');
const logger = require('../utils/logger');
const spinner = require('../utils/spinner');
const { AppError } = require('../utils/errors');

const program = new Command();

program
  .name('my-cli')
  .description('CLI-приложение с архитектурой Команда (лабораторная работа №17)')
  .version(pkg.version);

function reportError(error) {
  const known = error instanceof AppError;

  logger.error(`Ошибка: ${error.message}`);

  if (known && error.hint) {
    logger.detail(error.hint);
  }

  if (known && error.details) {
    console.error('');
    logger.detail(`Подробности: ${error.details}`);
  }

  if (!known && process.env.NODE_ENV === 'development' && error.stack) {
    console.error(error.stack.split('\n').slice(1).join('\n'));
  }
}

function handleFatal(error) {
  spinner.clear();
  reportError(error);
  process.exit(1);
}

process.on('uncaughtException', handleFatal);
process.on('unhandledRejection', handleFatal);

require('../commands/init')(program);
require('../commands/build')(program);
require('../commands/test')(program);
require('../commands/deploy')(program);

program.parse(process.argv);
