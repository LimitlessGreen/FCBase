import { describe, expect, it, vi } from 'vitest';
import {
  extractUniqueSensorIds,
  formatBoolean,
  formatCurrent,
  formatDimensions,
  formatMounting,
  formatPeripheralType,
  formatVoltageRange,
  formatWeight,
  getManufacturerName,
  getPowerTypeLabel,
  mapSensorsWithNames,
  normalizePeripheralInterfaces,
} from './data-utils';

vi.mock('astro:content', () => ({
  getCollection: vi.fn(async () => []),
}));

vi.mock('@/lib/content-cache.server', () => ({
  getSensorsMap: vi.fn(async () => new Map()),
}));

// ---------------------------------------------------------------------------
// formatBoolean
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// formatMounting
// ---------------------------------------------------------------------------
describe('formatMounting', () => {
  it('maps known mounting patterns', () => {
    expect(formatMounting('20x20')).toBe('20×20mm');
    expect(formatMounting('30.5x30.5')).toBe('30.5×30.5mm');
    expect(formatMounting('cube')).toBe('Cube Carrier Board');
    expect(formatMounting('wing')).toBe('Wing Form Factor');
  });
  it('returns raw value for unknown patterns', () => {
    expect(formatMounting('unknown-pattern')).toBe('unknown-pattern');
  });
});

// ---------------------------------------------------------------------------
// formatVoltageRange
// ---------------------------------------------------------------------------
describe('formatVoltageRange', () => {
  it('returns null for undefined input', () => {
    expect(formatVoltageRange(undefined)).toBeNull();
  });
  it('formats min–max range', () => {
    expect(formatVoltageRange({ min: 4.9, max: 5.5 })).toBe('4.9–5.5 V');
  });
  it('formats only min', () => {
    expect(formatVoltageRange({ min: 3.3 })).toBe('≥3.3 V');
  });
  it('formats only max', () => {
    expect(formatVoltageRange({ max: 5.0 })).toBe('≤5 V');
  });
  it('formats nominal', () => {
    expect(formatVoltageRange({ nominal: 5 })).toBe('5 V');
  });
  it('includes cell count', () => {
    expect(formatVoltageRange({ min: 7.4, max: 33.6, cells: { min: 2, max: 8 } }))
      .toBe('7.4–33.6 V / 2–8S');
  });
  it('handles single cell count', () => {
    expect(formatVoltageRange({ min: 7.4, max: 12.6, cells: { min: 3, max: 3 } }))
      .toBe('7.4–12.6 V / 3S');
  });
  it('appends notes', () => {
    expect(formatVoltageRange({ min: 4.9, max: 5.5, notes: 'regulated' }))
      .toBe('4.9–5.5 V (regulated)');
  });
  it('returns notes only when no voltage values', () => {
    expect(formatVoltageRange({ notes: 'powered via USB' })).toBe('powered via USB');
  });
  it('returns null for empty object', () => {
    expect(formatVoltageRange({})).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// formatCurrent
// ---------------------------------------------------------------------------
describe('formatCurrent', () => {
  it('returns null for undefined input', () => {
    expect(formatCurrent(undefined)).toBeNull();
  });
  it('formats continuous + max', () => {
    expect(formatCurrent({ continuous: 2, max: 5 })).toBe('2A continuous, 5A peak');
  });
  it('formats only max', () => {
    expect(formatCurrent({ max: 3 })).toBe('3A max');
  });
  it('formats only continuous', () => {
    expect(formatCurrent({ continuous: 2 })).toBe('2A');
  });
  it('returns null for empty object', () => {
    expect(formatCurrent({})).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// getPowerTypeLabel
// ---------------------------------------------------------------------------
describe('getPowerTypeLabel', () => {
  it('returns null for undefined', () => {
    expect(getPowerTypeLabel(undefined)).toBeNull();
  });
  it('maps known types', () => {
    expect(getPowerTypeLabel('power_module')).toBe('Power Module');
    expect(getPowerTypeLabel('usb')).toBe('USB');
    expect(getPowerTypeLabel('battery')).toBe('Battery');
    expect(getPowerTypeLabel('servo_rail')).toBe('Servo Rail');
  });
  it('returns raw value for unknown type', () => {
    expect(getPowerTypeLabel('solar')).toBe('solar');
  });
});

// ---------------------------------------------------------------------------
// formatPeripheralType + normalizePeripheralInterfaces
// ---------------------------------------------------------------------------
describe('formatPeripheralType', () => {
  it('maps acronyms', () => {
    expect(formatPeripheralType('uart')).toBe('UART');
    expect(formatPeripheralType('can')).toBe('CAN');
    expect(formatPeripheralType('usb')).toBe('USB');
    expect(formatPeripheralType('i2c')).toBe('I2C');
  });
  it('title-cases unknown types', () => {
    expect(formatPeripheralType('ethernet')).toBe('Ethernet');
  });
});

describe('normalizePeripheralInterfaces', () => {
  it('returns empty array for undefined', () => {
    expect(normalizePeripheralInterfaces(undefined)).toEqual([]);
  });
  it('deduplicates and counts', () => {
    const result = normalizePeripheralInterfaces(['uart', 'UART', 'spi']);
    expect(result).toEqual([
      { label: 'UART', count: 2 },
      { label: 'SPI', count: 1 },
    ]);
  });
});

// ---------------------------------------------------------------------------
// formatDimensions
// ---------------------------------------------------------------------------
describe('formatDimensions', () => {
  it('formats 2D dimensions', () => {
    expect(formatDimensions({ width_mm: 36, length_mm: 36 })).toBe('36 × 36 mm');
  });
  it('formats 3D dimensions', () => {
    expect(formatDimensions({ width_mm: 36, length_mm: 36, height_mm: 8 })).toBe('36 × 36 × 8 mm');
  });
});

// ---------------------------------------------------------------------------
// formatWeight
// ---------------------------------------------------------------------------
describe('formatWeight', () => {
  it('returns null for undefined', () => {
    expect(formatWeight(undefined)).toBeNull();
  });
  it('formats weight', () => {
    expect(formatWeight(12)).toBe('12g');
  });
});

// ---------------------------------------------------------------------------
// getManufacturerName
// ---------------------------------------------------------------------------
describe('getManufacturerName', () => {
  it('returns fallback when manufacturer is null', () => {
    expect(getManufacturerName(null, 'holybro')).toBe('holybro');
  });
  it('returns name from data.name', () => {
    const entry = { data: { name: 'Holybro' } } as any;
    expect(getManufacturerName(entry, 'default')).toBe('Holybro');
  });
  it('returns title if name is missing', () => {
    const entry = { data: { title: 'MatekSys' } } as any;
    expect(getManufacturerName(entry, 'default')).toBe('MatekSys');
  });
});

// ---------------------------------------------------------------------------
// extractUniqueSensorIds
// ---------------------------------------------------------------------------
describe('extractUniqueSensorIds', () => {
  it('returns empty set for empty variants', () => {
    expect(extractUniqueSensorIds([])).toEqual(new Set());
  });
  it('collects unique IDs across categories', () => {
    const variants = [
      {
        spec: {
          sensors: {
            imu: [{ id: 'icm42688p' }],
            barometer: [{ id: 'bmp388' }],
          },
        },
      },
      {
        spec: {
          sensors: {
            imu: [{ id: 'icm42688p' }, { id: 'bmi270' }],
          },
        },
      },
    ];
    const result = extractUniqueSensorIds(variants);
    expect(result).toEqual(new Set(['icm42688p', 'bmp388', 'bmi270']));
  });
  it('handles variants without sensors', () => {
    const variants = [{ spec: {} }];
    expect(extractUniqueSensorIds(variants)).toEqual(new Set());
  });
});

// ---------------------------------------------------------------------------
// mapSensorsWithNames
// ---------------------------------------------------------------------------
describe('mapSensorsWithNames', () => {
  it('returns empty array for undefined input', () => {
    expect(mapSensorsWithNames(undefined, new Map())).toEqual([]);
  });
  it('enriches sensors with names from map', () => {
    const sensors = [{ id: 'icm42688p' }, { id: 'bmp388' }];
    const nameMap = new Map([['icm42688p', 'ICM-42688-P']]);
    const result = mapSensorsWithNames(sensors, nameMap);
    expect(result).toEqual([
      { id: 'icm42688p', name: 'ICM-42688-P' },
      { id: 'bmp388', name: 'bmp388' },
    ]);
  });
});
