const ora = require('ora');

let current = null;

function start(message) {
  if (!process.stdout.isTTY) {
    return null;
  }

  current = ora(message).start();
  return current;
}

function succeed(spinner, message) {
  if (spinner) {
    spinner.succeed(message);
    if (spinner === current) {
      current = null;
    }
    return;
  }

  if (process.stdout.isTTY) {
    console.log(message);
  }
}

function stop(spinner) {
  if (spinner) {
    spinner.stop();
    if (spinner === current) {
      current = null;
    }
  }
}

function clear() {
  if (current) {
    current.clear();
    current = null;
  }
}

module.exports = { start, succeed, stop, clear };
