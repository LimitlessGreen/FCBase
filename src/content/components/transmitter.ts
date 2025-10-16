import { defineCollection, z } from 'astro:content';

import type { ComponentDefinition } from '@/lib/components/registry';
import { componentMetadataRegistry } from '@/lib/components/metadata';
import { resolveTransmitterPreviewImage } from '@/lib/transmitter-images';

import { componentImageSchema } from './common';
import { hardwareRevisionSchema } from './controller';

export const transmitterSupportLevelEnum = z.enum([
  'official',
  'manufacturer',
  'community',
]);

export const transmitterSupportStatusEnum = z.enum([
  'supported',
  'limited',
  'sunset',
  'planned',
]);

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

export const transmitterSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string(),
  brand: z.string(),
  images: z.array(componentImageSchema).optional(),
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

export const transmittersCollection = defineCollection({
  type: 'data',
  schema: transmitterSchema,
});

export type TransmitterData = z.infer<typeof transmitterSchema>;

const metadata = componentMetadataRegistry.transmitter;

export const transmitterComponent = {
  id: 'transmitter',
  collectionKey: 'transmitters',
  schema: transmitterSchema,
  collection: transmittersCollection,
  images: {
    resolvePreviewImage: resolveTransmitterPreviewImage,
  },
  compare: metadata.compare,
  navigation: metadata.navigation,
  homepage: metadata.homepage,
} as const satisfies ComponentDefinition<'transmitter', 'transmitters'>;
