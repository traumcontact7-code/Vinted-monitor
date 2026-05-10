const https = require('https');
const http = require('http');

const VINTED_DOMAINS = {
  fr: 'www.vinted.fr',
  be: 'www.vinted.be',
  de: 'www.vinted.de',
  nl: 'www.vinted.nl',
  es: 'www.vinted.es',
  it: 'www.vinted.it',
  pl: 'www.vinted.pl',
  uk: 'www.vinted.co.uk',
  lu: 'www.vinted.lu',
  pt: 'www.vinted.pt',
  at: 'www.vinted.at',
  cz: 'www.vinted.cz',
  sk: 'www.vinted.sk',
  hu: 'www.vinted.hu',
  ro: 'www.vinted.ro',
  lt: 'www.vinted.lt',
  lv: 'www.vinted.lv',
  fi: 'www.vinted.fi',
  se: 'www.vinted.se',
  dk: 'www.vinted.dk',
};

// Detect domain from URL
function getDomainFromUrl(url) {
  for (const [cc, domain] of Object.entries(VINTED_DOMAINS)) {
    if (url.includes(domain)) return { cc, domain };
  }
  return { cc: 'fr', domain: 'www.vinted.fr' };
}

// Fetch Vinted cookie (needed for API calls)
async function getVintedCookie(domain) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: domain,
      path: '/',
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
      },
    };

    const req = https.request(options, (res) => {
      const cookies = res.headers['set-cookie'] || [];
      const sessionCookie = cookies
        .map(c => c.split(';')[0])
        .join('; ');
      resolve(sessionCookie);
    });

    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Timeout getting cookie'));
    });
    req.end();
  });
}

// Parse search URL params into Vinted API params
function parseSearchUrl(searchUrl) {
  try {
    const url = new URL(searchUrl);
    const params = new URLSearchParams(url.search);
    const result = {};
    for (const [key, value] of params.entries()) {
      result[key] = value;
    }
    return result;
  } catch {
    return {};
  }
}

// Fetch items from Vinted API
async function fetchItems(searchUrl, cookie, perPage = 20) {
  const { domain } = getDomainFromUrl(searchUrl);
  const searchParams = parseSearchUrl(searchUrl);

  const apiParams = new URLSearchParams({
    search_text: searchParams.search_text || searchParams.q || '',
    catalog_ids: searchParams.catalog_ids || searchParams.catalog_id || '',
    brand_ids: searchParams.brand_ids || searchParams.brand_id || '',
    size_ids: searchParams.size_ids || searchParams.size_id || '',
    price_from: searchParams.price_from || '',
    price_to: searchParams.price_to || '',
    currency: searchParams.currency || '',
    color_ids: searchParams.color_ids || '',
    material_ids: searchParams.material_ids || '',
    status_ids: searchParams.status_ids || '',
    order: searchParams.order || 'newest_first',
    per_page: perPage,
    page: 1,
  });

  // Remove empty params
  for (const [key, value] of [...apiParams.entries()]) {
    if (!value) apiParams.delete(key);
  }

  return new Promise((resolve, reject) => {
    const path = `/api/v2/items?${apiParams.toString()}`;
    const options = {
      hostname: domain,
      path,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'fr-FR,fr;q=0.9',
        'Cookie': cookie || '',
        'Referer': `https://${domain}/`,
        'Origin': `https://${domain}`,
        'X-Requested-With': 'XMLHttpRequest',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed.items || []);
        } catch {
          resolve([]);
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error('Timeout fetching items'));
    });
    req.end();
  });
}

module.exports = { fetchItems, getVintedCookie, getDomainFromUrl, VINTED_DOMAINS };
