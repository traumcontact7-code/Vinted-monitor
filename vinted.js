const https = require('https');
const zlib = require('zlib');

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

function getDomainFromUrl(url) {
  for (const [cc, domain] of Object.entries(VINTED_DOMAINS)) {
    if (url.includes(domain)) return { cc, domain };
  }
  return { cc: 'fr', domain: 'www.vinted.fr' };
}

async function getVintedCookie(domain) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: domain,
      path: '/',
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
        'Connection': 'keep-alive',
      },
    };

    const req = https.request(options, (res) => {
      // Consume response body to free socket
      res.resume();
      const cookies = res.headers['set-cookie'] || [];
      const sessionCookie = cookies.map(c => c.split(';')[0]).join('; ');
      resolve(sessionCookie);
    });

    req.on('error', reject);
    req.setTimeout(10000, () => { req.destroy(); reject(new Error('Timeout getting cookie')); });
    req.end();
  });
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

  for (const [key, value] of [...apiParams.entries()]) {
    if (!value) apiParams.delete(key);
  }

  return new Promise((resolve, reject) => {
    const reqPath = `/api/v2/items?${apiParams.toString()}`;
    const options = {
      hostname: domain,
      path: reqPath,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'fr-FR,fr;q=0.9',
        // No Accept-Encoding — reçoit du texte brut, pas de gzip
        'Cookie': cookie || '',
        'Referer': `https://${domain}/`,
        'Origin': `https://${domain}`,
        'X-Requested-With': 'XMLHttpRequest',
      },
    };

    const req = https.request(options, (res) => {
      const encoding = res.headers['content-encoding'];
      let stream = res;

      if (encoding === 'gzip') {
        stream = res.pipe(zlib.createGunzip());
      } else if (encoding === 'deflate') {
        stream = res.pipe(zlib.createInflate());
      } else if (encoding === 'br') {
        stream = res.pipe(zlib.createBrotliDecompress());
      }

      let data = '';
      stream.on('data', chunk => data += chunk);
      stream.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.items) {
            resolve(parsed.items);
          } else {
            console.warn(`[Vinted] Réponse inattendue (status HTTP ${res.statusCode}):`, data.slice(0, 200));
            resolve([]);
          }
        } catch (e) {
          console.warn('[Vinted] JSON invalide:', data.slice(0, 200));
          resolve([]);
        }
      });
      stream.on('error', reject);
    });

    req.on('error', reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('Timeout fetching items')); });
    req.end();
  });
}

module.exports = { fetchItems, getVintedCookie, getDomainFromUrl, VINTED_DOMAINS };
