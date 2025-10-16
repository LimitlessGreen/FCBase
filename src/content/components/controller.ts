import { defineCollection, z } from 'astro:content';

import { componentImageSchema, knownIssueSchema } from './common';

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
        },
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
    },
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
    },
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
    },
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
    },
  );

export const controllerSchema = z.object({
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
  images: z.array(componentImageSchema).optional(),
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

export const controllersCollection = defineCollection({
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
  list?: NonNullable<ControllerSensors[keyof ControllerSensors]>,
) => list?.map((sensor) => ({ ...sensor }));

const mergeSensors = (
  base: ControllerSensors,
  override?: RevisionOverrides['sensors'],
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
  override?: z.infer<typeof ioOverrideSchema>,
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
  override?: z.infer<typeof powerOverrideSchema>,
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
  revision: HardwareRevision,
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
  controller: ControllerData,
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

export const controllerComponent = {
  id: 'controller',
  collectionKey: 'controllers',
  schema: controllerSchema,
  collection: controllersCollection,
  helpers: {
    buildRevisionVariants,
    mergeControllerRevision,
  },
} as const;
