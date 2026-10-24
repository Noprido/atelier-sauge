'use strict';

// Usage : npm run hash-password "votre mot de passe"   (ou sans argument : saisie interactive)
const bcrypt = require('bcryptjs');
const readline = require('readline');

async function main() {
  let password = process.argv[2];
  if (!password) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    password = await new Promise((resolve) => rl.question('Mot de passe administrateur (12 caractères minimum) : ', (a) => { rl.close(); resolve(a); }));
  }
  if (!password || password.length < 12) {
    console.error('Mot de passe trop court : 12 caractères minimum.');
    process.exit(1);
  }
  const hash = await bcrypt.hash(password, 12);
  console.log('\nCopiez cette ligne dans votre fichier .env :\n');
  console.log(`ADMIN_PASSWORD_HASH='${hash}'\n`);
}

main();
