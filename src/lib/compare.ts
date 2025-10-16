import {
  getCompareComponentDefinition,
  type CompareComponentId,
} from './component-registry';

export type CompareType = CompareComponentId;

export const COMPARE_EVENT_NAME = 'fcbase:compare-change';

const legacyMigrationState = new Set<CompareType>();

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

const maybeMigrateLegacy = (type: CompareType) => {
  if (legacyMigrationState.has(type) || typeof window === 'undefined') {
    return;
  }

  legacyMigrationState.add(type);

  const definition = getCompareComponentDefinition(type);
  const legacyKeys = definition.legacyStorageKeys;

  if (!legacyKeys || legacyKeys.length === 0) {
    return;
  }

  const legacyValues = legacyKeys.reduce<string[]>((accumulator, key) => {
    const values = parseList(window.localStorage.getItem(key));
    if (values.length > 0) {
      accumulator.push(...values);
      window.localStorage.removeItem(key);
    }
    return accumulator;
  }, []);

  if (legacyValues.length === 0) {
    return;
  }

  const existing = getStorageItem(definition.storageKey);
  const merged = Array.from(new Set([...existing, ...legacyValues]));
  window.localStorage.setItem(definition.storageKey, JSON.stringify(merged));
};

export const getCompareStorageKey = (type: CompareType): string =>
  getCompareComponentDefinition(type).storageKey;

export const getCompareLegacyStorageKeys = (type: CompareType): string[] => {
  const definition = getCompareComponentDefinition(type);
  return definition.legacyStorageKeys ? [...definition.legacyStorageKeys] : [];
};

export interface CompareEventDetail {
  type: CompareType;
  ids: string[];
}

export const readCompareList = (type: CompareType): string[] => {
  if (typeof window === 'undefined') {
    return [];
  }

  maybeMigrateLegacy(type);

  const storageKey = getCompareStorageKey(type);
  return getStorageItem(storageKey);
};

export const writeCompareList = (type: CompareType, ids: string[]) => {
  if (typeof window === 'undefined') {
    return;
  }

  const unique = Array.from(new Set(ids));
  const storageKey = getCompareStorageKey(type);
  window.localStorage.setItem(storageKey, JSON.stringify(unique));
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

  const storageKey = getCompareStorageKey(type);
  window.localStorage.removeItem(storageKey);
  dispatchCompareEvent(type, []);
};
