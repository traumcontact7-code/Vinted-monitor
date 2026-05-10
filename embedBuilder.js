const { EmbedBuilder } = require('discord.js');

const CONDITION_MAP = {
  1: { label: 'Neuf avec étiquette', emoji: '🏷️', color: 0x00C851 },
  2: { label: 'Neuf sans étiquette', emoji: '✨', color: 0x00C851 },
  3: { label: 'Très bon état', emoji: '💚', color: 0x4CAF50 },
  4: { label: 'Bon état', emoji: '💛', color: 0xFFAB00 },
  5: { label: 'Satisfaisant', emoji: '🟠', color: 0xFF6D00 },
};

function buildEmbed(item, monitorConfig) {
  const price = parseFloat(item.price || 0);
  const totalPrice = parseFloat(item.total_item_price || price);
  const condition = CONDITION_MAP[item.status_id] || { label: 'Inconnu', emoji: '❓', color: 0x5865F2 };
  
  const sellerUrl = item.user
    ? `https://${monitorConfig.domain}/member/${item.user.id}-${item.user.login}`
    : null;
  const itemUrl = `https://${monitorConfig.domain}/items/${item.id}-${item.url || item.title?.toLowerCase().replace(/\s+/g, '-') || 'article'}`;
  
  const embed = new EmbedBuilder()
    .setColor(condition.color)
    .setTitle(`${item.title || 'Article sans titre'}`)
    .setURL(itemUrl)
    .setTimestamp(item.photo?.high_resolution?.timestamp ? new Date(item.photo.high_resolution.timestamp * 1000) : new Date())
    .setFooter({
      text: `🔍 ${monitorConfig.label} • ID: ${monitorConfig.id}`,
    });

  // Thumbnail / image
  const imageUrl = item.photo?.high_resolution?.full_size_url
    || item.photo?.full_size_url
    || item.photo?.url
    || null;
  
  if (imageUrl) embed.setThumbnail(imageUrl);

  // Price field
  const priceDisplay = price !== totalPrice
    ? `**${price}€** (frais inclus: ${totalPrice}€)`
    : `**${price}€**`;

  embed.addFields(
    {
      name: '💶 Prix',
      value: priceDisplay,
      inline: true,
    },
    {
      name: `${condition.emoji} État`,
      value: condition.label,
      inline: true,
    },
  );

  // Brand
  if (item.brand_title) {
    embed.addFields({ name: '🏷️ Marque', value: item.brand_title, inline: true });
  }

  // Size
  if (item.size_title) {
    embed.addFields({ name: '📐 Taille', value: item.size_title, inline: true });
  }

  // Location
  if (item.city || item.country_title) {
    const location = [item.city, item.country_title].filter(Boolean).join(', ');
    embed.addFields({ name: '📍 Localisation', value: location, inline: true });
  }

  // Seller info
  if (item.user) {
    const { login, feedback_reputation } = item.user;
    const stars = feedback_reputation
      ? `⭐ ${(feedback_reputation * 5).toFixed(1)}/5`
      : '';
    embed.addFields({
      name: '👤 Vendeur',
      value: sellerUrl ? `[${login}](${sellerUrl}) ${stars}` : `${login} ${stars}`,
      inline: true,
    });
  }

  // Views & favourites
  if (item.view_count || item.favourite_count) {
    const stats = [];
    if (item.view_count) stats.push(`👁️ ${item.view_count} vues`);
    if (item.favourite_count) stats.push(`❤️ ${item.favourite_count} favoris`);
    embed.addFields({ name: '📊 Stats', value: stats.join(' · '), inline: true });
  }

  // Description snippet
  if (item.description) {
    const desc = item.description.slice(0, 150);
    embed.addFields({
      name: '📝 Description',
      value: desc.length < item.description.length ? `${desc}...` : desc,
      inline: false,
    });
  }

  // CTA
  embed.addFields({
    name: '\u200B',
    value: `[🛒 Voir l'annonce](${itemUrl})${sellerUrl ? ` · [👤 Voir le profil](${sellerUrl})` : ''}`,
    inline: false,
  });

  return embed;
}

module.exports = { buildEmbed };
