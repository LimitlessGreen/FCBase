import type { CompareComponentId } from '@/lib/component-registry';
import {
  createControllerCardModel,
  createControllerCardModels,
} from '@/lib/controller-card-model';

export type ControllerCardBuilders = {
  createModel: typeof createControllerCardModel;
  createModels: typeof createControllerCardModels;
};

export type ComponentCardBuildersMap = {
  controller: ControllerCardBuilders;
};

type ComponentCardBuildersEntry<Id extends keyof ComponentCardBuildersMap> =
  ComponentCardBuildersMap[Id];

const controllerCardBuilders: ControllerCardBuilders = {
  createModel: createControllerCardModel,
  createModels: createControllerCardModels,
};

export function getComponentCardBuilders(
  id: 'controller',
): ComponentCardBuildersEntry<'controller'>;
export function getComponentCardBuilders(
  id: Exclude<CompareComponentId, 'controller'>,
): undefined;
export function getComponentCardBuilders(id: CompareComponentId) {
  if (id === 'controller') {
    return controllerCardBuilders;
  }

  return undefined;
}
