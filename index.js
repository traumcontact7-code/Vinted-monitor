const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { token } = require('../config.json');
const MonitorManager = require('./monitors/MonitorManager');
const commandHandler = require('./handlers/commandHandler');
const path = require('path');

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.commands = new Collection();
client.monitors = new MonitorManager(client);

// Load commands
commandHandler.loadCommands(client, path.join(__dirname, 'commands'));

client.once('ready', () => {
  console.log(`✅ Bot connecté en tant que ${client.user.tag}`);
  console.log(`📡 Surveillance active sur ${client.guilds.cache.size} serveur(s)`);
  client.monitors.restoreAll();
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction, client);
  } catch (error) {
    console.error(`Erreur commande ${interaction.commandName}:`, error);
    const msg = { content: '❌ Une erreur est survenue.', ephemeral: true };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(msg);
    } else {
      await interaction.reply(msg);
    }
  }
});

client.login(token);
