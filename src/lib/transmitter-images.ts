import type { CollectionEntry } from 'astro:content';
import type { ImageMetadata } from 'astro';
import { buildImageMap, resolvePreviewImage } from './preview-images';
import type { PreviewImage } from './preview-images';

const localTransmitterImages = import.meta.glob<{ default: ImageMetadata }>(
  '/src/assets/images/transmitters/*.{jpg,jpeg,png,webp,avif}',
  { eager: true }
);

const transmitterImageMap = buildImageMap(localTransmitterImages);

export type TransmitterPreviewImage = PreviewImage;

export const resolveTransmitterPreviewImage = (
  transmitter: CollectionEntry<'transmitters'>
): TransmitterPreviewImage | undefined => {
  return resolvePreviewImage(transmitter, transmitterImageMap);
};
