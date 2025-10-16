import { controllerComponent } from './controller';
import { transmitterComponent } from './transmitter';

export const componentRegistry = {
  controller: controllerComponent,
  transmitter: transmitterComponent,
} as const;

export type ComponentRegistry = typeof componentRegistry;
export type ComponentId = keyof ComponentRegistry;
export type ComponentCollectionKey = ComponentRegistry[ComponentId]['collectionKey'];

export const componentCollections: {
  [Key in ComponentCollectionKey]: ComponentRegistry[ComponentId]['collection'];
} = {
  [controllerComponent.collectionKey]: controllerComponent.collection,
  [transmitterComponent.collectionKey]: transmitterComponent.collection,
};

export const componentIds = Object.keys(componentRegistry) as ComponentId[];

export const componentCollectionKeys = Object.keys(componentCollections) as ComponentCollectionKey[];

export function getComponentRegistration<Id extends ComponentId>(id: Id) {
  return componentRegistry[id];
}
