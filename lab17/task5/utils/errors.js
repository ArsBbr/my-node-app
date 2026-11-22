class AppError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = 'AppError';
    this.hint = options.hint || '';
    this.details = options.details || '';
  }
}

module.exports = { AppError };
