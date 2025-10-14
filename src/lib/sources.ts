import { getEntry } from 'astro:content';

export interface SourceEntry {
  id: string;
  title: string;
  url: string | null;
  publisher: string | null;
  author: string | null;
  retrieved: string | null;
  notes: string | null;
}

const toString = (value: unknown): string | null => {
  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return value.toString();
  }

  return null;
};

export async function resolveSources(ids: readonly string[] | undefined | null): Promise<SourceEntry[]> {
  if (!Array.isArray(ids) || ids.length === 0) {
    return [];
  }

  const entries = await Promise.all(
    ids.map(async (sourceId) => {
      const entry = await getEntry('sources', sourceId);
      const data = entry?.data;

      return {
        id: sourceId,
        title: data?.title ?? sourceId,
        url: data?.url ?? null,
        publisher: data?.publisher ?? null,
        author: data?.author ?? null,
        retrieved:
          toString(data?.retrieved) ??
          toString(data?.date) ??
          toString(data?.year) ??
          null,
        notes: data?.notes ?? null,
      } satisfies SourceEntry;
    })
  );

  return entries;
}
