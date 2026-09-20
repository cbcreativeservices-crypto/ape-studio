/** Minimal AsyncStorage stand-in for the scenario-queue test. */
const store = globalThis.__FAKE_ASYNC_STORAGE__;
export default {
  async getItem(k) { return store.has(k) ? store.get(k) : null; },
  async setItem(k, v) { store.set(k, v); },
  async removeItem(k) { store.delete(k); },
};
