const https = require('https');
const zlib = require('zlib');

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

function httpsGet(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const req = https.request({
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
        'Accept': 'application/json',
        'Accept-Language': 'fr-FR,fr;q=0.9',
        ...headers,
      },
    }, (res) => {
      const enc = res.headers['content-encoding'];
      let stream = res;
      if (enc === 'gzip') stream = res.pipe(zlib.createGunzip());
      else if (enc === 'deflate') stream = res.pipe(zlib.createInflate());
      else if (enc === 'br') stream = res.pipe(zlib.createBrotliDecompress());

      let data = '';
      stream.on('data', c => data += c);
      stream.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
      stream.on('error', reject);
    });
    req.on('error', reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('Timeout')); });
    req.end();
  });
}

// Cache cookie par domaine
const cookieCache = new Map();

async function getVintedCookie(domain) {
  const cached = cookieCache.get(domain);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  try {
    const res = await httpsGet(`https://${domain}/`);
    const cookies = (res.headers['set-cookie'] || []).map(c => c.split(';')[0]).join('; ');
    console.log(`[Cookie] ${domain} status=${res.status} cookie=${cookies ? 'OK' : 'VIDE'}`);
    cookieCache.set(domain, { value: cookies, expiresAt: Date.now() + 20 * 60 * 1000 });
    return cookies;
  } catch (err) {
    console.error('[Cookie] Erreur:', err.message);
    return '';
  }
}

function parseSearchUrl(searchUrl) {
  try {
    const url = new URL(searchUrl);
    const result = {};
    for (const [key, value] of url.searchParams.entries()) result[key] = value;
    return result;
  } catch { return {}; }
}

async function fetchItems(searchUrl, cookie, perPage = 20) {
  const { domain } = getDomainFromUrl(searchUrl);
  const sp = parseSearchUrl(searchUrl);

  // Si pas de cookie fourni, en récupérer un
  if (!cookie) cookie = await getVintedCookie(domain);

  const params = new URLSearchParams();
  if (sp.search_text || sp.q) params.set('search_text', sp.search_text || sp.q);
  if (sp.catalog_ids) params.set('catalog_ids', sp.catalog_ids);
  if (sp.brand_ids) params.set('brand_ids', sp.brand_ids);
  if (sp.size_ids) params.set('size_ids', sp.size_ids);
  if (sp.price_from) params.set('price_from', sp.price_from);
  if (sp.price_to) params.set('price_to', sp.price_to);
  if (sp.color_ids) params.set('color_ids', sp.color_ids);
  if (sp.status_ids) params.set('status_ids', sp.status_ids);
  params.set('order', sp.order || 'newest_first');
  params.set('per_page', perPage);
  params.set('page', 1);

  const apiUrl = `https://${domain}/api/v2/items?${params.toString()}`;
  console.log(`[Fetch] ${apiUrl.slice(0, 80)}...`);

  try {
    const res = await httpsGet(apiUrl, {
      'Cookie': cookie,
      'Referer': `https://${domain}/`,
      'Origin': `https://${domain}`,
      'X-Requested-With': 'XMLHttpRequest',
    });

    console.log(`[Fetch] status=${res.status} bodyLen=${res.body.length}`);

    if (res.status === 401 || res.status === 403) {
      console.log('[Fetch] Bloqué, renouvellement cookie...');
      cookieCache.delete(domain);
      return [];
    }

    const parsed = JSON.parse(res.body);
    const items = parsed.items || [];
    console.log(`[Fetch] ${items.length} article(s) reçu(s)`);
    return items;
  } catch (err) {
    console.error('[Fetch] Erreur:', err.message);
    return [];
  }
}

module.exports = { fetchItems, getVintedCookie, getDomainFromUrl, VINTED_DOMAINS };
