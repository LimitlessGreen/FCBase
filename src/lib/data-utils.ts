/**
 * Data utility functions for FCBase
 * 
 * Provides helpers for:
 * - Sensor data fetching and deduplication
 * - Manufacturer name extraction
 * - Formatting utilities
 * - Common data transformations
 */

import type { CollectionEntry } from 'astro:content';
import { getSensorsMap } from '@/lib/content-cache';

/**
 * Sensor with enriched name data
 */
export interface SensorWithName {
  id: string;
  name: string;
  instances?: number;
}

/**
 * Sensors organized by category
 */
export interface SensorsByCategory {
  imu: SensorWithName[];
  barometer: SensorWithName[];
  magnetometer: SensorWithName[];
}

/**
 * Extract unique sensor IDs from revision variants
 * Deduplicates across all hardware revisions
 * 
 * @param variants - Array of hardware revision variants
 * @returns Set of unique sensor IDs
 */
export function extractUniqueSensorIds(
  variants: Array<{
    spec: {
      sensors?: {
        imu?: Array<{ id: string }>;
        barometer?: Array<{ id: string }>;
        magnetometer?: Array<{ id: string }>;
      };
    };
  }>
): Set<string> {
  const uniqueIds = new Set<string>();
  
  for (const variant of variants) {
    const sensors = variant.spec.sensors;
    if (!sensors) continue;
    
    (['imu', 'barometer', 'magnetometer'] as const).forEach((category) => {
      sensors[category]?.forEach((sensor) => uniqueIds.add(sensor.id));
    });
  }
  
  return uniqueIds;
}

/**
 * Fetch sensor names for a set of sensor IDs
 * Creates a Map for efficient lookups
 * 
 * @param sensorIds - Set or array of sensor IDs
 * @returns Map of sensor ID to display name
 */
export async function fetchSensorNameMap(
  sensorIds: Set<string> | string[]
): Promise<Map<string, string>> {
  const ids = Array.isArray(sensorIds) ? sensorIds : Array.from(sensorIds);
  const sensorsMap = await getSensorsMap();

  return ids.reduce((map, sensorId) => {
    const entry = sensorsMap.get(sensorId);
    const name = entry?.data.title || entry?.data.name || sensorId;
    map.set(sensorId, name);
    return map;
  }, new Map<string, string>());
}

/**
 * Enrich sensor objects with display names
 * 
 * @param sensors - Array of sensor objects with IDs
 * @param nameMap - Map of sensor ID to display name
 * @returns Array of sensors with names
 */
export function mapSensorsWithNames<T extends { id: string }>(
  sensors: T[] | undefined,
  nameMap: Map<string, string>
): (T & { name: string })[] {
  if (!sensors) return [];
  
  return sensors.map((sensor) => ({
    ...sensor,
    name: nameMap.get(sensor.id) ?? sensor.id,
  }));
}

/**
 * Get manufacturer display name from entry
 * Handles both name and title fields
 * 
 * @param manufacturer - Manufacturer collection entry
 * @param fallback - Fallback string if entry is null
 * @returns Display name
 */
export function getManufacturerName(
  manufacturer: CollectionEntry<'manufacturers'> | null,
  fallback: string
): string {
  if (!manufacturer) return fallback;
  
  return (
    manufacturer.data.name ??
    (manufacturer.data as { title?: string })?.title ??
    fallback
  );
}

/**
 * Format mounting type to display string
 */
export const mountingDisplay: Record<string, string> = {
  '20x20': '20×20mm',
  '25.5x25.5': '25.5×25.5mm',
  '30.5x30.5': '30.5×30.5mm',
  '35x35': '35×35mm',
  'cube': 'Cube Carrier Board',
  'wing': 'Wing Form Factor',
  'custom': 'Custom',
};

/**
 * Get formatted mounting display string
 */
export function formatMounting(mounting: string): string {
  return mountingDisplay[mounting] ?? mounting;
}

/**
 * Format voltage range for display
 * Handles min/max/nominal values and cell counts
 */
export function formatVoltageRange(voltage?: {
  min?: number;
  max?: number;
  nominal?: number;
  unit?: string;
  notes?: string;
  cells?: { min?: number; max?: number };
}): string | null {
  if (!voltage) return null;
  
  const unit = voltage.unit ?? 'V';
  const parts: string[] = [];

  if (typeof voltage.min === 'number' && typeof voltage.max === 'number') {
    parts.push(`${voltage.min}–${voltage.max} ${unit}`);
  } else if (typeof voltage.min === 'number') {
    parts.push(`≥${voltage.min} ${unit}`);
  } else if (typeof voltage.max === 'number') {
    parts.push(`≤${voltage.max} ${unit}`);
  } else if (typeof voltage.nominal === 'number') {
    parts.push(`${voltage.nominal} ${unit}`);
  }

  if (voltage.cells && (voltage.cells.min || voltage.cells.max)) {
    if (
      typeof voltage.cells.min === 'number' &&
      typeof voltage.cells.max === 'number' &&
      voltage.cells.min !== voltage.cells.max
    ) {
      parts.push(`${voltage.cells.min}–${voltage.cells.max}S`);
    } else if (typeof voltage.cells.min === 'number') {
      parts.push(`${voltage.cells.min}S`);
    } else if (typeof voltage.cells.max === 'number') {
      parts.push(`${voltage.cells.max}S`);
    }
  }

  const baseDescription = parts.join(' / ');
  
  if (voltage.notes) {
    return baseDescription ? `${baseDescription} (${voltage.notes})` : voltage.notes;
  }

  return baseDescription || null;
}

/**
 * Format current specifications for display
 */
export function formatCurrent(current?: {
  max?: number;
  continuous?: number;
  unit?: string;
}): string | null {
  if (!current) return null;
  
  const unit = current.unit ?? 'A';
  
  if (typeof current.continuous === 'number' && typeof current.max === 'number') {
    return `${current.continuous}${unit} continuous, ${current.max}${unit} peak`;
  } else if (typeof current.max === 'number') {
    return `${current.max}${unit} max`;
  } else if (typeof current.continuous === 'number') {
    return `${current.continuous}${unit}`;
  }
  
  return null;
}

/**
 * Format power type label
 */
export const powerTypeLabels: Record<string, string> = {
  power_module: 'Power Module',
  usb: 'USB',
  battery: 'Battery',
  regulator: 'Regulator',
  servo_rail: 'Servo Rail',
  other: 'Other',
};

/**
 * Get power type display label
 */
export function getPowerTypeLabel(type?: string): string | null {
  if (!type) return null;
  return powerTypeLabels[type] ?? type;
}

/**
 * Format peripheral type label (snake_case to Title Case)
 */
const PERIPHERAL_LABEL_SYNONYMS: Record<string, string> = {
  usb: 'USB',
  uart: 'UART',
  can: 'CAN',
  pwm: 'PWM',
  ppm: 'PPM',
  spi: 'SPI',
  i2c: 'I2C',
  i2s: 'I2S',
  mavlink: 'MAVLink',
  sbus: 'SBUS',
  sbus2: 'SBUS2',
  dsm: 'DSM',
  fport: 'FPort',
  crsf: 'CRSF',
  srxl2: 'SRXL2',
  dshot: 'DShot',
  smbus: 'SMBus',
  esc: 'ESC',
  rc: 'RC',
  led: 'LED',
  leds: 'LEDs',
  gps: 'GPS',
  adc: 'ADC',
  jtag: 'JTAG',
  uavcan: 'UAVCAN',
  dronecan: 'DroneCAN',
};

function canonicalizePeripheralLabel(label?: string): string {
  if (!label) return '';

  const sanitized = label
    .replace(/[_-]+/g, ' ')
    .replace(/\s*\/\s*/g, ' / ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!sanitized) return '';

  const lower = sanitized.toLowerCase();
  const fullMatch = PERIPHERAL_LABEL_SYNONYMS[lower];
  if (fullMatch) {
    return fullMatch;
  }

  const words = sanitized.split(' ').map((word) => {
    if (word === '/' || word === '&') {
      return word;
    }

    const normalized = word.toLowerCase();
    const synonym = PERIPHERAL_LABEL_SYNONYMS[normalized];
    if (synonym) {
      return synonym;
    }

    if (/^[a-z0-9]+$/.test(normalized) && /[0-9]/.test(normalized)) {
      return normalized.toUpperCase();
    }

    if (/^[a-z]+$/.test(normalized) && normalized.length <= 3) {
      return normalized.toUpperCase();
    }

    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  });

  return words
    .join(' ')
    .replace(/\s+\/\s+/g, ' / ')
    .replace(/\s+&\s+/g, ' & ')
    .trim();
}

export function formatPeripheralType(type: string): string {
  return canonicalizePeripheralLabel(type);
}

export function normalizePeripheralInterfaces(
  interfaces?: string[],
): { label: string; count: number }[] {
  if (!interfaces || interfaces.length === 0) {
    return [];
  }

  const seen = new Map<string, { label: string; count: number }>();

  for (const raw of interfaces) {
    const canonical = canonicalizePeripheralLabel(raw);
    if (!canonical) continue;

    const key = canonical.toLowerCase();
    const entry = seen.get(key);
    if (entry) {
      entry.count += 1;
    } else {
      seen.set(key, { label: canonical, count: 1 });
    }
  }

  return Array.from(seen.values());
}

/**
 * Format dimensions for display
 */
export function formatDimensions(dimensions: {
  width_mm: number;
  length_mm: number;
  height_mm?: number;
}): string {
  if (dimensions.height_mm) {
    return `${dimensions.width_mm} × ${dimensions.length_mm} × ${dimensions.height_mm} mm`;
  }
  return `${dimensions.width_mm} × ${dimensions.length_mm} mm`;
}

/**
 * Format weight for display
 */
export function formatWeight(weight_g?: number): string | null {
  if (typeof weight_g !== 'number') return null;
  return `${weight_g}g`;
}

/**
 * Format boolean values for UI display with checkmark/cross prefixes
 */
export function formatBoolean(
  value: boolean | null | undefined,
  options: { yesLabel?: string; noLabel?: string; includeSymbols?: boolean } = {}
): string {
  const {
    yesLabel = 'Yes',
    noLabel = 'No',
    includeSymbols = true,
  } = options;

  if (value === true) {
    return includeSymbols ? `✓ ${yesLabel}` : yesLabel;
  }

  if (value === false) {
    return includeSymbols ? `✗ ${noLabel}` : noLabel;
  }

  return '—';
}
