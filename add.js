const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('add')
    .setDescription('Ajouter une surveillance Vinted')
    .addStringOption(opt =>
      opt.setName('url')
        .setDescription('URL de recherche Vinted (copie depuis le site)')
        .setRequired(true))
    .addStringOption(opt =>
      opt.setName('label')
        .setDescription('Nom de cette surveillance (ex: Jordan 1 Retro)')
        .setRequired(false))
    .addIntegerOption(opt =>
      opt.setName('intervalle')
        .setDescription('Intervalle de vérification en secondes (min: 30, défaut: 60)')
        .setMinValue(30)
        .setMaxValue(3600)
        .setRequired(false))
    .addNumberOption(opt =>
      opt.setName('prix_min')
        .setDescription('Prix minimum en € (optionnel)')
        .setMinValue(0)
        .setRequired(false))
    .addNumberOption(opt =>
      opt.setName('prix_max')
        .setDescription('Prix maximum en € (optionnel)')
        .setMinValue(0)
        .setRequired(false))
    .addChannelOption(opt =>
      opt.setName('canal')
        .setDescription('Canal où envoyer les notifications (défaut: canal actuel)')
        .setRequired(false)),

  async execute(interaction, client) {
    await interaction.deferReply({ ephemeral: true });

    const url = interaction.options.getString('url');
    const label = interaction.options.getString('label') || 'Recherche Vinted';
    const interval = interaction.options.getInteger('intervalle') || 60;
    const minPrice = interaction.options.getNumber('prix_min');
    const maxPrice = interaction.options.getNumber('prix_max');
    const targetChannel = interaction.options.getChannel('canal') || interaction.channel;

    // Validate URL
    if (!url.includes('vinted.')) {
      return interaction.editReply('❌ L\'URL doit être une URL Vinted valide (ex: `https://www.vinted.fr/vetements?search_text=jordan`)');
    }

    // Check max monitors per guild (limit 20)
    const existing = client.monitors.getGuildMonitors(interaction.guildId);
    if (existing.length >= 20) {
      return interaction.editReply('❌ Limite de 20 surveillances atteinte pour ce serveur. Supprimez-en une avec `/remove`.');
    }

    try {
      const id = await client.monitors.addMonitor({
        searchUrl: url,
        channelId: targetChannel.id,
        guildId: interaction.guildId,
        label,
        minPrice,
        maxPrice,
        interval,
      });

      const embed = new EmbedBuilder()
        .setColor(0x00C851)
        .setTitle('✅ Surveillance ajoutée !')
        .addFields(
          { name: '🔍 Nom', value: label, inline: true },
          { name: '🆔 ID', value: `\`${id}\``, inline: true },
          { name: '⏱️ Intervalle', value: `${interval}s`, inline: true },
          { name: '📢 Canal', value: `<#${targetChannel.id}>`, inline: true },
          { name: '💶 Filtre prix', value: minPrice || maxPrice ? `${minPrice ?? 0}€ → ${maxPrice ?? '∞'}€` : 'Aucun', inline: true },
          { name: '🔗 URL', value: url.length > 80 ? url.slice(0, 80) + '...' : url, inline: false },
        )
        .setFooter({ text: 'Les notifications arriveront dans quelques secondes dès qu\'un article est trouvé.' })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      console.error(err);
      await interaction.editReply('❌ Erreur lors de l\'ajout. Vérifie l\'URL et réessaie.');
    }
  },
};
