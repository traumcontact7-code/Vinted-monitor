const fs = require('fs');
const path = require('path');
const { fetchItems, getVintedCookie, getDomainFromUrl } = require('../api/vinted');
const { buildEmbed } = require('../utils/embedBuilder');

const DATA_FILE = path.join(__dirname, '../../data/monitors.json');

class MonitorManager {
  constructor(client) {
    this.client = client;
    this.monitors = new Map(); // monitorId -> { interval, config }
    this.seenItems = new Map(); // monitorId -> Set of item IDs
    this.cookies = new Map(); // domain -> cookie
    this.ensureDataDir();
  }

  ensureDataDir() {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '{}');
  }

  loadData() {
    try {
      return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    } catch {
      return {};
    }
  }

  saveData(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  }

  generateId() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  async getCookie(domain) {
    if (!this.cookies.has(domain) || this.cookies.get(domain).expiresAt < Date.now()) {
      try {
        const cookie = await getVintedCookie(domain);
        this.cookies.set(domain, { value: cookie, expiresAt: Date.now() + 30 * 60 * 1000 });
      } catch {
        return '';
      }
    }
    return this.cookies.get(domain)?.value || '';
  }

  async addMonitor(config) {
    const { searchUrl, channelId, guildId, label, minPrice, maxPrice, interval = 60 } = config;
    const id = this.generateId();
    const { domain } = getDomainFromUrl(searchUrl);

    const monitorConfig = {
      id, searchUrl, channelId, guildId, label: label || 'Sans titre',
      minPrice: minPrice || null, maxPrice: maxPrice || null,
      interval: Math.max(30, interval), domain,
      createdAt: new Date().toISOString(),
    };

    // Save to disk
    const data = this.loadData();
    if (!data[guildId]) data[guildId] = {};
    data[guildId][id] = monitorConfig;
    this.saveData(data);

    // Start monitoring
    this.startMonitor(monitorConfig);
    return id;
  }

  startMonitor(config) {
    const { id, searchUrl, channelId, domain, interval } = config;
    this.seenItems.set(id, new Set());

    // Initial fetch to populate seen items (no notifications on start)
    this.fetchAndNotify(config, true);

    const intervalId = setInterval(() => {
      this.fetchAndNotify(config, false);
    }, interval * 1000);

    this.monitors.set(id, { interval: intervalId, config });
    console.log(`📡 Monitor [${id}] démarré — ${config.label} (${interval}s)`);
  }

  async fetchAndNotify(config, silent = false) {
    const { id, searchUrl, channelId, domain, minPrice, maxPrice } = config;

    try {
      const cookie = await this.getCookie(domain);
      const items = await fetchItems(searchUrl, cookie);

      if (!this.seenItems.has(id)) this.seenItems.set(id, new Set());
      const seen = this.seenItems.get(id);

      if (silent) {
        items.forEach(item => seen.add(item.id));
        return;
      }

      const newItems = items.filter(item => !seen.has(item.id));
      newItems.forEach(item => seen.add(item.id));

      // Keep seen set manageable
      if (seen.size > 2000) {
        const arr = [...seen];
        const trimmed = new Set(arr.slice(arr.length - 1000));
        this.seenItems.set(id, trimmed);
      }

      if (newItems.length === 0) return;

      const channel = await this.client.channels.fetch(channelId).catch(() => null);
      if (!channel) return;

      for (const item of newItems.slice(0, 5)) {
        const price = parseFloat(item.price);
        if (minPrice && price < minPrice) continue;
        if (maxPrice && price > maxPrice) continue;

        const embed = buildEmbed(item, config);
        await channel.send({ embeds: [embed] }).catch(console.error);
        await new Promise(r => setTimeout(r, 300)); // slight delay between messages
      }
    } catch (err) {
      console.error(`Erreur monitor [${id}]:`, err.message);
    }
  }

  stopMonitor(id, guildId) {
    const monitor = this.monitors.get(id);
    if (monitor) {
      clearInterval(monitor.interval);
      this.monitors.delete(id);
      this.seenItems.delete(id);
    }

    const data = this.loadData();
    if (data[guildId] && data[guildId][id]) {
      delete data[guildId][id];
      this.saveData(data);
      return true;
    }
    return false;
  }

  getGuildMonitors(guildId) {
    const data = this.loadData();
    return data[guildId] ? Object.values(data[guildId]) : [];
  }

  restoreAll() {
    const data = this.loadData();
    let count = 0;
    for (const [guildId, monitors] of Object.entries(data)) {
      for (const config of Object.values(monitors)) {
        this.startMonitor(config);
        count++;
      }
    }
    console.log(`🔄 ${count} monitor(s) restauré(s)`);
  }

  getMonitorInfo(id, guildId) {
    const data = this.loadData();
    return data[guildId]?.[id] || null;
  }
}

module.exports = MonitorManager;
