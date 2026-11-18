const fs = require('fs');
const path = require('path');
const { readConfig } = require('./config');

function buildBundle(config) {
  const name = config.name || 'app';
  const lines = [
    `const name = ${JSON.stringify(name)};`,
    `const version = ${JSON.stringify(config.version || '0.1.0')};`,
    'module.exports = { name, version };',
    ''
  ];

  return lines.join('\n');
}

function resolveOutputPath(config, options = {}) {
  const distDir = path.resolve(options.dist || 'dist');
  return path.join(distDir, `${config.name || 'app'}.js`);
}

function buildProject(options = {}) {
  const { configPath, config } = readConfig(options);
  const outputPath = resolveOutputPath(config, options);
  const content = buildBundle(config);

  if (options.dryRun) {
    return { dryRun: true, configPath, outputPath, content };
  }

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, content, 'utf8');

  return { dryRun: false, configPath, outputPath, content };
}

module.exports = { buildBundle, resolveOutputPath, buildProject };
