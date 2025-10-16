import { defineCollection, z } from 'astro:content';

import {
  componentCollections,
  componentIds,
  componentCollectionKeys,
  componentRegistry,
} from './components';
import type { ComponentId } from './components';
import { knownIssueSchema } from './components/common';

export { componentCollections, componentCollectionKeys, componentIds, componentRegistry } from './components';
export {
  controllerComponent,
  buildRevisionVariants,
  mergeControllerRevision,
} from './components/controller';
export type {
  ControllerData,
  HardwareRevision,
  KnownIssue,
  RevisionVariant,
} from './components/controller';
export {
  transmitterComponent,
  transmitterSupportLevelEnum,
  transmitterSupportStatusEnum,
} from './components/transmitter';
export type { TransmitterData } from './components/transmitter';
export { knownIssueSchema } from './components/common';

// Manufacturers collection
const manufacturersCollection = defineCollection({
  type: 'data',
  schema: z.object({
    id: z.string(),
    name: z.string().optional(),
    title: z.string().optional(),
    website: z.string().url().optional(),
    country: z.string().optional(),
    description: z.string().optional(),
    sources: z.array(z.string()).optional(),
  }),
});

// MCU collection
const numericRange = z.tuple([z.number(), z.number()]);

const mcuPeripheralSchema = z.object({
  type: z.enum([
    'uart',
    'spi',
    'i2c',
    'can',
    'usb',
    'ethernet',
    'adc',
    'dac',
    'timer',
    'sdmmc',
    'qspi',
    'other',
  ]),
  count: z.number().int().min(0).optional(),
  notes: z.string().optional(),
});

const mcuCollection = defineCollection({
  type: 'data',
  schema: z.object({
    id: z.string(),
    name: z.string(),
    manufacturer: z.string(),
    family: z.string().optional(),
    architecture: z.string(),
    core: z.string(),
    process_nm: z.number().optional(),
    max_frequency_mhz: z.number(),
    flash_kb: z.number(),
    ram_kb: z.number(),
    supply_voltage_v: numericRange.optional(),
    operating_temperature_c: numericRange.optional(),
    package: z.array(z.string()).optional(),
    features: z.array(z.string()).optional(),
    peripherals: z.array(mcuPeripheralSchema).optional(),
    memory: z
      .object({
        sram_kb: z.number().optional(),
        itcm_kb: z.number().optional(),
        dtcm_kb: z.number().optional(),
        backup_sram_kb: z.number().optional(),
        notes: z.string().optional(),
      })
      .optional(),
    datasheet: z.object({
      title: z.string(),
      url: z.string().url(),
      publisher: z.string().optional(),
      revision: z.string().optional(),
      year: z.number().optional(),
      retrieved: z.string().optional(),
      language: z.string().optional(),
    }),
    application_notes: z
      .array(
        z.object({
          title: z.string(),
          url: z.string().url(),
          publisher: z.string().optional(),
          notes: z.string().optional(),
        }),
      )
      .optional(),
    sources: z.array(z.string()).min(1),
    notes: z.string().optional(),
  }),
});

// Sensors collection
const sensorsCollection = defineCollection({
  type: 'data',
  schema: z.object({
    id: z.string(),
    name: z.string().optional(),
    title: z.string().optional(),
    type: z.enum(['imu', 'barometer', 'magnetometer']).optional(),
    manufacturer: z.string().optional(),
    interface: z.union([z.string(), z.array(z.string())]).optional(),
    axes: z.number().int().min(1).optional(),
    description: z.string().optional(),
    package: z.string().optional(),
    features: z.array(z.string()).optional(),
    datasheet: z.object({
      title: z.string(),
      publisher: z.string().optional(),
      year: z.number().optional(),
      url: z.string().url(),
      retrieved: z.string().optional(),
      language: z.string().optional(),
    }).optional(),
    specs: z.object({
      supply_voltage_v: numericRange.optional(),
      temperature_range_c: numericRange.optional(),
      package_mm: z.tuple([z.number(), z.number(), z.number()]).optional(),
      fifo_bytes: z.number().int().optional(),
      interface_max_speed_mhz: z.number().optional(),
      current_consumption_ma: z.object({
        normal: z.number().optional(),
        low_power: z.number().optional(),
        standby: z.number().optional(),
      }).optional(),
      accelerometer: z.object({
        range_g: numericRange.optional(),
        noise_mg_sqrtHz: z.number().optional(),
        max_odr_hz: z.number().optional(),
        sensitivity_mg_lsb: z.number().optional(),
      }).optional(),
      gyroscope: z.object({
        range_dps: numericRange.optional(),
        noise_mdps_sqrtHz: z.number().optional(),
        max_odr_hz: z.number().optional(),
        sensitivity_mdps_lsb: z.number().optional(),
      }).optional(),
      magnetometer: z.object({
        range_uT: numericRange.optional(),
        sensitivity_uT_lsb: z.number().optional(),
        max_odr_hz: z.number().optional(),
        noise_nT_rms: z.number().optional(),
      }).optional(),
      barometer: z.object({
        pressure_range_hpa: numericRange.optional(),
        relative_accuracy_pa: z.number().optional(),
        absolute_accuracy_pa: z.number().optional(),
        noise_pa_rms: z.number().optional(),
      }).optional(),
    }).optional(),
    sources: z.array(z.string()).optional(),
    notes: z.string().optional(),
    known_issues: z.array(knownIssueSchema).optional(),
  }),
});

// Sources collection
const sourcesCollection = defineCollection({
  type: 'data',
  schema: z.object({
    id: z.string(),
    title: z.string(),
    publisher: z.string().optional(),
    author: z.string().optional(),
    url: z.string().url(),
    date: z.string().optional(),
    year: z.number().optional(),
    retrieved: z.string().optional(),
    language: z.string().optional(),
    notes: z.string().optional(),
  }),
});

// Firmware collection (category derived from component registry)
const firmwareCategoryEnum = z.enum(componentIds as [ComponentId, ...ComponentId[]]);

const firmwareCollection = defineCollection({
  type: 'data',
  schema: z.object({
    id: z.string(),
    category: firmwareCategoryEnum,
    title: z.string().optional(),
    name: z.string().optional(),
    website: z.string().url().optional(),
    description: z.string().optional(),
    maintainer: z.string().optional(),
    license: z.string().optional(),
    supported_vehicle_types: z.array(z.string()).optional(),
    sources: z.array(z.string()).optional(),
  }),
});

export const collections = {
  ...componentCollections,
  manufacturers: manufacturersCollection,
  mcu: mcuCollection,
  sensors: sensorsCollection,
  sources: sourcesCollection,
  firmware: firmwareCollection,
};
