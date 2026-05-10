const fs = require('fs');
const path = require('path');

function loadCommands(client, commandsPath) {
  const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));
  for (const file of commandFiles) {
    const command = require(path.join(commandsPath, file));
    if (command.data && command.execute) {
      client.commands.set(command.data.name, command);
      console.log(`📌 Commande chargée: /${command.data.name}`);
    }
  }
}

module.exports = { loadCommands };
