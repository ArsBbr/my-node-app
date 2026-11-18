const path = require('path');
const logger = require('../utils/logger');
const { initProject } = require('../services/initService');

module.exports = (program) => {
  program
    .command('init')
    .description('инициализация проекта')
    .option('-n, --name <name>', 'название проекта', 'my-app')
    .option('-t, --type <type>', 'тип проекта: web, cli, lib, micro', 'cli')
    .option('-d, --dir <path>', 'каталог для проекта', 'projects')
    .option('--dry-run', 'показать план без создания файлов')
    .action(function () {
      const options = this.opts();
      const result = initProject(options);

      if (result.dryRun) {
        logger.plain(`[DRY-RUN] Проект "${result.name}" будет создан в: ${result.target}`);
        return;
      }

      logger.success(`Проект "${result.name}" создан`);
      logger.success('Установлены зависимости');
      logger.success('Инициализирован Git-репозиторий');
      logger.plain('Проект готов к работе!');
      logger.plain('');
      logger.plain(`Путь: ${path.relative(process.cwd(), result.target)}`);
    });
};
