import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock component-registry before importing compare
vi.mock('./component-registry', () => ({
  getCompareComponentDefinition: vi.fn((id: string) => {
    const definitions: Record<string, any> = {
      controller: {
        storageKey: 'fcbase:compare:controller',
        legacyStorageKeys: ['fcbase:compare'],
      },
      transmitter: {
        storageKey: 'fcbase:compare:transmitter',
        legacyStorageKeys: [],
      },
    };
    return definitions[id] ?? { storageKey: `fcbase:compare:${id}`, legacyStorageKeys: [] };
  }),
}));

import {
  COMPARE_EVENT_NAME,
  clearCompareList,
  dispatchCompareEvent,
  getCompareLegacyStorageKeys,
  getCompareStorageKey,
  readCompareList,
  writeCompareList,
} from './compare';

// ---------------------------------------------------------------------------
// localStorage mock
// ---------------------------------------------------------------------------
const storageStore = new Map<string, string>();

const localStorageMock = {
  getItem: vi.fn((key: string) => storageStore.get(key) ?? null),
  setItem: vi.fn((key: string, value: string) => storageStore.set(key, value)),
  removeItem: vi.fn((key: string) => storageStore.delete(key)),
  clear: vi.fn(() => storageStore.clear()),
  length: 0,
  key: vi.fn(() => null),
};

// ---------------------------------------------------------------------------
// window / CustomEvent mock
// ---------------------------------------------------------------------------
const dispatchedEvents: CustomEvent[] = [];

beforeEach(() => {
  storageStore.clear();
  dispatchedEvents.length = 0;

  vi.stubGlobal('window', {
    localStorage: localStorageMock,
    dispatchEvent: vi.fn((event: CustomEvent) => dispatchedEvents.push(event)),
    CustomEvent: class extends Event {
      detail: any;
      constructor(type: string, init?: CustomEventInit) {
        super(type);
        this.detail = init?.detail;
      }
    },
  });

  // Also stub CustomEvent at the global level
  vi.stubGlobal('CustomEvent', class extends Event {
    detail: any;
    constructor(type: string, init?: CustomEventInit) {
      super(type);
      this.detail = init?.detail;
    }
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// ---------------------------------------------------------------------------
// getCompareStorageKey
// ---------------------------------------------------------------------------
describe('getCompareStorageKey', () => {
  it('returns the correct storage key for controller', () => {
    expect(getCompareStorageKey('controller' as any)).toBe('fcbase:compare:controller');
  });
  it('returns the correct storage key for transmitter', () => {
    expect(getCompareStorageKey('transmitter' as any)).toBe('fcbase:compare:transmitter');
  });
});

// ---------------------------------------------------------------------------
// getCompareLegacyStorageKeys
// ---------------------------------------------------------------------------
describe('getCompareLegacyStorageKeys', () => {
  it('returns legacy keys for controller', () => {
    expect(getCompareLegacyStorageKeys('controller' as any)).toEqual(['fcbase:compare']);
  });
  it('returns empty array for transmitter', () => {
    expect(getCompareLegacyStorageKeys('transmitter' as any)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// writeCompareList + readCompareList
// ---------------------------------------------------------------------------
describe('writeCompareList', () => {
  it('writes ids to localStorage', () => {
    writeCompareList('controller' as any, ['a', 'b']);
    const stored = storageStore.get('fcbase:compare:controller');
    expect(JSON.parse(stored!)).toEqual(['a', 'b']);
  });

  it('deduplicates ids', () => {
    writeCompareList('controller' as any, ['a', 'b', 'a']);
    const stored = storageStore.get('fcbase:compare:controller');
    expect(JSON.parse(stored!)).toEqual(['a', 'b']);
  });

  it('dispatches a compare event', () => {
    writeCompareList('controller' as any, ['x']);
    expect(dispatchedEvents.length).toBeGreaterThanOrEqual(1);
    const event = dispatchedEvents.find((e) => e.type === COMPARE_EVENT_NAME);
    expect(event).toBeDefined();
  });
});

describe('readCompareList', () => {
  it('returns empty array when nothing stored', () => {
    expect(readCompareList('transmitter' as any)).toEqual([]);
  });

  it('reads previously written ids', () => {
    storageStore.set('fcbase:compare:transmitter', JSON.stringify(['t1', 't2']));
    expect(readCompareList('transmitter' as any)).toEqual(['t1', 't2']);
  });

  it('returns empty array for invalid JSON', () => {
    storageStore.set('fcbase:compare:transmitter', 'not-json');
    expect(readCompareList('transmitter' as any)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// clearCompareList
// ---------------------------------------------------------------------------
describe('clearCompareList', () => {
  it('removes stored data and dispatches empty event', () => {
    storageStore.set('fcbase:compare:controller', JSON.stringify(['a']));
    clearCompareList('controller' as any);
    expect(storageStore.has('fcbase:compare:controller')).toBe(false);
    const event = dispatchedEvents.find((e) => e.type === COMPARE_EVENT_NAME);
    expect(event).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// dispatchCompareEvent
// ---------------------------------------------------------------------------
describe('dispatchCompareEvent', () => {
  it('dispatches custom event with type and ids', () => {
    dispatchCompareEvent('controller' as any, ['a', 'b']);
    expect(dispatchedEvents.length).toBe(1);
    expect(dispatchedEvents[0].type).toBe(COMPARE_EVENT_NAME);
    expect(dispatchedEvents[0].detail).toEqual({ type: 'controller', ids: ['a', 'b'] });
  });
});
