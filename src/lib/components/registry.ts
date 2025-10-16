import { controllerComponent } from '@/content/components/controller';
import { transmitterComponent } from '@/content/components/transmitter';

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

export type ComponentCardBuilderHooks = {
  createModel: (...args: unknown[]) => unknown;
  createModels: (...args: unknown[]) => unknown;
};

export type ComponentDefinition<
  Id extends string = string,
  CollectionKey extends string = string,
  Schema = unknown,
  Collection = unknown,
  Helpers = Record<string, unknown> | undefined,
  CardBuilders = ComponentCardBuilderHooks | undefined,
  ImageResolver = ((...args: unknown[]) => unknown) | undefined,
> = {
  id: Id;
  collectionKey: CollectionKey;
  schema: Schema;
  collection: Collection;
  helpers?: Helpers;
  cards?: CardBuilders;
  images?: {
    resolvePreviewImage: ImageResolver;
  };
  compare: {
    label: string;
    menuLabel: string;
    compareRoute: string;
    storageKey: string;
    legacyStorageKeys?: readonly string[];
  };
  navigation: CompareComponentNavigationMetadata;
  homepage: CompareComponentHomepageMetadata;
};

export const componentDefinitions = [
  controllerComponent,
  transmitterComponent,
] as const satisfies readonly ComponentDefinition[];

export type RegisteredComponentDefinition =
  (typeof componentDefinitions)[number];

export type ComponentId = RegisteredComponentDefinition['id'];

export const componentIds = componentDefinitions.map(
  (definition) => definition.id,
) as ComponentId[];

export const componentRegistry = componentDefinitions.reduce(
  (accumulator, definition) => {
    accumulator[definition.id] = definition;
    return accumulator;
  },
  {} as {
    [Definition in RegisteredComponentDefinition as Definition['id']]: Definition;
  },
);

export type ComponentRegistry = typeof componentRegistry;
