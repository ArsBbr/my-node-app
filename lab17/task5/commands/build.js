const path = require('path');
const logger = require('../utils/logger');
const spinner = require('../utils/spinner');
const { buildProject } = require('../services/buildService');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

module.exports = (program) => {
  program
    .command('build')
    .description('сборка проекта')
    .option('-c, --config <path>', 'путь к файлу конфигурации', 'config.json')
    .option('-d, --dist <path>', 'каталог сборки', 'dist')
    .option('--dry-run', 'показать что будет сделано без выполнения')
    .action(async function () {
      const options = this.opts();
      const watch = spinner.start('Сборка проекта...');
      const startedAt = Date.now();

      if (!options.dryRun) {
        await sleep(1200);
      }

      const result = buildProject(options);
      const seconds = ((Date.now() - startedAt) / 1000).toFixed(1);

      if (result.dryRun) {
        spinner.stop(watch);
        logger.plain(`[DRY-RUN] Файлы не изменены. Результат будет собран в: ${path.relative(process.cwd(), result.outputPath)}`);
        return;
      }

      spinner.succeed(watch, `Сборка завершена за ${seconds}s`);
      logger.plain(`Результат: ${path.relative(process.cwd(), result.outputPath)}`);
    });
};
