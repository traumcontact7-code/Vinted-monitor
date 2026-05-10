const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

const token = process.env.TOKEN;
const clientId = process.env.CLIENT_ID;

if (!token || !clientId) {
  console.error('Mets TOKEN et CLIENT_ID dans les variables Railway avant de deployer !');
  process.exit(1);
}

const COMMAND_NAMES = ['add', 'remove', 'list', 'ping', 'help'];
const commands = [];

for (const name of COMMAND_NAMES) {
  const filePath = path.join(__dirname, `${name}.js`);
  if (fs.existsSync(filePath)) {
    const command = require(filePath);
    if (command.data) commands.push(command.data.toJSON());
  }
}

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  try {
    console.log(`Deploiement de ${commands.length} commande(s)...`);
    const data = await rest.put(Routes.applicationCommands(clientId), { body: commands });
    console.log(`${data.length} commande(s) deployee(s) !`);
  } catch (err) {
    console.error('Erreur deploiement:', err);
  }
})();
