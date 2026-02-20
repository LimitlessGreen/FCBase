import type { ImageMetadata } from 'astro';

const IMAGE_EXTENSION_PATTERN = /\.(jpg|jpeg|png|webp|avif)$/i;

/**
 * Generic preview image type returned by any image resolver.
 */
export type PreviewImage = {
  src: ImageMetadata | string;
  alt: string;
  credit?: string;
  sourceUrl?: string;
  width?: number;
  height?: number;
  isLocal: boolean;
};

/**
 * Shape of image data from a content entry (controller or transmitter).
 */
export interface ContentImageEntry {
  src?: string;
  url?: string;
  alt?: string;
  credit?: string;
  source_url?: string;
  type?: string;
  width?: number;
  height?: number;
}

/**
 * Shape of a content entry for image resolution.
 */
export interface ImageResolvableEntry {
  id: string;
  slug?: string;
  data: {
    id?: string;
    title: string;
    images?: ContentImageEntry[];
  };
}

export interface ImageResolverOptions {
  /** Whether to prefer a `type: 'hero'` image over the first image */
  preferHero?: boolean;
}

/**
 * Build a Map<lowercased-id, ImageMetadata> from a Vite eager glob result.
 */
export function buildImageMap(
  globResult: Record<string, { default: ImageMetadata }>
): Map<string, ImageMetadata> {
  return new Map(
    Object.entries(globResult).map(([path, module]) => {
      const file = path.split('/').pop();
      const id = file?.replace(IMAGE_EXTENSION_PATTERN, '');
      if (!id) {
        throw new Error(`Unable to derive image id from path: ${path}`);
      }
      return [id.toLowerCase(), module.default];
    })
  );
}

/**
 * Generate lowercase key variants from a filename or id string:
 * original, without extension, without @2x retina suffix.
 */
export function toKeyVariants(value: string): string[] {
  const key = value.split('/').pop()?.trim();
  if (!key) {
    return [];
  }

  const variants = new Set<string>();
  const withoutExtension = key.replace(IMAGE_EXTENSION_PATTERN, '');
  variants.add(key);
  variants.add(withoutExtension);

  const retinaVariant = withoutExtension.replace(/@\d+x$/i, '');
  variants.add(retinaVariant);

  return Array.from(variants)
    .map((entry) => entry.toLowerCase())
    .filter((entry) => entry.length > 0);
}

/**
 * Search for a local image matching any of the given candidate strings.
 */
export function findLocalImage(
  candidates: Iterable<string | undefined>,
  imageMap: Map<string, ImageMetadata>
): ImageMetadata | undefined {
  for (const candidate of candidates) {
    if (!candidate) continue;

    for (const variant of toKeyVariants(candidate)) {
      const match = imageMap.get(variant.toLowerCase());
      if (match) {
        return match;
      }
    }
  }

  return undefined;
}

/**
 * Check whether a string is an absolute URL (http(s), protocol-relative).
 */
export function isAbsoluteUrl(value: string): boolean {
  if (value.startsWith('//')) {
    return true;
  }

  try {
    const url = new URL(value);
    return Boolean(url.protocol && url.host);
  } catch (_error) {
    return false;
  }
}

/**
 * Generic image resolver for any content entry with images.
 * Resolves in this order:
 * 1. Hero image (if preferHero) or first image `src` as remote URL
 * 2. Hero/first image `src` as local asset
 * 3. Entry id/slug-based local asset lookup
 * 4. Hero/first image `url` field as remote fallback
 */
export function resolvePreviewImage(
  entry: ImageResolvableEntry,
  imageMap: Map<string, ImageMetadata>,
  options: ImageResolverOptions = {}
): PreviewImage | undefined {
  const { preferHero = false } = options;

  const heroImage = preferHero
    ? (entry.data.images?.find((image) => image.type === 'hero') ?? entry.data.images?.[0])
    : entry.data.images?.[0];

  const alt = heroImage?.alt ?? entry.data.title;
  const credit = heroImage?.credit;
  const sourceUrl = heroImage?.source_url;
  const width = heroImage?.width;
  const height = heroImage?.height;

  // Try hero/first image src
  const heroSrc = heroImage?.src?.trim();
  if (heroSrc) {
    if (isAbsoluteUrl(heroSrc)) {
      return { src: heroSrc, alt, credit, sourceUrl, width, height, isLocal: false };
    }

    const heroLocal = findLocalImage([heroSrc], imageMap);
    if (heroLocal) {
      return {
        src: heroLocal,
        alt,
        credit,
        sourceUrl,
        width: heroLocal.width,
        height: heroLocal.height,
        isLocal: true,
      };
    }
  }

  // Try id/slug-based lookup
  const slug = (entry as { slug?: string }).slug;

  const candidates = new Set<string | undefined>();
  candidates.add(entry.id);
  candidates.add(slug);
  candidates.add(entry.data.id);
  if (entry.id.includes('/')) {
    candidates.add(entry.id.split('/').pop());
  }
  if (slug?.includes('/')) {
    candidates.add(slug.split('/').pop());
  }

  const localImage = findLocalImage(candidates, imageMap);
  if (localImage) {
    return {
      src: localImage,
      alt,
      credit,
      sourceUrl,
      width: localImage.width,
      height: localImage.height,
      isLocal: true,
    };
  }

  // Last resort: url field
  if (heroImage?.url) {
    return { src: heroImage.url, alt, credit, sourceUrl, width, height, isLocal: false };
  }

  return undefined;
}
