const fs = require('fs');
const os = require('os');
const path = require('path');
const { buildBundle, resolveOutputPath, buildProject } = require('../../services/buildService');
const { AppError } = require('../../utils/errors');

describe('buildService', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'my-cli-build-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('buildBundle формирует модуль с именем проекта', () => {
    const bundle = buildBundle({ name: 'my-app' });

    expect(bundle).toContain('my-app');
    expect(bundle).toContain('module.exports');
  });

  test('resolveOutputPath указывает в каталог сборки', () => {
    const output = resolveOutputPath({ name: 'app' }, { dist: path.join(tmpDir, 'dist') });

    expect(path.basename(output)).toBe('app.js');
  });

  test('buildProject создаёт файл сборки', () => {
    const configPath = path.join(tmpDir, 'config.json');
    fs.writeFileSync(configPath, JSON.stringify({ name: 'my-app' }), 'utf8');

    const result = buildProject({ config: configPath, dist: path.join(tmpDir, 'dist') });

    expect(fs.existsSync(result.outputPath)).toBe(true);
  });

  test('buildProject с dry-run не создаёт файлы', () => {
    const configPath = path.join(tmpDir, 'config.json');
    fs.writeFileSync(configPath, JSON.stringify({ name: 'my-app' }), 'utf8');

    const result = buildProject({ config: configPath, dist: path.join(tmpDir, 'dist'), dryRun: true });

    expect(result.dryRun).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, 'dist'))).toBe(false);
  });

  test('buildProject без файла конфигурации выбрасывает AppError', () => {
    const options = { config: path.join(tmpDir, 'missing.json'), dist: path.join(tmpDir, 'dist') };

    expect(() => buildProject(options)).toThrow(AppError);
  });
});
