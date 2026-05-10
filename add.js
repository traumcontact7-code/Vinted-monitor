const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('add')
    .setDescription('Ajouter une surveillance Vinted')
    .addStringOption(opt => opt.setName('url').setDescription('URL de recherche Vinted').setRequired(true))
    .addStringOption(opt => opt.setName('label').setDescription('Nom de cette surveillance').setRequired(false))
    .addIntegerOption(opt => opt.setName('intervalle').setDescription('Intervalle en secondes (min: 30)').setMinValue(30).setMaxValue(3600).setRequired(false))
    .addNumberOption(opt => opt.setName('prix_min').setDescription('Prix minimum en €').setMinValue(0).setRequired(false))
    .addNumberOption(opt => opt.setName('prix_max').setDescription('Prix maximum en €').setMinValue(0).setRequired(false))
    .addChannelOption(opt => opt.setName('canal').setDescription('Canal pour les notifications').setRequired(false)),

  async execute(interaction, client) {
    await interaction.deferReply({ ephemeral: true });

    const url = interaction.options.getString('url');
    const label = interaction.options.getString('label') || 'Recherche Vinted';
    const interval = interaction.options.getInteger('intervalle') || 60;
    const minPrice = interaction.options.getNumber('prix_min');
    const maxPrice = interaction.options.getNumber('prix_max');
    const targetChannel = interaction.options.getChannel('canal') || interaction.channel;

    if (!url.includes('vinted.')) {
      return interaction.editReply('❌ URL invalide. Utilise une URL Vinted (ex: https://www.vinted.fr/vetements?search_text=jordan)');
    }

    const existing = client.monitors.getGuildMonitors(interaction.guildId);
    if (existing.length >= 20) {
      return interaction.editReply('❌ Limite de 20 surveillances atteinte. Supprime-en une avec /remove.');
    }

    try {
      const id = await client.monitors.addMonitor({
        searchUrl: url, channelId: targetChannel.id,
        guildId: interaction.guildId, label, minPrice, maxPrice, interval,
      });

      const embed = new EmbedBuilder()
        .setColor(0x00C851)
        .setTitle('✅ Surveillance ajoutee !')
        .addFields(
          { name: '🔍 Nom', value: label, inline: true },
          { name: '🆔 ID', value: `\`${id}\``, inline: true },
          { name: '⏱️ Intervalle', value: `${interval}s`, inline: true },
          { name: '📢 Canal', value: `<#${targetChannel.id}>`, inline: true },
          { name: '💶 Filtre prix', value: minPrice || maxPrice ? `${minPrice ?? 0}€ → ${maxPrice ?? '∞'}€` : 'Aucun', inline: true },
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      console.error(err);
      await interaction.editReply('❌ Erreur lors de l\'ajout. Verifie l\'URL.');
    }
  },
};
