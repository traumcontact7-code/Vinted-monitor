const { Client, GatewayIntentBits, Collection } = require('discord.js');
const MonitorManager = require('./MonitorManager');
const commandHandler = require('./commandHandler');

const token = process.env.TOKEN;
if (!token) throw new Error('Variable TOKEN manquante dans Railway !');

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.commands = new Collection();
client.monitors = new MonitorManager(client);

commandHandler.loadCommands(client, __dirname);

client.once('ready', () => {
  console.log(`Bot connecte: ${client.user.tag}`);
  console.log(`Surveillance active sur ${client.guilds.cache.size} serveur(s)`);
  client.monitors.restoreAll();
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const command = client.commands.get(interaction.commandName);
  if (!command) return;
  try {
    await command.execute(interaction, client);
  } catch (error) {
    console.error(error);
    const msg = { content: 'Une erreur est survenue.', ephemeral: true };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(msg);
    } else {
      await interaction.reply(msg);
    }
  }
});

client.login(token);
