// artshot: AsyncStorage → test/_fake-async-storage.mjs (an in-memory Map) when present.
const path = require('node:path');
const fs = require('node:fs');
globalThis.__FAKE_ASYNC_STORAGE__ ??= new Map();
const fake = path.resolve(__dirname, '../../../test/_fake-async-storage.mjs');
const store = globalThis.__FAKE_ASYNC_STORAGE__;
const base = fs.existsSync(fake) ? require(fake).default : {
  async getItem(k) { return store.has(k) ? store.get(k) : null; },
  async setItem(k, v) { store.set(k, v); },
  async removeItem(k) { store.delete(k); },
};
const api = {
  ...base,
  async multiGet(keys) { return Promise.all(keys.map(async (k) => [k, await api.getItem(k)])); },
  async multiSet(pairs) { for (const [k, v] of pairs) await api.setItem(k, v); },
  async multiRemove(keys) { for (const k of keys) await api.removeItem(k); },
  async getAllKeys() { return [...store.keys()]; },
  async clear() { store.clear(); },
};
module.exports = { __esModule: true, default: api, ...api };
