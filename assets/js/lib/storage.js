/**
 * Safe wrapper around localStorage / sessionStorage.
 *
 * Storage can throw (private browsing, full quota, blocked cookies), and data
 * from a previous version of the site may be malformed. Every read and write
 * is guarded so a storage problem can never break the page.
 */
export function createStorage(getBackend) {
  const backend = () => {
    try { return getBackend(); } catch { return null; }
  };

  return {
    get(key, fallback) {
      try {
        const raw = backend()?.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
      } catch {
        return fallback;
      }
    },
    set(key, value) {
      try { backend()?.setItem(key, JSON.stringify(value)); } catch { /* ignore quota/private mode */ }
    },
    remove(key) {
      try { backend()?.removeItem(key); } catch { /* ignore */ }
    },
  };
}

export const local = createStorage(() => window.localStorage);
export const session = createStorage(() => window.sessionStorage);
