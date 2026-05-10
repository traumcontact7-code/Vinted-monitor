const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Affiche l\'aide du bot Vinted Monitor'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor(0x009EE0)
      .setTitle('🛍️ Vinted Monitor — Aide')
      .setDescription('Bot de surveillance Vinted en temps réel. Recevez des notifications dès qu\'une nouvelle annonce correspond à vos critères !')
      .addFields(
        {
          name: '📌 Commandes',
          value: [
            '`/add` — Ajouter une surveillance',
            '`/remove` — Supprimer une surveillance',
            '`/list` — Voir les surveillances actives',
            '`/ping` — Tester la latence',
            '`/help` — Afficher cette aide',
          ].join('\n'),
          inline: false,
        },
        {
          name: '🚀 Comment démarrer ?',
          value: [
            '1. Va sur **vinted.fr** et fais ta recherche',
            '2. Copie l\'URL complète depuis la barre d\'adresse',
            '3. Utilise `/add url:<url_copiée> label:<nom>`',
            '4. Les nouvelles annonces arrivent automatiquement !',
          ].join('\n'),
          inline: false,
        },
        {
          name: '💡 Astuces',
          value: [
            '• Utilise les filtres Vinted (taille, marque, état) **avant** de copier l\'URL',
            '• `prix_min` et `prix_max` filtrent les annonces côté bot',
            '• Chaque serveur peut avoir jusqu\'à **20** surveillances simultanées',
            '• Intervalle minimum: **30 secondes**',
          ].join('\n'),
          inline: false,
        },
        {
          name: '🌍 Pays supportés',
          value: 'FR · BE · DE · NL · ES · IT · PL · UK · LU · PT · AT · CZ · SK · HU · RO · LT · LV · FI · SE · DK',
          inline: false,
        },
      )
      .setFooter({ text: 'Vinted Monitor Bot • Fait avec ❤️ pour les resellers' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
