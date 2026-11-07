/* Local persistence (localStorage). Everything stays on the device. */
CPR.store = (function () {
  const PREFIX = 'cprkit.';

  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      return raw == null ? fallback : JSON.parse(raw);
    } catch (e) {
      return fallback;
    }
  }

  function write(key, value) {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
      return true;
    } catch (e) {
      CPR.ui && CPR.ui.toast('Could not save — device storage is full. Try removing a large map background.');
      return false;
    }
  }

  function uid(prefix) {
    return (prefix || 'id') + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  // Imported files come from other people: only accept plain IDs, and coerce numbers.
  function safeId(id, prefix) { return typeof id === 'string' && /^[A-Za-z0-9_-]{1,64}$/.test(id) ? id : uid(prefix); }
  function num(v, fallback) { const n = Number(v); return Number.isFinite(n) ? n : (fallback === undefined ? 0 : fallback); }

  // Collections stored as arrays of objects with an `id`.
  function list(key) { return read(key, []); }
  function get(key, id) { return list(key).find(x => x.id === id) || null; }
  function put(key, obj) {
    const all = list(key);
    const i = all.findIndex(x => x.id === obj.id);
    obj.updated = Date.now();
    if (i >= 0) all[i] = obj; else all.push(obj);
    return write(key, all);
  }
  function remove(key, id) { write(key, list(key).filter(x => x.id !== id)); }

  return { read, write, uid, safeId, num, list, get, put, remove };
})();
