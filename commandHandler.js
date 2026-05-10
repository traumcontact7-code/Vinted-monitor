const fs = require('fs');
const path = require('path');

const COMMAND_NAMES = ['add', 'remove', 'list', 'ping', 'help'];

function loadCommands(client, dir) {
  for (const name of COMMAND_NAMES) {
    const filePath = path.join(dir, `${name}.js`);
    if (fs.existsSync(filePath)) {
      const command = require(filePath);
      if (command.data && command.execute) {
        client.commands.set(command.data.name, command);
        console.log(`Commande chargee: /${command.data.name}`);
      }
    }
  }
}

module.exports = { loadCommands };
