import type { CollectionEntry } from "astro:content";
import type { ComponentType } from "react";

import type { ComponentMetadataId } from "@/lib/components/metadata";

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

export type CompareModuleRegistryFromModules<
  Modules extends ReadonlyArray<CompareModule>,
> = {
  [Module in Modules[number] as Module["id"]]: Module;
};
