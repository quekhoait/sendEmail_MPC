const KEY = 'gmt.templates';

export const loadSavedTemplates = () => {
  try {
    const raw = localStorage.getItem(KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch (_) {
    return [];
  }
};

export const persistSavedTemplates = (list) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch (_) {}
};
