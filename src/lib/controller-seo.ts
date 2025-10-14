import type { ControllerData } from '@/content/config';

const META_DESCRIPTION_MAX_LENGTH = 160;

type SummarySource = 'seo' | 'notes' | 'generated';

const normalizeWhitespace = (value: string): string => value.replace(/\s+/g, ' ').trim();

const ensureString = (value: unknown): string => {
  if (typeof value === 'string') {
    return value;
  }
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string').join(' ');
  }
  if (value == null) {
    return '';
  }
  return String(value);
};

const truncate = (value: string, maxLength = META_DESCRIPTION_MAX_LENGTH): string => {
  if (value.length <= maxLength) {
    return value;
  }
  return `${value.slice(0, Math.max(0, maxLength - 1))}…`;
};

export interface ControllerSummaryResult {
  summary: string;
  metaDescription: string;
  source: SummarySource;
}

export const resolveControllerSummary = (
  data: ControllerData,
  fallbackFactory: () => string
): ControllerSummaryResult => {
  const candidates: Array<{ value: unknown; source: SummarySource }> = [
    { value: data.seo?.summary, source: 'seo' },
    { value: data.notes, source: 'notes' },
  ];

  for (const candidate of candidates) {
    const normalized = normalizeWhitespace(ensureString(candidate.value));
    if (normalized) {
      return {
        summary: normalized,
        metaDescription: truncate(normalized),
        source: candidate.source,
      };
    }
  }

  const fallback = normalizeWhitespace(ensureString(fallbackFactory()));

  return {
    summary: fallback,
    metaDescription: truncate(fallback),
    source: 'generated',
  };
};

export interface ControllerProductLdOptions {
  controllerId: string;
  title: string;
  description: string;
  canonicalUrl: string;
  imageUrl: string;
  manufacturerName?: string | null;
  additionalProperties?: Array<Record<string, unknown>>;
}

export const createControllerProductLd = ({
  controllerId,
  title,
  description,
  canonicalUrl,
  imageUrl,
  manufacturerName,
  additionalProperties = [],
}: ControllerProductLdOptions): Record<string, unknown> => {
  const product: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: title,
    description,
    sku: controllerId,
    mpn: controllerId,
    category: 'Flight Controller',
    url: canonicalUrl,
    image: imageUrl,
  };

  if (manufacturerName) {
    product.brand = { '@type': 'Brand', name: manufacturerName };
  }

  if (additionalProperties.length > 0) {
    product.additionalProperty = additionalProperties;
  }

  return product;
};
