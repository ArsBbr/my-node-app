const logger = require('../utils/logger');
const spinner = require('../utils/spinner');
const { runTests } = require('../services/testService');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

module.exports = (program) => {
  program
    .command('test')
    .description('запуск тестов')
    .action(async function () {
      const watch = spinner.start('Запуск тестов...');

      await sleep(800);

      const result = runTests();

      if (result.passed === result.total) {
        spinner.succeed(watch, `Пройдено: ${result.passed}/${result.total} тестов`);
        logger.success(`Покрытие: ${Math.round((result.passed / result.total) * 100)}%`);
        return;
      }

      spinner.stop(watch);
      result.results
        .filter((item) => !item.passed)
        .forEach((item) => logger.error(`Провален тест: ${item.name}`));
      logger.error(`Пройдено: ${result.passed}/${result.total} тестов`);
      process.exit(1);
    });
};
