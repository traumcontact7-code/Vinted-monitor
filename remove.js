const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('remove')
    .setDescription('Supprimer une surveillance Vinted')
    .addStringOption(opt => opt.setName('id').setDescription('ID de la surveillance (visible avec /list)').setRequired(true)),

  async execute(interaction, client) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const id = interaction.options.getString('id').toUpperCase();
    const monitorInfo = client.monitors.getMonitorInfo(id, interaction.guildId);

    if (!monitorInfo) {
      return interaction.editReply(`❌ Aucune surveillance avec l'ID \`${id}\` trouvee.`);
    }

    const stopped = client.monitors.stopMonitor(id, interaction.guildId);
    if (stopped) {
      const embed = new EmbedBuilder()
        .setColor(0xFF4444)
        .setTitle('🗑️ Surveillance supprimee')
        .addFields(
          { name: '🔍 Nom', value: monitorInfo.label, inline: true },
          { name: '🆔 ID', value: `\`${id}\``, inline: true },
        )
        .setTimestamp();
      await interaction.editReply({ embeds: [embed] });
    } else {
      await interaction.editReply('❌ Impossible de supprimer cette surveillance.');
    }
  },
};
