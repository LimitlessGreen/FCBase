import {
  COMPARE_EVENT_NAME,
  getCompareLegacyStorageKeys,
  getCompareStorageKey,
  type CompareType,
} from './compare';

export type CompareToggleType = CompareType;

export interface CompareToggleOptions {
  /** Unique identifier for the card being toggled. */
  compareId: string;
  /** Type of compare list we are working with. */
  compareType: CompareToggleType;
  /**
   * Root element containing the compare toggle UI. The helper will use this element
   * to look up the input, card container, and wrapper elements that need to respond
   * to state changes.
   */
  root: Element | DocumentFragment | null;
  /** Custom event name to dispatch when the compare list changes. */
  eventName?: string;
  /** Optional override for the storage key used to persist the compare list. */
  storageKey?: string;
  /** Optional override for the legacy storage key used during migration. */
  legacyStorageKey?: string | null;
}

export function initCompareToggle(options: CompareToggleOptions): void {
  if (typeof window === 'undefined') {
    return;
  }

  const {
    compareId,
    compareType,
    root,
    eventName = COMPARE_EVENT_NAME,
    storageKey: storageKeyOverride,
    legacyStorageKey: legacyStorageKeyOverride,
  } = options;

  if (!compareId || !compareType) {
    return;
  }

  if (!(root instanceof HTMLElement)) {
    return;
  }

  const toggle = root.querySelector<HTMLInputElement>('input[data-compare-toggle]');
  const card = root.querySelector<HTMLElement>('.compare-card');
  const toggleWrapper = root.querySelector<HTMLElement>('[data-compare-toggle-wrapper]');

  if (!toggle || !card) {
    return;
  }

  const parseList = (raw: string | null): string[] => {
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter((value) => typeof value === 'string');
    } catch {
      return [];
    }
  };

  const storageKey = storageKeyOverride ?? getCompareStorageKey(compareType);
  const legacyKeys = (() => {
    if (legacyStorageKeyOverride === undefined) {
      return getCompareLegacyStorageKeys(compareType);
    }

    if (legacyStorageKeyOverride === null) {
      return [] as string[];
    }

    return [legacyStorageKeyOverride];
  })();

  let legacyMigrated = legacyKeys.length === 0;

  const readList = (): string[] => {
    if (!legacyMigrated) {
      legacyMigrated = true;
      const legacyValues = legacyKeys.reduce<string[]>((accumulator, key) => {
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

  const writeList = (list: string[]) => {
    const unique = Array.from(new Set(list));
    window.localStorage.setItem(storageKey, JSON.stringify(unique));
    window.dispatchEvent(
      new CustomEvent(eventName, {
        detail: { type: compareType, ids: unique },
      }),
    );
  };

  const applyMarkedState = (marked: boolean) => {
    card.dataset.marked = marked ? 'true' : 'false';
    if (toggleWrapper) {
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
    const detail = 'detail' in event ? (event as CustomEvent).detail : undefined;
    if (!detail || typeof detail !== 'object') return;
    if (detail.type && detail.type !== compareType) return;
    syncFromStorage();
  });

  syncFromStorage();
}
