export type CompareType = 'controller' | 'transmitter';

export const COMPARE_EVENT_NAME = 'fcbase:compare-change';

const STORAGE_KEYS: Record<CompareType, string> = {
  controller: 'fcbase:compare:controller',
  transmitter: 'fcbase:compare:transmitter',
};

const LEGACY_STORAGE_KEY = 'fcbase:compare';
let legacyMigrated = false;

type NullableString = string | null | undefined;

const parseList = (raw: NullableString): string[] => {
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((value): value is string => typeof value === 'string');
  } catch {
    return [];
  }
};

const getStorageItem = (key: string): string[] => {
  if (typeof window === 'undefined') {
    return [];
  }

  return parseList(window.localStorage.getItem(key));
};

const maybeMigrateLegacy = () => {
  if (legacyMigrated || typeof window === 'undefined') {
    return;
  }

  legacyMigrated = true;
  const legacyList = parseList(window.localStorage.getItem(LEGACY_STORAGE_KEY));
  if (legacyList.length === 0) {
    return;
  }

  const existing = getStorageItem(STORAGE_KEYS.controller);
  const merged = Array.from(new Set([...existing, ...legacyList]));
  window.localStorage.setItem(STORAGE_KEYS.controller, JSON.stringify(merged));
  window.localStorage.removeItem(LEGACY_STORAGE_KEY);
};

export const getCompareStorageKey = (type: CompareType): string => STORAGE_KEYS[type];

export interface CompareEventDetail {
  type: CompareType;
  ids: string[];
}

export const readCompareList = (type: CompareType): string[] => {
  if (typeof window === 'undefined') {
    return [];
  }

  if (type === 'controller') {
    maybeMigrateLegacy();
  }

  return getStorageItem(STORAGE_KEYS[type]);
};

export const writeCompareList = (type: CompareType, ids: string[]) => {
  if (typeof window === 'undefined') {
    return;
  }

  const unique = Array.from(new Set(ids));
  window.localStorage.setItem(STORAGE_KEYS[type], JSON.stringify(unique));
  dispatchCompareEvent(type, unique);
};

export const dispatchCompareEvent = (type: CompareType, ids: string[]) => {
  if (typeof window === 'undefined') {
    return;
  }

  const detail: CompareEventDetail = { type, ids };
  window.dispatchEvent(new CustomEvent<CompareEventDetail>(COMPARE_EVENT_NAME, { detail }));
};

export const clearCompareList = (type: CompareType) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEYS[type]);
  dispatchCompareEvent(type, []);
};
