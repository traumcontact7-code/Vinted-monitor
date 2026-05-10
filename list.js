const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('list')
    .setDescription('Voir toutes les surveillances actives sur ce serveur'),

  async execute(interaction, client) {
    await interaction.deferReply({ ephemeral: true });

    const monitors = client.monitors.getGuildMonitors(interaction.guildId);

    if (monitors.length === 0) {
      return interaction.editReply('📭 Aucune surveillance active. Utilisez `/add` pour en créer une !');
    }

    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle(`📡 Surveillances actives — ${monitors.length}/20`)
      .setTimestamp();

    for (const m of monitors) {
      const isActive = client.monitors.monitors.has(m.id);
      const priceFilter = m.minPrice || m.maxPrice
        ? `${m.minPrice ?? 0}€ → ${m.maxPrice ?? '∞'}€`
        : 'Aucun filtre';

      embed.addFields({
        name: `${isActive ? '🟢' : '🔴'} [${m.id}] ${m.label}`,
        value: [
          `📢 <#${m.channelId}>`,
          `⏱️ ${m.interval}s · 💶 ${priceFilter}`,
          `🔗 ${m.searchUrl.slice(0, 60)}${m.searchUrl.length > 60 ? '...' : ''}`,
        ].join('\n'),
        inline: false,
      });
    }

    embed.setFooter({ text: 'Utilisez /remove <ID> pour supprimer une surveillance' });

    await interaction.editReply({ embeds: [embed] });
  },
};
