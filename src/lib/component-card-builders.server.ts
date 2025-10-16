import type {
  CompareComponentDefinition,
  CompareComponentId,
} from '@/lib/component-registry';
import { getCompareComponentDefinition } from '@/lib/component-registry';

type CardBuildersFor<Id extends CompareComponentId> = Extract<
  CompareComponentDefinition,
  { id: Id }
>['integration']['cardBuilders'];

export type ControllerCardBuilders = NonNullable<CardBuildersFor<'controller'>>;

export type ComponentCardBuildersMap = {
  [Definition in CompareComponentDefinition as Definition['id']]: Definition['integration']['cardBuilders'];
};

export function getComponentCardBuilders<Id extends CompareComponentId>(
  id: Id,
) {
  const definition = getCompareComponentDefinition(id);
  return definition.integration.cardBuilders as CardBuildersFor<Id>;
}
