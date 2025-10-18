import { getCollection, type CollectionEntry } from "astro:content";

import {
  getCompareComponentDefinition,
  type CompareComponentDefinition,
} from "@/lib/component-registry";
import { getBasePath } from "@/lib/paths";
import {
  getCompareModule,
  type CompareModule,
  type CompareModuleId,
  type RegisteredCompareModule,
} from "@/components/compare/registry";

export type LoadedComparePage<Module extends RegisteredCompareModule> = {
  id: Module["id"];
  definition: CompareComponentDefinition & { id: Module["id"] };
  module: Module;
  items: Module extends CompareModule<any, any, infer ItemType, any>
    ? ItemType[]
    : never;
  basePath: string;
  breadcrumb: {
    label: string;
    href: string;
  };
  page: Module["page"];
};

export async function loadComparePage<Id extends CompareModuleId>(id: Id) {
  const definition = getCompareComponentDefinition(id);
  const module = getCompareModule(id);

  type ModuleType = typeof module;
  type Context = ModuleType extends CompareModule<any, any, any, infer ContextType>
    ? ContextType
    : never;
  type Item = ModuleType extends CompareModule<any, any, infer ItemType, any>
    ? ItemType
    : never;

  const entries = await getCollection(module.collectionKey);

  const context = (module.loadContext
    ? await module.loadContext()
    : undefined) as Context;

  const rawItems = await Promise.all(
    (entries as CollectionEntry<ModuleType["collectionKey"]>[]).map((entry) =>
      module.transformEntry(entry, context),
    ),
  );

  const items = rawItems.filter((value): value is Item => value != null);

  const sorted = module.sortItems ? module.sortItems(items) : items;
  const basePath = getBasePath();
  const breadcrumbLabel = module.page.breadcrumbLabel ?? definition.navigation.label;

  return {
    id,
    definition: definition as CompareComponentDefinition & { id: Id },
    module,
    items: sorted as Item[],
    basePath,
    breadcrumb: {
      label: breadcrumbLabel,
      href: definition.navigation.primaryRoute,
    },
    page: module.page,
  } as LoadedComparePage<ModuleType>;
}
