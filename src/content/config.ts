import { defineCollection, z } from 'astro:content';

// Sensor schema (used in controllers)
const sensorSchema = z.object({
  id: z.string(),
  count: z.number().int().min(1).optional(),
  notes: z.string().optional(),
});

// Firmware support schema
const firmwareSchema = z.object({
  id: z.string(),
  status: z.enum(['beta', 'stable', 'deprecated', 'community']),
});

// Controllers collection schema
const controllersCollection = defineCollection({
  type: 'data',
  schema: z.object({
    id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    title: z.string(),
    brand: z.string(),
    mcu: z.string(),
    mounting: z.enum(['20x20', '25.5x25.5', '30.5x30.5', '35x35', 'cube', 'wing', 'custom']),
    dimensions: z.object({
      width_mm: z.number().optional(),
      length_mm: z.number().optional(),
      height_mm: z.number().optional(),
      weight_g: z.number().optional(),
    }).optional(),
    power: z.object({
      voltage_in: z.string(),
      redundant: z.boolean().optional(),
      notes: z.string().optional(),
    }),
    io: z.object({
      uarts: z.number().int().min(0),
      can: z.number().int().min(0),
      pwm: z.number().int().min(0),
      ethernet: z.boolean().optional(),
      sd_card: z.boolean(),
    }),
    hardware: z.object({
      openness: z.enum(['open', 'closed', 'mixed']),
      notes: z.string().optional(),
    }),
    sensors: z.object({
      imu: z.array(sensorSchema).optional(),
      barometer: z.array(sensorSchema).optional(),
      magnetometer: z.array(sensorSchema).optional(),
    }),
    features: z.array(z.string()).optional(),
    firmware_support: z.array(firmwareSchema).min(1),
    sources: z.array(z.string()).min(1),
    verification: z.object({
      level: z.enum(['unverified', 'community', 'reviewed']),
      last_updated: z.string(),
    }),
    keywords: z.array(z.string()),
    notes: z.string().optional(),
  }),
});

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
const mcuCollection = defineCollection({
  type: 'data',
  schema: z.object({
    id: z.string(),
    name: z.string().optional(),
    title: z.string().optional(),
    manufacturer: z.string().optional(),
    core: z.string().optional(),
    frequency_mhz: z.number().optional(),
    flash_kb: z.number().optional(),
    ram_kb: z.number().optional(),
    sources: z.array(z.string()).optional(),
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
    sources: z.array(z.string()).optional(),
  }),
});

// Firmware collection
const firmwareCollection = defineCollection({
  type: 'data',
  schema: z.object({
    id: z.string(),
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
  'controllers': controllersCollection,
  'manufacturers': manufacturersCollection,
  'mcu': mcuCollection,
  'sensors': sensorsCollection,
  'firmware': firmwareCollection,
};
