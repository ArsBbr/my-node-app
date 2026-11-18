const logger = require('../utils/logger');
const spinner = require('../utils/spinner');
const { confirm } = require('../utils/prompt');
const { deployProject } = require('../services/deployService');
const { AppError } = require('../utils/errors');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

module.exports = (program) => {
  program
    .command('deploy')
    .description('развёртывание проекта')
    .option('-e, --env <env>', 'окружение: development, staging, production', 'production')
    .option('-f, --force', 'выполнить без подтверждения')
    .action(async function () {
      const options = this.opts();

      if (options.env === 'production') {
        logger.warn('Вы собираетесь развернуть проект в production!');
      }

      if (!options.force) {
        if (process.stdin.isTTY !== true) {
          throw new AppError('требуется подтверждение развёртывания', {
            hint: 'Используйте --force для запуска без вопросов'
          });
        }

        const agreed = await confirm('Продолжить? (Y/N) ');

        if (!agreed) {
          logger.warn('Развёртывание отменено');
          process.exit(1);
        }
      }

      const watch = spinner.start('Развёртывание...');

      await sleep(1200);

      const result = deployProject(options);

      spinner.succeed(watch, 'Развёрнуто успешно');
      logger.plain('');
      logger.plain(`URL: ${result.url}`);
    });
};
