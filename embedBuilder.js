const { EmbedBuilder } = require('discord.js');

const CONDITION_MAP = {
  1: { label: 'Neuf avec etiquette', emoji: '🏷️', color: 0x00C851 },
  2: { label: 'Neuf sans etiquette', emoji: '✨', color: 0x00C851 },
  3: { label: 'Tres bon etat', emoji: '💚', color: 0x4CAF50 },
  4: { label: 'Bon etat', emoji: '💛', color: 0xFFAB00 },
  5: { label: 'Satisfaisant', emoji: '🟠', color: 0xFF6D00 },
};

function buildEmbed(item, monitorConfig) {
  const price = parseFloat(item.price || 0);
  const totalPrice = parseFloat(item.total_item_price || price);
  const condition = CONDITION_MAP[item.status_id] || { label: 'Inconnu', emoji: '❓', color: 0x5865F2 };
  const domain = monitorConfig.domain || 'www.vinted.fr';
  const itemUrl = `https://${domain}/items/${item.id}`;
  const sellerUrl = item.user ? `https://${domain}/member/${item.user.id}-${item.user.login}` : null;

  const embed = new EmbedBuilder()
    .setColor(condition.color)
    .setTitle(item.title || 'Article sans titre')
    .setURL(itemUrl)
    .setTimestamp()
    .setFooter({ text: `Surveillance: ${monitorConfig.label} • ID: ${monitorConfig.id}` });

  const imageUrl = item.photo?.high_resolution?.full_size_url || item.photo?.full_size_url || item.photo?.url || null;
  if (imageUrl) embed.setThumbnail(imageUrl);

  const priceDisplay = price !== totalPrice ? `**${price}€** (frais inclus: ${totalPrice}€)` : `**${price}€**`;

  embed.addFields(
    { name: '💶 Prix', value: priceDisplay, inline: true },
    { name: `${condition.emoji} Etat`, value: condition.label, inline: true },
  );

  if (item.brand_title) embed.addFields({ name: '🏷️ Marque', value: item.brand_title, inline: true });
  if (item.size_title) embed.addFields({ name: '📐 Taille', value: item.size_title, inline: true });

  if (item.city || item.country_title) {
    embed.addFields({ name: '📍 Lieu', value: [item.city, item.country_title].filter(Boolean).join(', '), inline: true });
  }

  if (item.user) {
    const stars = item.user.feedback_reputation ? `⭐ ${(item.user.feedback_reputation * 5).toFixed(1)}/5` : '';
    embed.addFields({
      name: '👤 Vendeur',
      value: sellerUrl ? `[${item.user.login}](${sellerUrl}) ${stars}` : `${item.user.login} ${stars}`,
      inline: true,
    });
  }

  if (item.description) {
    const desc = item.description.slice(0, 150);
    embed.addFields({ name: '📝 Description', value: desc.length < item.description.length ? desc + '...' : desc, inline: false });
  }

  embed.addFields({ name: '\u200B', value: `[🛒 Voir l'annonce](${itemUrl})${sellerUrl ? ` • [👤 Profil vendeur](${sellerUrl})` : ''}`, inline: false });

  return embed;
}

module.exports = { buildEmbed };
