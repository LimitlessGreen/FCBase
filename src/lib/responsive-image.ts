import { getImage } from 'astro:assets';
import type { ImageMetadata } from 'astro';

type OutputFormat = 'avif' | 'webp' | 'png' | 'jpeg';

type ProgressiveFormat = Extract<OutputFormat, 'avif' | 'webp'>;

type MemoizedResult = Awaited<ReturnType<typeof getImage>>;

interface ResponsiveSource {
  type: string;
  srcset: string;
}

interface ResponsiveImageMeta {
  src: string;
  srcset?: string;
  width: number;
  height: number;
}

export interface ResponsivePicture {
  sources: ResponsiveSource[];
  img: ResponsiveImageMeta;
}

interface BuildResponsivePictureOptions {
  widths?: number[];
  formats?: ProgressiveFormat[];
}

const DEFAULT_FORMATS: ProgressiveFormat[] = ['avif', 'webp'];
const DEFAULT_WIDTHS = [320, 640, 960];

const imageCache = new Map<string, Promise<MemoizedResult>>();

const getSourceId = (imageMeta: ImageMetadata): string => {
  if (typeof imageMeta.src === 'string') {
    return imageMeta.src;
  }

  // Astro's ImageMetadata#src should always be a string, but guard just in case.
  return JSON.stringify({
    width: imageMeta.width,
    height: imageMeta.height,
    format: imageMeta.format,
  });
};

const createCacheKey = (
  imageMeta: ImageMetadata,
  format: OutputFormat,
  widths: readonly number[]
): string => {
  const sourceId = getSourceId(imageMeta);
  const widthsKey = widths.join('x');
  return `${sourceId}|${format}|${widthsKey}`;
};

const getMemoizedImage = async (
  imageMeta: ImageMetadata,
  format: OutputFormat,
  widths: readonly number[]
): Promise<MemoizedResult> => {
  const cacheKey = createCacheKey(imageMeta, format, widths);
  let memoized = imageCache.get(cacheKey);

  if (!memoized) {
    memoized = getImage({ src: imageMeta, format, widths: [...widths] });
    imageCache.set(cacheKey, memoized);
  }

  return memoized;
};

export const buildResponsivePicture = async (
  imageMeta: ImageMetadata,
  _sizes: string,
  options: BuildResponsivePictureOptions = {}
): Promise<ResponsivePicture> => {
  const widths = options.widths ?? DEFAULT_WIDTHS;
  const formats = options.formats ?? DEFAULT_FORMATS;

  const sources = await Promise.all(
    formats.map(async (format) => {
      const result = await getMemoizedImage(imageMeta, format, widths);
      const srcset = result.srcSet?.value ?? result.srcSet?.attribute ?? result.src;
      return {
        type: `image/${format}`,
        srcset,
      } satisfies ResponsiveSource;
    })
  );

  const fallbackFormat: OutputFormat = imageMeta.format === 'png' ? 'png' : 'jpeg';
  const fallbackResult = await getMemoizedImage(imageMeta, fallbackFormat, widths);

  const fallbackWidth = Number(
    fallbackResult.attributes.width ?? fallbackResult.options.width ?? imageMeta.width
  );
  const fallbackHeight = Number(
    fallbackResult.attributes.height ?? fallbackResult.options.height ?? imageMeta.height
  );

  return {
    sources,
    img: {
      src: fallbackResult.src,
      srcset: fallbackResult.srcSet?.attribute ?? undefined,
      width: fallbackWidth,
      height: fallbackHeight,
    },
  } satisfies ResponsivePicture;
};

export const RESPONSIVE_IMAGE_WIDTHS = DEFAULT_WIDTHS;
export const RESPONSIVE_IMAGE_FORMATS = DEFAULT_FORMATS;
