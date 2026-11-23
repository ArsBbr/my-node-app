const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const CLI = path.join(__dirname, '..', '..', 'bin', 'my-cli.js');

function runCli(args, cwd) {
  return spawnSync(process.execPath, [CLI, ...args], { cwd, encoding: 'utf8' });
}

describe('CLI', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'my-cli-cli-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('--version выводит версию приложения', () => {
    const result = runCli(['--version'], tmpDir);

    expect(result.status).toBe(0);
    expect(result.stdout.trim()).toBe('1.0.0');
  });

  test('--help выводит справку со списком команд', () => {
    const result = runCli(['--help'], tmpDir);

    expect(result.stdout).toContain('Usage');
    expect(result.stdout).toContain('deploy');
  });

  test('неизвестная команда возвращает код 1', () => {
    const result = runCli(['unknown'], tmpDir);

    expect(result.status).toBe(1);
  });

  test('build без конфигурации завершается кодом 1 без стектрейса', () => {
    const result = runCli(['build'], tmpDir);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('файл конфигурации не найден');
    expect(result.stderr).not.toContain('at Object.');
  });

  test('build с --dry-run не изменяет файлы', () => {
    fs.writeFileSync(path.join(tmpDir, 'config.json'), JSON.stringify({ name: 'my-app' }), 'utf8');

    const result = runCli(['build', '--dry-run'], tmpDir);

    expect(result.status).toBe(0);
    expect(fs.existsSync(path.join(tmpDir, 'dist'))).toBe(false);
  });
});
