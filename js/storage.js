/* Sabrina's Secret Garden — durable save storage.

   A garden you've grown for weeks must not vanish. Three things protect it:

   1. Every save is written to BOTH localStorage and IndexedDB. If one is cleared
      the other rebuilds it on next load — whichever copy is newer wins.
   2. navigator.storage.persist() asks the browser not to evict us under pressure.
   3. Manual backup/restore to a file, which survives anything at all.

   The one case none of this can beat is iOS Safari deleting script-writable
   storage after 7 days of not visiting the site. Apple exempts web apps added to
   the Home Screen, which is why the game nags about installing. */

const STORE = (function () {
  const KEY = 'sabrina-glasshouse-full-v2';
  const DB_NAME = 'sabrina-glasshouse-full', TABLE = 'kv';
  let dbPromise = null;
  let lastError = null;

  /* ---------- IndexedDB, promisified and failure-tolerant ---------- */
  function db() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise(res => {
      let req;
      try { req = indexedDB.open(DB_NAME, 1); } catch (e) { return res(null); }
      req.onupgradeneeded = () => { try { req.result.createObjectStore(TABLE); } catch (e) {} };
      req.onsuccess = () => res(req.result);
      req.onerror = () => res(null);
      req.onblocked = () => res(null);
      setTimeout(() => res(null), 3000);          // never hang the boot on a wedged IDB
    });
    return dbPromise;
  }
  async function idbPut(value) {
    const d = await db(); if (!d) return false;
    return new Promise(res => {
      try {
        const tx = d.transaction(TABLE, 'readwrite');
        tx.objectStore(TABLE).put(value, KEY);
        tx.oncomplete = () => res(true);
        tx.onerror = tx.onabort = () => res(false);
      } catch (e) { res(false); }
    });
  }
  async function idbGet() {
    const d = await db(); if (!d) return null;
    return new Promise(res => {
      try {
        const tx = d.transaction(TABLE, 'readonly');
        const rq = tx.objectStore(TABLE).get(KEY);
        rq.onsuccess = () => res(rq.result ?? null);
        rq.onerror = () => res(null);
      } catch (e) { res(null); }
    });
  }

  const lsGet = () => { try { return localStorage.getItem(KEY); } catch (e) { return null; } };
  const lsPut = raw => { try { localStorage.setItem(KEY, raw); return true; } catch (e) { lastError = e; return false; } };
  const stampOf = raw => { try { return JSON.parse(raw).savedAt || 0; } catch (e) { return 0; } };
  const valid = raw => { try { const o = JSON.parse(raw); return !!(o && o.plants); } catch (e) { return false; } };

  /* ---------- public ---------- */
  function write(raw) {
    const ok = lsPut(raw);
    idbPut(raw);                                   // fire and forget
    return ok;
  }

  /* Pick the newest surviving copy and heal whichever store lost it. */
  async function loadBest() {
    const ls = lsGet();
    let idb = null;
    try { idb = await idbGet(); } catch (e) {}
    const lsOk = ls && valid(ls), idbOk = idb && valid(idb);

    if (lsOk && idbOk) {
      if (stampOf(idb) > stampOf(ls)) { lsPut(idb); return { raw: idb, recovered: 'localStorage' }; }
      if (stampOf(ls) > stampOf(idb)) idbPut(ls);
      return { raw: ls, recovered: null };
    }
    if (idbOk) { lsPut(idb); return { raw: idb, recovered: 'localStorage' }; }
    if (lsOk) { idbPut(ls); return { raw: ls, recovered: 'IndexedDB' }; }
    return { raw: null, recovered: null };
  }

  function clear() {
    try { localStorage.removeItem(KEY); } catch (e) {}
    idbPut(null);
  }

  /* Ask the browser to treat our data as persistent. Chrome/Android usually grants
     this once the app is installed; Safari ignores it. Must be called from a gesture
     on some browsers, so the UI calls it again after the first tap. */
  async function requestPersistence() {
    try {
      if (!navigator.storage || !navigator.storage.persist) return 'unsupported';
      if (await navigator.storage.persisted()) return 'granted';
      return (await navigator.storage.persist()) ? 'granted' : 'denied';
    } catch (e) { return 'unsupported'; }
  }
  async function status() {
    let persisted = false, quota = null, usage = null;
    try {
      if (navigator.storage && navigator.storage.persisted) persisted = await navigator.storage.persisted();
      if (navigator.storage && navigator.storage.estimate) {
        const est = await navigator.storage.estimate();
        quota = est.quota; usage = est.usage;
      }
    } catch (e) {}
    return {
      persisted, quota, usage,
      installed: isInstalled(),
      ios: isIOS(),
      lastError: lastError && lastError.name,
    };
  }

  const isInstalled = () =>
    (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
    navigator.standalone === true;
  const isIOS = () =>
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  return { write, loadBest, clear, requestPersistence, status, isInstalled, isIOS, KEY };
})();
