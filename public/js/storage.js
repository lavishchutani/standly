// Thin wrapper around localStorage so widgets never touch it directly.
// Keeps JSON parse/stringify in one place and fails quietly if storage
// is unavailable (e.g. private browsing) instead of crashing a widget.

const Storage = {
  get(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch (e) {
      console.warn("Storage.get failed for", key, e);
      return fallback;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      const status = document.getElementById("app-status");
      if (status) status.textContent = "Storage unavailable · changes may not survive closing";
    }
  }
};
