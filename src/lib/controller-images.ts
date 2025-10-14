import type { CollectionEntry } from 'astro:content';
import type { ImageMetadata } from 'astro';

const localControllerImages = import.meta.glob<{ default: ImageMetadata }>(
  '/src/assets/images/controllers/*.{jpg,jpeg,png,webp,avif}',
  { eager: true }
);

const controllerImageMap = new Map<string, ImageMetadata>(
  Object.entries(localControllerImages).map(([path, module]) => {
    const file = path.split('/').pop();
    const id = file?.replace(/\.(jpg|jpeg|png|webp|avif)$/i, '');
    if (!id) {
      throw new Error(`Unable to derive image id from path: ${path}`);
    }

    return [id, module.default];
  })
);

const findLocalImage = (candidates: Iterable<string | undefined>) => {
  for (const candidate of candidates) {
    if (!candidate) continue;
    const key = candidate.split('/').pop();
    if (!key) continue;

    const match = controllerImageMap.get(key);
    if (match) {
      return match;
    }
  }

  return undefined;
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
