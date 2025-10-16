import type { CollectionEntry } from 'astro:content';
import type { ImageMetadata } from 'astro';

const localControllerImages = import.meta.glob<{ default: ImageMetadata }>(
  '/src/assets/images/controllers/*.{jpg,jpeg,png,webp,avif}',
  { eager: true }
);

const IMAGE_EXTENSION_PATTERN = /\.(jpg|jpeg|png|webp|avif)$/i;

const controllerImageMap = new Map<string, ImageMetadata>(
  Object.entries(localControllerImages).map(([path, module]) => {
    const file = path.split('/').pop();
    const id = file?.replace(IMAGE_EXTENSION_PATTERN, '');
    if (!id) {
      throw new Error(`Unable to derive image id from path: ${path}`);
    }

    return [id.toLowerCase(), module.default];
  })
);

const toKeyVariants = (value: string): string[] => {
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
};

const findLocalImage = (candidates: Iterable<string | undefined>) => {
  for (const candidate of candidates) {
    if (!candidate) continue;

    for (const variant of toKeyVariants(candidate)) {
      const match = controllerImageMap.get(variant.toLowerCase());
      if (match) {
        return match;
      }
    }
  }

  return undefined;
};

const isAbsoluteUrl = (value: string): boolean => {
  if (value.startsWith('//')) {
    return true;
  }

  try {
    const url = new URL(value);
    return Boolean(url.protocol && url.host);
  } catch {
    return false;
  }
};

export type ControllerPreviewImage = {
  src: ImageMetadata | string;
  alt: string;
  credit?: string;
  sourceUrl?: string;
  width?: number;
  height?: number;
  isLocal: boolean;
};

export const resolveControllerPreviewImage = (
  controller: CollectionEntry<'controllers'>
): ControllerPreviewImage | undefined => {
  const heroImage =
    controller.data.images?.find((image) => image.type === 'hero') ??
    controller.data.images?.[0];

  const alt = heroImage?.alt ?? controller.data.title;
  const credit = heroImage?.credit;
  const sourceUrl = heroImage?.source_url;
  const width = heroImage?.width;
  const height = heroImage?.height;

  const heroSrc = heroImage?.src?.trim();
  if (heroSrc) {
    if (isAbsoluteUrl(heroSrc)) {
      return {
        src: heroSrc,
        alt,
        credit,
        sourceUrl,
        width,
        height,
        isLocal: false,
      };
    }

    const heroLocal = findLocalImage([heroSrc]);
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

  const slug = (controller as { slug?: string }).slug;

  const candidates = new Set<string | undefined>();
  candidates.add(controller.id);
  candidates.add(slug);
  candidates.add(controller.data.id);
  if (controller.id.includes('/')) {
    candidates.add(controller.id.split('/').pop());
  }
  if (slug?.includes('/')) {
    candidates.add(slug.split('/').pop());
  }

  const localImage = findLocalImage(candidates);
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

  if (heroImage?.url) {
    return {
      src: heroImage.url,
      alt,
      credit,
      sourceUrl,
      width,
      height,
      isLocal: false,
    };
  }

  return undefined;
};
