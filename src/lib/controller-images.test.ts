import type { CollectionEntry } from 'astro:content';
import type { ImageMetadata } from 'astro';
import { describe, expect, it } from 'vitest';

import { resolveControllerPreviewImage } from './controller-images';

type ControllerEntry = CollectionEntry<'controllers'>;

type ControllerImage = NonNullable<ControllerEntry['data']['images']>[number];

type PartialController = Partial<ControllerEntry> & {
  id: string;
  data: Partial<ControllerEntry['data']> & { title: string };
};

const buildController = (
  overrides: PartialController & { data: PartialController['data'] }
): ControllerEntry => {
  const { data, ...rest } = overrides;

  return {
    id: overrides.id,
    slug: (rest as { slug?: string }).slug,
    data: {
      id: data.id ?? overrides.id,
      title: data.title,
      images: data.images as ControllerImage[] | undefined,
    },
  } as ControllerEntry;
};

describe('resolveControllerPreviewImage', () => {
  it('prefers hero image src when referencing a local asset', () => {
    const controller = buildController({
      id: 'controllers/cubepilot/cubepilot-cube-black',
      slug: 'controllers/cubepilot/cubepilot-cube-black',
      data: {
        id: 'cubepilot-cube-black',
        title: 'CubePilot Cube Black',
        images: [
          {
            src: 'cubepilot-cube-black.jpg',
            alt: 'Hero image alt text',
          },
        ] as ControllerImage[],
      },
    });

    const preview = resolveControllerPreviewImage(controller);
    expect(preview).toBeDefined();
    expect(preview?.isLocal).toBe(true);

    const metadata = preview?.src as ImageMetadata | string;
    const resolvedSrc = typeof metadata === 'string' ? metadata : metadata.src;
    expect(resolvedSrc).toContain('cubepilot-cube-black');
    expect(preview?.alt).toBe('Hero image alt text');
  });
});
