import {
  componentDefinitions,
  componentIds as registeredComponentIds,
  componentRegistry as registeredComponentRegistry,
  type ComponentId,
} from '@/lib/components/registry';

export type { ComponentId } from '@/lib/components/registry';

export const componentRegistry = registeredComponentRegistry;

export type ComponentRegistry = typeof componentRegistry;
export type ComponentCollectionKey =
  (typeof componentDefinitions)[number]['collectionKey'];

export const componentCollections = componentDefinitions.reduce(
  (accumulator, definition) => {
    accumulator[definition.collectionKey] = definition.collection;
    return accumulator;
  },
  {} as {
    [Key in ComponentCollectionKey]: ComponentRegistry[ComponentId]['collection'];
  },
);

export const componentIds = registeredComponentIds;

export const componentCollectionKeys = componentDefinitions.map(
  (definition) => definition.collectionKey,
) as ComponentCollectionKey[];

export function getComponentRegistration<Id extends ComponentId>(id: Id) {
  return componentRegistry[id];
}
