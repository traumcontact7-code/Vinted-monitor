// Utilise le package 'vinted-api' qui gère les cookies/headers automatiquement
// npm install vinted-api
const Vinted = require('vinted-api');

const VINTED_DOMAINS = {
  fr: 'www.vinted.fr', be: 'www.vinted.be', de: 'www.vinted.de',
  nl: 'www.vinted.nl', es: 'www.vinted.es', it: 'www.vinted.it',
  pl: 'www.vinted.pl', uk: 'www.vinted.co.uk', lu: 'www.vinted.lu',
  pt: 'www.vinted.pt', at: 'www.vinted.at', cz: 'www.vinted.cz',
};

function getDomainFromUrl(url) {
  for (const [cc, domain] of Object.entries(VINTED_DOMAINS)) {
    if (url.includes(domain)) return { cc, domain };
  }
  return { cc: 'fr', domain: 'www.vinted.fr' };
}

// Pas besoin de gérer les cookies manuellement, vinted-api le fait
async function getVintedCookie(domain) {
  return '';
}

function parseSearchUrl(searchUrl) {
  try {
    const url = new URL(searchUrl);
    const result = {};
    for (const [key, value] of url.searchParams.entries()) {
      result[key] = value;
    }
    return result;
  } catch {
    return {};
  }
}

async function fetchItems(searchUrl, _cookie, perPage = 20) {
  const { cc } = getDomainFromUrl(searchUrl);
  const searchParams = parseSearchUrl(searchUrl);

  try {
    const result = await Vinted.search({
      searchText: searchParams.search_text || searchParams.q || '',
      catalogIds: searchParams.catalog_ids || searchParams.catalog_id || '',
      brandIds: searchParams.brand_ids || searchParams.brand_id || '',
      sizeIds: searchParams.size_ids || searchParams.size_id || '',
      priceFrom: searchParams.price_from || '',
      priceTo: searchParams.price_to || '',
      colorIds: searchParams.color_ids || '',
      statusIds: searchParams.status_ids || '',
      order: searchParams.order || 'newest_first',
      perPage,
      country: cc,
    });

    return result.items || [];
  } catch (err) {
    console.error('[Vinted] Erreur fetchItems:', err.message);
    return [];
  }
}

module.exports = { fetchItems, getVintedCookie, getDomainFromUrl, VINTED_DOMAINS };
