const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Affiche l\'aide du bot'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor(0x009EE0)
      .setTitle('🛍️ Vinted Monitor — Aide')
      .setDescription('Recevez des notifications en temps reel des qu\'une annonce correspond a vos criteres !')
      .addFields(
        { name: '📌 Commandes', value: '`/add` — Ajouter une surveillance\n`/remove` — Supprimer\n`/list` — Voir les surveillances\n`/ping` — Tester la latence\n`/help` — Cette aide', inline: false },
        { name: '🚀 Demarrage rapide', value: '1. Va sur vinted.fr et fais ta recherche\n2. Copie l\'URL\n3. Tape `/add url:<url> label:<nom>`\n4. Les annonces arrivent automatiquement !', inline: false },
        { name: '💡 Astuces', value: '• Filtre par taille/marque/etat sur Vinted avant de copier l\'URL\n• `prix_min` et `prix_max` pour filtrer par budget\n• 20 surveillances max par serveur\n• Intervalle minimum: 30 secondes', inline: false },
      )
      .setFooter({ text: 'Vinted Monitor Bot' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
