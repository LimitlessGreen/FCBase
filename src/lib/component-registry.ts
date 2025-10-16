export type CompareComponentNavigationMetadata = {
  /** Short label used for the site navigation. */
  label: string;
  /** Primary route for browsing this component category. */
  primaryRoute: string;
  /** CTA copy used in hero and category buttons. */
  ctaCopy: string;
};

export type CompareComponentHomepageMetadata = {
  /** Marketing title used on the homepage category grid. */
  title: string;
  /** Supporting copy for the homepage category grid. */
  description: string;
  /** CTA copy for the homepage category card. */
  ctaCopy: string;
};

import { createControllerCardModel, createControllerCardModels } from "@/lib/controller-card-model";
import { resolveControllerPreviewImage } from "@/lib/controller-images";
import { resolveTransmitterPreviewImage } from "@/lib/transmitter-images";

const componentIntegrations = {
  controller: {
    cardBuilders: {
      createModel: createControllerCardModel,
      createModels: createControllerCardModels,
    },
    imageResolver: resolveControllerPreviewImage,
  },
  transmitter: {
    imageResolver: resolveTransmitterPreviewImage,
  },
} as const;

export type ComponentIntegrations = typeof componentIntegrations;

export type ComponentIntegrationEntry<Id extends keyof ComponentIntegrations> =
  ComponentIntegrations[Id];

export type CompareComponentDefinition<Id extends keyof ComponentIntegrations = keyof ComponentIntegrations> = {
  id: Id;
  label: string;
  /** Label used when rendering navigation or action buttons. */
  menuLabel: string;
  /** Absolute route (from the site root) to the compare table page. */
  compareRoute: string;
  /** Local storage key that tracks selected IDs for this component type. */
  storageKey: string;
  /** Optional list of legacy storage keys that should be migrated. */
  legacyStorageKeys?: readonly string[];
  /** Metadata used to power global navigation and hero CTAs. */
  navigation: CompareComponentNavigationMetadata;
  /** Homepage presentation metadata for the category grid. */
  homepage: CompareComponentHomepageMetadata;
  /** Integration hooks for card builders, image resolvers, and more. */
  integration: ComponentIntegrationEntry<Id>;
};

export const compareComponentDefinitions = [
  {
    id: 'controller',
    label: 'Flight controllers',
    menuLabel: 'Compare FCs',
    compareRoute: '/controllers/compare',
    storageKey: 'fcbase:compare:controller',
    legacyStorageKeys: ['fcbase:compare'],
    navigation: {
      label: 'Controllers',
      primaryRoute: '/controllers',
      ctaCopy: 'Browse Controllers',
    },
    homepage: {
      title: 'Flight Controllers',
      description:
        'Browse verified boards, compare MCUs, and filter by firmware support.',
      ctaCopy: 'Browse flight controllers',
    },
    integration: componentIntegrations.controller,
  },
  {
    id: 'transmitter',
    label: 'Transmitters',
    menuLabel: 'Compare TXs',
    compareRoute: '/transmitters/compare',
    storageKey: 'fcbase:compare:transmitter',
    navigation: {
      label: 'Transmitters',
      primaryRoute: '/transmitters',
      ctaCopy: 'Browse Transmitters',
    },
    homepage: {
      title: 'Transmitters',
      description:
        'Explore EdgeTX radios, track support versions, and jump to FCC compliance records.',
      ctaCopy: 'Browse transmitters',
    },
    integration: componentIntegrations.transmitter,
  },
] as const satisfies ReadonlyArray<CompareComponentDefinition>;

export type CompareComponentId =
  (typeof compareComponentDefinitions)[number]['id'];

export type CompareComponentRegistry = {
  readonly [Definition in (typeof compareComponentDefinitions)[number] as Definition['id']]: Definition;
};

const registry = compareComponentDefinitions.reduce<
  Partial<Record<CompareComponentId, (typeof compareComponentDefinitions)[number]>>
>((accumulator, definition) => {
  accumulator[definition.id] = definition;
  return accumulator;
}, {});

export const compareComponentRegistry = registry as CompareComponentRegistry;

export const compareComponentIds: readonly CompareComponentId[] =
  compareComponentDefinitions.map((definition) => definition.id);

export function getCompareComponentDefinition(
  id: CompareComponentId,
): CompareComponentRegistry[CompareComponentId] {
  return compareComponentRegistry[id];
}

export function getComponentCardBuilders(
  id: 'controller',
): ComponentIntegrationEntry<'controller'>['cardBuilders'];
export function getComponentCardBuilders(
  id: 'transmitter',
): ComponentIntegrationEntry<'transmitter'>['cardBuilders'];
export function getComponentCardBuilders(
  id: CompareComponentId,
) {
  return componentIntegrations[id].cardBuilders;
}

export function getComponentImageResolver(
  id: 'controller',
): ComponentIntegrationEntry<'controller'>['imageResolver'];
export function getComponentImageResolver(
  id: 'transmitter',
): ComponentIntegrationEntry<'transmitter'>['imageResolver'];
export function getComponentImageResolver(id: CompareComponentId) {
  return componentIntegrations[id].imageResolver;
}
