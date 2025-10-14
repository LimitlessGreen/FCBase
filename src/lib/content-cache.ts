import { getCollection, type CollectionEntry } from 'astro:content';

let manufacturersPromise: Promise<Map<string, CollectionEntry<'manufacturers'>>> | null = null;

async function loadManufacturers(): Promise<Map<string, CollectionEntry<'manufacturers'>>> {
  const entries = await getCollection('manufacturers');
  return new Map(entries.map((entry) => [entry.id, entry]));
}

export async function getManufacturersMap(): Promise<Map<string, CollectionEntry<'manufacturers'>>> {
  if (!manufacturersPromise) {
    manufacturersPromise = loadManufacturers();
  }

  return manufacturersPromise;
}
