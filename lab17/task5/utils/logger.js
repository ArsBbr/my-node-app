const chalk = require('chalk');

const isTTY = process.stdout.isTTY === true;

function success(message) {
  if (isTTY) {
    console.log(chalk.green(`✔ ${message}`));
  }
}

function warn(message) {
  console.error(chalk.yellow(`⚠ ${message}`));
}

function error(message) {
  console.error(chalk.red(`✖ ${message}`));
}

function plain(message) {
  if (isTTY) {
    console.log(message);
  }
}

function detail(message) {
  console.error(`  ${message}`);
}

module.exports = { success, warn, error, plain, detail, isTTY };
