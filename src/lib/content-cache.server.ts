import type { CollectionEntry, ContentEntryMap } from 'astro:content';

let contentModulePromise: Promise<typeof import('astro:content')> | null = null;

async function loadContentModule() {
  if (!contentModulePromise) {
    if (!import.meta.env.SSR) {
      throw new Error('astro:content is only available on the server.');
    }

    contentModulePromise = import('astro:content');
  }

  return contentModulePromise;
}

let manufacturersPromise: Promise<Map<string, CollectionEntry<'manufacturers'>>> | null = null;
let sensorsPromise: Promise<Map<string, CollectionEntry<'sensors'>>> | null = null;
let firmwarePromise: Promise<Map<string, CollectionEntry<'firmware'>>> | null = null;
let sourcesPromise: Promise<Map<string, CollectionEntry<'sources'>>> | null = null;

async function loadCollectionMap<T extends keyof ContentEntryMap>(
  collection: T
): Promise<Map<string, CollectionEntry<T>>> {
  const { getCollection } = await loadContentModule();
  const entries = await getCollection(collection);
  return new Map(entries.map((entry) => [entry.id, entry]));
}

export async function getManufacturersMap(): Promise<
  Map<string, CollectionEntry<'manufacturers'>>
> {
  if (!manufacturersPromise) {
    manufacturersPromise = loadCollectionMap('manufacturers');
  }

  return manufacturersPromise;
}

export async function getSensorsMap(): Promise<Map<string, CollectionEntry<'sensors'>>> {
  if (!sensorsPromise) {
    sensorsPromise = loadCollectionMap('sensors');
  }

  return sensorsPromise;
}

export async function getFirmwareMap(): Promise<Map<string, CollectionEntry<'firmware'>>> {
  if (!firmwarePromise) {
    firmwarePromise = loadCollectionMap('firmware');
  }

  return firmwarePromise;
}

export async function getSourcesMap(): Promise<Map<string, CollectionEntry<'sources'>>> {
  if (!sourcesPromise) {
    sourcesPromise = loadCollectionMap('sources');
  }

  return sourcesPromise;
}
