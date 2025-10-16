import type { ComponentRegistry } from '@/lib/components/registry';
import {
  componentMetadata,
  componentMetadataIds,
  type ComponentHomepageMetadata,
  type ComponentNavigationMetadata,
} from '@/lib/components/metadata';

type RegisteredMetadata = (typeof componentMetadata)[number];

let serverComponentRegistry: ComponentRegistry | undefined;

if (import.meta.env.SSR) {
  const module = await import('@/lib/components/registry');
  serverComponentRegistry = module.componentRegistry;
}

export const compareComponentDefinitions = componentMetadata.map((metadata) => {
  const serverDefinition = serverComponentRegistry?.[metadata.id as keyof ComponentRegistry];

  return {
    id: metadata.id,
    label: metadata.compare.label,
    menuLabel: metadata.compare.menuLabel,
    compareRoute: metadata.compare.compareRoute,
    storageKey: metadata.compare.storageKey,
    legacyStorageKeys: metadata.compare.legacyStorageKeys,
    navigation: metadata.navigation,
    homepage: metadata.homepage,
    integration: {
      imageResolver: serverDefinition?.images?.resolvePreviewImage,
      cardBuilders: serverDefinition?.cards,
    },
  };
}) as const satisfies ReadonlyArray<{
  id: RegisteredMetadata['id'];
  label: RegisteredMetadata['compare']['label'];
  menuLabel: RegisteredMetadata['compare']['menuLabel'];
  compareRoute: RegisteredMetadata['compare']['compareRoute'];
  storageKey: RegisteredMetadata['compare']['storageKey'];
  legacyStorageKeys?: RegisteredMetadata['compare']['legacyStorageKeys'];
  navigation: ComponentNavigationMetadata;
  homepage: ComponentHomepageMetadata;
  integration: {
    imageResolver?: ComponentRegistry[keyof ComponentRegistry]['images'] extends {
      resolvePreviewImage: infer Resolver;
    }
      ? Resolver
      : unknown;
    cardBuilders?: ComponentRegistry[keyof ComponentRegistry]['cards'];
  };
}>;

export type CompareComponentDefinition =
  (typeof compareComponentDefinitions)[number];

export type CompareComponentId = (typeof componentMetadata)[number]['id'];

const registry = compareComponentDefinitions.reduce<
  Partial<Record<CompareComponentId, CompareComponentDefinition>>
>((accumulator, definition) => {
  accumulator[definition.id] = definition;
  return accumulator;
}, {});

export const compareComponentRegistry =
  registry as {
    readonly [Definition in CompareComponentDefinition as Definition['id']]: Definition;
  };

export const compareComponentIds: readonly CompareComponentId[] =
  componentMetadataIds;

export function getCompareComponentDefinition(
  id: CompareComponentId,
): CompareComponentRegistry[CompareComponentId] {
  return compareComponentRegistry[id];
}

export function getComponentImageResolver(id: CompareComponentId) {
  if (!serverComponentRegistry) {
    throw new Error('getComponentImageResolver is only available on the server.');
  }

  return serverComponentRegistry[id]?.images?.resolvePreviewImage;
}
