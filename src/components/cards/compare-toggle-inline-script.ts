export const compareToggleInlineScript = String.raw`(() => {
  const scriptEl = document.currentScript;
  if (!(scriptEl instanceof HTMLScriptElement)) {
    return;
  }

  const compareId = scriptEl.dataset.compareId;
  const compareType = scriptEl.dataset.compareType || 'controller';
  const eventName = scriptEl.dataset.compareEventName || 'fcbase:compare-change';
  const storageKey = scriptEl.dataset.compareStorageKey || ('fcbase:compare:' + compareType);
  const legacyKeysRaw = scriptEl.dataset.compareLegacyKeys;
  const container = scriptEl.parentElement;

  if (!compareId || typeof window === 'undefined' || !(container instanceof HTMLElement)) {
    return;
  }

  const toggle = container.querySelector('input[data-compare-toggle]')
    || document.querySelector('input[data-compare-toggle="' + compareId + '"]');
  const card = container.querySelector('.compare-card');
  const toggleWrapper = container.querySelector('[data-compare-toggle-wrapper]');

  if (!(toggle instanceof HTMLInputElement)) {
    return;
  }

  const parseList = (raw) => {
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter((value) => typeof value === 'string');
    } catch (_error) {
      return [];
    }
  };

  let legacyKeys = [];
  if (legacyKeysRaw) {
    try {
      const parsed = JSON.parse(legacyKeysRaw);
      if (Array.isArray(parsed)) {
        legacyKeys = parsed.filter((value) => typeof value === 'string');
      }
    } catch (_error) {
      legacyKeys = [];
    }
  }

  let legacyMigrated = legacyKeys.length === 0;

  const readList = () => {
    if (!legacyMigrated) {
      legacyMigrated = true;
      const legacyValues = legacyKeys.reduce((accumulator, key) => {
        const values = parseList(window.localStorage.getItem(key));
        if (values.length > 0) {
          accumulator.push(...values);
          window.localStorage.removeItem(key);
        }
        return accumulator;
      }, []);

      if (legacyValues.length > 0) {
        const existing = parseList(window.localStorage.getItem(storageKey));
        const merged = Array.from(new Set([...existing, ...legacyValues]));
        window.localStorage.setItem(storageKey, JSON.stringify(merged));
      }
    }

    return parseList(window.localStorage.getItem(storageKey));
  };

  const writeList = (list) => {
    const unique = Array.from(new Set(list));
    window.localStorage.setItem(storageKey, JSON.stringify(unique));
    window.dispatchEvent(
      new CustomEvent(eventName, {
        detail: { type: compareType, ids: unique },
      })
    );
  };

  const applyMarkedState = (marked) => {
    if (card instanceof HTMLElement) {
      card.dataset.marked = marked ? 'true' : 'false';
    }
    if (toggleWrapper instanceof HTMLElement) {
      toggleWrapper.dataset.marked = marked ? 'true' : 'false';
    }
  };

  const syncFromStorage = () => {
    const list = readList();
    const isMarked = list.includes(compareId);
    toggle.checked = isMarked;
    applyMarkedState(isMarked);
  };

  toggle.addEventListener('change', () => {
    const list = readList();
    const index = list.indexOf(compareId);
    if (toggle.checked && index === -1) {
      list.push(compareId);
    } else if (!toggle.checked && index !== -1) {
      list.splice(index, 1);
    }
    writeList(list);
    applyMarkedState(toggle.checked);
  });

  window.addEventListener('storage', (event) => {
    if (!event.key) return;
    if (event.key === storageKey || legacyKeys.includes(event.key)) {
      syncFromStorage();
    }
  });

  window.addEventListener(eventName, (event) => {
    if (!event || typeof event !== 'object') return;
    const detail = 'detail' in event ? event.detail : undefined;
    if (!detail || typeof detail !== 'object') return;
    if (detail.type && detail.type !== compareType) return;
    syncFromStorage();
  });

  syncFromStorage();
})();`;
