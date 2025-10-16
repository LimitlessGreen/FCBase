import { describe, expect, it, vi } from 'vitest';
import { formatBoolean } from './data-utils';

vi.mock('astro:content', () => ({
  getCollection: vi.fn(async () => []),
}));

vi.mock('@/lib/content-cache.server', () => ({
  getSensorsMap: vi.fn(async () => new Map()),
}));

describe('formatBoolean', () => {
  it('returns checkmark label for true', () => {
    expect(formatBoolean(true)).toBe('✓ Yes');
  });

  it('returns cross label for false', () => {
    expect(formatBoolean(false)).toBe('✗ No');
  });

  it('returns em dash for nullish values', () => {
    expect(formatBoolean(undefined)).toBe('—');
    expect(formatBoolean(null)).toBe('—');
  });

  it('supports custom labels and disabling symbols', () => {
    expect(
      formatBoolean(true, { yesLabel: 'Available', includeSymbols: false })
    ).toBe('Available');
    expect(
      formatBoolean(false, { noLabel: 'Unavailable', includeSymbols: false })
    ).toBe('Unavailable');
  });
});
