const readline = require('readline/promises');

async function confirm(message) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  try {
    const answer = await rl.question(message);
    return /^(y|yes|д|да)$/i.test(answer.trim());
  } finally {
    rl.close();
  }
}

module.exports = { confirm };
