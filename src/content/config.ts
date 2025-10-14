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

// Shared power schemas
const voltageRangeSchema = z
  .object({
    min: z.number().optional(),
    max: z.number().optional(),
    nominal: z.number().optional(),
    cells: z
      .object({
        min: z.number().int().min(1).optional(),
        max: z.number().int().min(1).optional(),
      })
      .refine(
        (value) => value.min !== undefined || value.max !== undefined,
        {
          message: 'cells must include a min or max value',
        }
      )
      .optional(),
    unit: z.literal('V').optional(),
    notes: z.string().optional(),
  })
  .refine(
    (value) =>
      value.min !== undefined ||
      value.max !== undefined ||
      value.nominal !== undefined ||
      value.cells !== undefined ||
      !!value.notes,
    {
      message: 'voltage range requires at least one value or note',
    }
  );

const currentSpecSchema = z
  .object({
    continuous: z.number().optional(),
    peak: z.number().optional(),
    max: z.number().optional(),
    unit: z.literal('A').optional(),
    notes: z.string().optional(),
  })
  .refine(
    (value) =>
      value.continuous !== undefined ||
      value.peak !== undefined ||
      value.max !== undefined ||
      !!value.notes,
    {
      message: 'current specification requires a value or note',
    }
  );

const powerInputSchema = z
  .object({
    name: z.string(),
    type: z
      .enum(['power_module', 'usb', 'battery', 'regulator', 'servo_rail', 'other'])
      .optional(),
    connector: z.string().optional(),
    voltage: voltageRangeSchema.optional(),
    current: currentSpecSchema.optional(),
    notes: z.string().optional(),
  })
  .superRefine((value, ctx) => {
    if (!value.voltage && !value.notes) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'power inputs require voltage information or descriptive notes',
        path: ['voltage'],
      });
    }
  });

const peripheralSchema = z.object({
  name: z.string(),
  type: z.enum([
    'uart',
    'gps',
    'i2c',
    'spi',
    'can',
    'usb',
    'power',
    'pwm',
    'rc',
    'analog',
    'debug',
    'video',
    'led',
    'buzzer',
    'ethernet',
    'storage',
    'other',
  ]),
  count: z.number().int().min(1).optional(),
  interfaces: z
    .array(z.string().regex(/^[a-z0-9_\-]+$/))
    .min(1)
    .optional(),
  connector: z.string().optional(),
  voltage: z.string().optional(),
  notes: z.string().optional(),
});

const hardwareRevisionSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    name: z.string(),
    released: z
      .string()
      .regex(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/)
      .optional(),
    notes: z.string().optional(),
    changes: z.array(z.string()).min(1).optional(),
    sources: z.array(z.string()).min(1).optional(),
  })
  .refine(
    (value) =>
      value.notes !== undefined ||
      (value.changes !== undefined && value.changes.length > 0) ||
      value.released !== undefined,
    {
      message: 'hardware revisions should include a release date, notes, or change list',
    }
  );

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
    power: z
      .object({
        voltage_in: z.string().optional(),
        inputs: z.array(powerInputSchema).min(1).optional(),
        redundant: z.boolean().optional(),
        notes: z.string().optional(),
      })
      .superRefine((value, ctx) => {
        if (!value.voltage_in && (!value.inputs || value.inputs.length === 0)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'define either power.voltage_in or power.inputs',
            path: ['voltage_in'],
          });
        }
      }),
    io: z.object({
      uarts: z.number().int().min(0),
      can: z.number().int().min(0),
      pwm: z.number().int().min(0),
      ethernet: z.boolean().optional(),
      sd_card: z.boolean(),
      peripherals: z.array(peripheralSchema).optional(),
    }),
    hardware: z.object({
      openness: z.enum(['open', 'closed', 'mixed']),
      notes: z.string().optional(),
      revisions: z.array(hardwareRevisionSchema).min(1).optional(),
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

const numericRange = z.tuple([z.number(), z.number()]);

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
  'sources': sourcesCollection,
  'firmware': firmwareCollection,
};
