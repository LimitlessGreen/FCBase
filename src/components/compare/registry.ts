import type { CollectionEntry } from "astro:content";
import type { ComponentType } from "react";

import type { ComponentMetadataId } from "@/lib/components/metadata";

import { controllerCompareModule } from "./ControllerCompareTable";
import { transmitterCompareModule } from "./TransmitterCompareTable";

export type CompareModuleTransformResult<Item> =
  | Item
  | null
  | undefined
  | Promise<Item | null | undefined>;

export interface CompareModulePageMetadata {
  title: string;
  description: string;
  breadcrumbLabel?: string;
}

export interface CompareModule<
  Id extends ComponentMetadataId = ComponentMetadataId,
  CollectionKey extends string = string,
  Item = unknown,
  Context = undefined,
> {
  id: Id;
  collectionKey: CollectionKey;
  Table: ComponentType<{ items: Item[]; basePath: string }>;
  page: CompareModulePageMetadata;
  loadContext?: () => Promise<Context> | Context;
  transformEntry: (
    entry: CollectionEntry<CollectionKey>,
    context: Context,
  ) => CompareModuleTransformResult<Item>;
  sortItems?: (items: Item[]) => Item[];
}

const compareModules = [
  controllerCompareModule,
  transmitterCompareModule,
] as const;

export type RegisteredCompareModule = (typeof compareModules)[number];

export type CompareModuleId = RegisteredCompareModule["id"];

export type CompareModuleRegistry = {
  [Module in RegisteredCompareModule as Module["id"]]: Module;
};

export const compareModuleRegistry = compareModules.reduce(
  (accumulator, module) => {
    accumulator[module.id] = module;
    return accumulator;
  },
  {} as Partial<CompareModuleRegistry>,
) as CompareModuleRegistry;

export function getCompareModule<Id extends CompareModuleId>(id: Id) {
  const module = compareModuleRegistry[id];

  if (!module) {
    throw new Error(
      `No compare module registered for component "${id}". ` +
        "Add a compare module in src/components/compare.",
    );
  }

  return module;
}
