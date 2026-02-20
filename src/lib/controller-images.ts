import type { CollectionEntry } from 'astro:content';
import type { ImageMetadata } from 'astro';
import { buildImageMap, resolvePreviewImage } from './preview-images';
import type { PreviewImage } from './preview-images';

const localControllerImages = import.meta.glob<{ default: ImageMetadata }>(
  '/src/assets/images/controllers/*.{jpg,jpeg,png,webp,avif}',
  { eager: true }
);

const controllerImageMap = buildImageMap(localControllerImages);

export type ControllerPreviewImage = PreviewImage;

export const resolveControllerPreviewImage = (
  controller: CollectionEntry<'controllers'>
): ControllerPreviewImage | undefined => {
  return resolvePreviewImage(controller, controllerImageMap, { preferHero: true });
};
