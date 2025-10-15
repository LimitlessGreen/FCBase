import { defineCollection, z } from 'astro:content';

// Sensor schema (used in controllers)
const sensorSchema = z.object({
  id: z.string(),
  count: z.number().int().min(1).optional(),
  notes: z.string().optional(),
});

const sensorsSpecSchema = z.object({
  imu: z.array(sensorSchema).optional(),
  barometer: z.array(sensorSchema).optional(),
  magnetometer: z.array(sensorSchema).optional(),
});

// Firmware support schema
const firmwareSchema = z.object({
  id: z.string(),
  status: z.enum(['beta', 'stable', 'deprecated', 'community']),
});

const linkFieldSchema = z.union([
  z.string().url(),
  z.object({
    url: z.string().url(),
    label: z.string().optional(),
    description: z.string().optional(),
  }),
]);

const linksSchema = z
  .object({
    docs: linkFieldSchema.optional(),
    pinout: linkFieldSchema.optional(),
    vendor: linkFieldSchema.optional(),
    github: linkFieldSchema.optional(),
  })
  .strict();

const knownIssueSchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  severity: z.enum(['info', 'low', 'medium', 'high', 'critical']),
  date: z
    .string()
    .regex(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/),
  source: z.string(),
  url: z.string().url().optional(),
  description: z.string().optional(),
});

const controllerImageSchema = z.object({
  id: z.string().optional(),
  type: z.enum(['hero', 'gallery', 'detail']).optional(),
  alt: z.string(),
  credit: z.string().optional(),
  source_url: z.string().url().optional(),
  src: z.string().min(1).optional(),
  url: z.string().url().optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
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

const powerSchemaBase = z.object({
  voltage_in: z.string().optional(),
  inputs: z.array(powerInputSchema).min(1).optional(),
  redundant: z.boolean().optional(),
  notes: z.string().optional(),
});

const powerSchema = powerSchemaBase.superRefine((value, ctx) => {
  if (!value.voltage_in && (!value.inputs || value.inputs.length === 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'define either power.voltage_in or power.inputs',
      path: ['voltage_in'],
    });
  }
});

const powerOverrideSchema = powerSchemaBase;

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

const peripheralPortSchema = z.object({
  port: z.string(),
  type: z.enum([
    'uart',
    'i2c',
    'can',
    'power',
    'usb',
    'ethernet',
    'pwm',
    'spi',
    'rc',
    'gps',
    'analog',
    'debug',
    'other',
  ]),
  default_use: z.string().optional(),
  voltage: z.string().optional(),
  connector: z.string().optional(),
  notes: z.string().optional(),
});

const ioSchemaBase = z.object({
  uarts: z.number().int().min(0),
  can: z.number().int().min(0),
  pwm: z.number().int().min(0),
  ethernet: z.boolean().optional(),
  sd_card: z.boolean(),
  peripherals: z.array(peripheralSchema).optional(),
});

const ioOverrideSchema = ioSchemaBase.partial();

const ioSchema = ioSchemaBase;

const hardwareRevisionOverridesSchema = z
  .object({
    sensors: sensorsSpecSchema.optional(),
    io: ioOverrideSchema.optional(),
    power: powerOverrideSchema.optional(),
    peripheral_ports: z.array(peripheralPortSchema).optional(),
  })
  .refine(
    (value) =>
      value.sensors !== undefined ||
      value.io !== undefined ||
      value.power !== undefined ||
      value.peripheral_ports !== undefined,
    {
      message: 'hardware revision overrides must include at least one section',
    }
  );

export const hardwareRevisionSchema = z
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
    overrides: hardwareRevisionOverridesSchema.optional(),
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
const controllerSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string(),
  brand: z.string(),
  mcu: z.string(),
  mounting: z.enum(['20x20', '25.5x25.5', '30.5x30.5', '35x35', 'cube', 'wing', 'custom']),
  dimensions: z
    .object({
      width_mm: z.number().optional(),
      length_mm: z.number().optional(),
      height_mm: z.number().optional(),
      weight_g: z.number().optional(),
    })
    .optional(),
  images: z.array(controllerImageSchema).optional(),
  power: powerSchema,
  io: ioSchema,
  peripheral_ports: z.array(peripheralPortSchema).optional(),
  hardware: z.object({
    openness: z.enum(['open', 'closed', 'mixed']),
    notes: z.string().optional(),
    revisions: z.array(hardwareRevisionSchema).min(1).optional(),
  }),
  seo: z
    .object({
      summary: z.string().optional(),
    })
    .optional(),
  sensors: sensorsSpecSchema,
  features: z.array(z.string()).optional(),
  firmware_support: z.array(firmwareSchema).min(1),
  known_issues: z.array(knownIssueSchema).optional(),
  links: linksSchema.optional(),
  sources: z.array(z.string()).min(1),
  verification: z.object({
    level: z.enum(['unverified', 'community', 'reviewed']),
    last_updated: z.string(),
  }),
  keywords: z.array(z.string()),
  notes: z.string().optional(),
});

const controllersCollection = defineCollection({
  type: 'data',
  schema: controllerSchema,
});

export type ControllerData = z.infer<typeof controllerSchema>;
export type HardwareRevision = z.infer<typeof hardwareRevisionSchema>;
export type KnownIssue = z.infer<typeof knownIssueSchema>;
type RevisionOverrides = z.infer<typeof hardwareRevisionOverridesSchema>;
type ControllerSensors = ControllerData['sensors'];
type ControllerIo = ControllerData['io'];
type ControllerPower = ControllerData['power'];
type ControllerPeripheralPorts = ControllerData['peripheral_ports'];

const cloneSensorList = (
  list?: NonNullable<ControllerSensors[keyof ControllerSensors]>
) => list?.map((sensor) => ({ ...sensor }));

const mergeSensors = (
  base: ControllerSensors,
  override?: RevisionOverrides['sensors']
): ControllerSensors => {
  const merged: ControllerSensors = {};
  (['imu', 'barometer', 'magnetometer'] as const).forEach((category) => {
    const overrideList = override?.[category];
    if (overrideList !== undefined) {
      merged[category] = cloneSensorList(overrideList) ?? [];
      return;
    }

    const baseList = base?.[category];
    if (baseList !== undefined) {
      merged[category] = cloneSensorList(baseList);
    }
  });

  return merged;
};

const clonePeripherals = (peripherals?: ControllerIo['peripherals']) =>
  peripherals?.map((peripheral) => ({
    ...peripheral,
    interfaces: peripheral.interfaces ? [...peripheral.interfaces] : undefined,
  }));

const clonePeripheralPorts = (ports?: ControllerPeripheralPorts) =>
  ports?.map((port) => ({ ...port }));

const mergeIo = (
  base: ControllerIo,
  override?: z.infer<typeof ioOverrideSchema>
): ControllerIo => {
  const merged: ControllerIo = {
    ...base,
    peripherals: clonePeripherals(base.peripherals),
  };

  if (!override) {
    return merged;
  }

  if (override.uarts !== undefined) merged.uarts = override.uarts;
  if (override.can !== undefined) merged.can = override.can;
  if (override.pwm !== undefined) merged.pwm = override.pwm;
  if (override.ethernet !== undefined) merged.ethernet = override.ethernet;
  if (override.sd_card !== undefined) merged.sd_card = override.sd_card;
  if (override.peripherals !== undefined) {
    merged.peripherals = clonePeripherals(override.peripherals) ?? [];
  }

  return merged;
};

const cloneVoltage = (voltage?: z.infer<typeof voltageRangeSchema>) =>
  voltage
    ? {
        ...voltage,
        cells: voltage.cells ? { ...voltage.cells } : undefined,
      }
    : undefined;

const cloneCurrent = (current?: z.infer<typeof currentSpecSchema>) =>
  current ? { ...current } : undefined;

const clonePowerInputs = (inputs?: ControllerPower['inputs']) =>
  inputs?.map((input) => ({
    ...input,
    voltage: cloneVoltage(input.voltage),
    current: cloneCurrent(input.current),
  }));

const mergePower = (
  base: ControllerPower,
  override?: z.infer<typeof powerOverrideSchema>
): ControllerPower => {
  const merged: ControllerPower = {
    ...base,
    inputs: clonePowerInputs(base.inputs),
  };

  if (!override) {
    return merged;
  }

  if (override.voltage_in !== undefined) merged.voltage_in = override.voltage_in;
  if (override.inputs !== undefined) merged.inputs = clonePowerInputs(override.inputs) ?? [];
  if (override.redundant !== undefined) merged.redundant = override.redundant;
  if (override.notes !== undefined) merged.notes = override.notes;

  return merged;
};

const cloneRevision = (revision: HardwareRevision): HardwareRevision => ({
  ...revision,
  changes: revision.changes ? [...revision.changes] : undefined,
  sources: revision.sources ? [...revision.sources] : undefined,
  overrides: revision.overrides
    ? {
        ...revision.overrides,
        sensors: revision.overrides.sensors
          ? mergeSensors({} as ControllerSensors, revision.overrides.sensors)
          : undefined,
        io: revision.overrides.io
          ? {
              ...revision.overrides.io,
              peripherals: clonePeripherals(revision.overrides.io.peripherals),
            }
          : undefined,
        power: revision.overrides.power
          ? {
              ...revision.overrides.power,
              inputs: clonePowerInputs(revision.overrides.power.inputs),
            }
          : undefined,
        peripheral_ports: revision.overrides.peripheral_ports
          ? clonePeripheralPorts(revision.overrides.peripheral_ports)
          : undefined,
      }
    : undefined,
});

export type RevisionVariant = {
  id: string;
  label: string;
  spec: ControllerData;
  revision?: HardwareRevision;
  isBase: boolean;
};

export const mergeControllerRevision = (
  controller: ControllerData,
  revision: HardwareRevision
): ControllerData => {
  const overrides = revision.overrides;
  const merged: ControllerData = {
    ...controller,
    power: mergePower(controller.power, overrides?.power),
    io: mergeIo(controller.io, overrides?.io),
    sensors: mergeSensors(controller.sensors, overrides?.sensors),
    peripheral_ports: clonePeripheralPorts(controller.peripheral_ports),
    hardware: {
      ...controller.hardware,
      revisions: controller.hardware.revisions?.map(cloneRevision),
    },
  };

  if (overrides?.peripheral_ports !== undefined) {
    merged.peripheral_ports = clonePeripheralPorts(overrides.peripheral_ports) ?? [];
  }

  return merged;
};

export const buildRevisionVariants = (
  controller: ControllerData
): RevisionVariant[] => {
  const baseVariant: RevisionVariant = {
    id: 'base',
    label: 'Base Hardware',
    spec: {
      ...controller,
      power: mergePower(controller.power),
      io: mergeIo(controller.io),
      sensors: mergeSensors(controller.sensors),
      peripheral_ports: clonePeripheralPorts(controller.peripheral_ports),
      hardware: {
        ...controller.hardware,
        revisions: controller.hardware.revisions?.map(cloneRevision),
      },
    },
    revision: undefined,
    isBase: true,
  };

  const revisionVariants = (controller.hardware.revisions ?? []).map((revision) => ({
    id: revision.id,
    label: revision.name,
    spec: mergeControllerRevision(controller, revision),
    revision,
    isBase: false,
  }));

  return [baseVariant, ...revisionVariants];
};

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
        })
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

const transmitterSupportLevelEnum = z.enum(['official', 'manufacturer', 'community']);
const transmitterSupportStatusEnum = z.enum(['supported', 'limited', 'sunset', 'planned']);

const complianceSchema = z.object({
  type: z.enum(['fcc']),
  id: z.string(),
  url: z.string().url(),
  notes: z.string().optional(),
});

const transmitterHardwareSchema = z
  .object({
    form_factor: z.enum(['handheld', 'tray', 'gamepad']).optional(),
    display: z.enum(['color', 'monochrome']).optional(),
    notes: z.string().optional(),
    revisions: z.array(hardwareRevisionSchema).optional(),
  })
  .optional();

const transmitterSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string(),
  brand: z.string(),
  support: z.object({
    level: transmitterSupportLevelEnum,
    since_version: z.string(),
    status: transmitterSupportStatusEnum,
    last_version: z.string().optional(),
    notes: z.string().optional(),
  }),
  hardware: transmitterHardwareSchema,
  features: z.array(z.string()).optional(),
  compliance: z.array(complianceSchema).optional(),
  sources: z.array(z.string()).min(1),
  keywords: z.array(z.string()),
  verification: z.object({
    level: z.enum(['unverified', 'community', 'reviewed']),
    last_updated: z.string(),
  }),
  notes: z.string().optional(),
});

const transmittersCollection = defineCollection({
  type: 'data',
  schema: transmitterSchema,
});

export const collections = {
  'controllers': controllersCollection,
  'transmitters': transmittersCollection,
  'manufacturers': manufacturersCollection,
  'mcu': mcuCollection,
  'sensors': sensorsCollection,
  'sources': sourcesCollection,
  'firmware': firmwareCollection,
};
