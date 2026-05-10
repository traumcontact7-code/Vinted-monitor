const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Verifie la latence du bot'),

  async execute(interaction, client) {
    const sent = await interaction.reply({ content: '🏓 Calcul...', fetchReply: true });
    const latency = sent.createdTimestamp - interaction.createdTimestamp;
    await interaction.editReply(`🏓 Pong! Latence: **${latency}ms** | API: **${client.ws.ping}ms**`);
  },
};
