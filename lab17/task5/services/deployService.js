const { AppError } = require('../utils/errors');

const ENVIRONMENTS = ['development', 'staging', 'production'];

function validateEnvironment(env) {
  if (!ENVIRONMENTS.includes(env)) {
    throw new AppError(`недопустимое окружение "${env}"`, {
      hint: 'Допустимые значения: development, staging, production'
    });
  }
}

function deployProject(options = {}) {
  const env = options.env || 'production';
  const name = options.name || 'my-app';

  validateEnvironment(env);

  const host = env === 'production' ? 'example.com' : `${env}.example.com`;

  return { env, url: `https://${name}.${host}` };
}

module.exports = { deployProject, validateEnvironment, ENVIRONMENTS };
