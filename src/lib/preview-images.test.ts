import { describe, expect, it } from 'vitest';
import type { ImageMetadata } from 'astro';
import {
  buildImageMap,
  findLocalImage,
  isAbsoluteUrl,
  resolvePreviewImage,
  toKeyVariants,
  type ImageResolvableEntry,
} from './preview-images';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const fakeImage = (name: string): ImageMetadata => ({
  src: `/assets/${name}.png`,
  width: 800,
  height: 600,
  format: 'png',
});

const makeEntry = (
  id: string,
  images?: ImageResolvableEntry['data']['images']
): ImageResolvableEntry => ({
  id,
  data: { title: `Test ${id}`, images },
});

// ---------------------------------------------------------------------------
// buildImageMap
// ---------------------------------------------------------------------------
describe('buildImageMap', () => {
  it('builds a map from glob results', () => {
    const glob = {
      '/assets/images/controllers/holybro-h7.jpg': { default: fakeImage('holybro-h7') },
      '/assets/images/controllers/matek-f405.png': { default: fakeImage('matek-f405') },
    };
    const map = buildImageMap(glob);
    expect(map.size).toBe(2);
    expect(map.has('holybro-h7')).toBe(true);
    expect(map.has('matek-f405')).toBe(true);
  });

  it('lowercases keys', () => {
    const glob = {
      '/assets/Holybro-H7.JPG': { default: fakeImage('Holybro-H7') },
    };
    const map = buildImageMap(glob);
    expect(map.has('holybro-h7')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// toKeyVariants
// ---------------------------------------------------------------------------
describe('toKeyVariants', () => {
  it('generates variants from a filename', () => {
    const variants = toKeyVariants('holybro-h7.jpg');
    expect(variants).toContain('holybro-h7.jpg');
    expect(variants).toContain('holybro-h7');
  });

  it('strips @2x retina suffix', () => {
    const variants = toKeyVariants('board@2x.png');
    expect(variants).toContain('board');
  });

  it('returns empty array for empty/whitespace input', () => {
    expect(toKeyVariants('')).toEqual([]);
    expect(toKeyVariants('   ')).toEqual([]);
  });

  it('handles path with subdirectory', () => {
    const variants = toKeyVariants('subdir/image.jpg');
    expect(variants).toContain('image.jpg');
    expect(variants).toContain('image');
  });
});

// ---------------------------------------------------------------------------
// findLocalImage
// ---------------------------------------------------------------------------
describe('findLocalImage', () => {
  const imageMap = new Map<string, ImageMetadata>([
    ['holybro-h7', fakeImage('holybro-h7')],
    ['matek-f405', fakeImage('matek-f405')],
  ]);

  it('finds image by exact key', () => {
    const result = findLocalImage(['holybro-h7'], imageMap);
    expect(result).toBeDefined();
    expect(result?.src).toContain('holybro-h7');
  });

  it('finds image by filename with extension', () => {
    const result = findLocalImage(['holybro-h7.jpg'], imageMap);
    expect(result).toBeDefined();
  });

  it('returns undefined for no match', () => {
    const result = findLocalImage(['nonexistent'], imageMap);
    expect(result).toBeUndefined();
  });

  it('skips undefined candidates', () => {
    const result = findLocalImage([undefined, 'holybro-h7'], imageMap);
    expect(result).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// isAbsoluteUrl
// ---------------------------------------------------------------------------
describe('isAbsoluteUrl', () => {
  it('detects https URLs', () => {
    expect(isAbsoluteUrl('https://example.com/img.jpg')).toBe(true);
  });

  it('detects http URLs', () => {
    expect(isAbsoluteUrl('http://example.com/img.jpg')).toBe(true);
  });

  it('detects protocol-relative URLs', () => {
    expect(isAbsoluteUrl('//cdn.example.com/img.jpg')).toBe(true);
  });

  it('rejects relative paths', () => {
    expect(isAbsoluteUrl('images/photo.jpg')).toBe(false);
    expect(isAbsoluteUrl('./photo.jpg')).toBe(false);
    expect(isAbsoluteUrl('photo.jpg')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// resolvePreviewImage
// ---------------------------------------------------------------------------
describe('resolvePreviewImage', () => {
  const imageMap = new Map<string, ImageMetadata>([
    ['board-a', fakeImage('board-a')],
    ['board-b', fakeImage('board-b')],
  ]);

  it('returns undefined when no images and no id match', () => {
    const entry = makeEntry('nonexistent');
    expect(resolvePreviewImage(entry, imageMap)).toBeUndefined();
  });

  it('resolves local image from entry id', () => {
    const entry = makeEntry('board-a');
    const result = resolvePreviewImage(entry, imageMap);
    expect(result).toBeDefined();
    expect(result!.isLocal).toBe(true);
    expect(result!.alt).toBe('Test board-a');
  });

  it('resolves remote image from src URL', () => {
    const entry = makeEntry('no-local', [
      { src: 'https://example.com/photo.jpg', alt: 'Remote' },
    ]);
    const result = resolvePreviewImage(entry, imageMap);
    expect(result).toBeDefined();
    expect(result!.isLocal).toBe(false);
    expect(result!.src).toBe('https://example.com/photo.jpg');
    expect(result!.alt).toBe('Remote');
  });

  it('prefers hero image when preferHero is set', () => {
    const entry = makeEntry('no-local', [
      { src: 'https://example.com/front.jpg', alt: 'Front' },
      { src: 'https://example.com/hero.jpg', alt: 'Hero', type: 'hero' },
    ]);
    const result = resolvePreviewImage(entry, imageMap, { preferHero: true });
    expect(result).toBeDefined();
    expect(result!.alt).toBe('Hero');
  });

  it('falls back to url field', () => {
    const entry = makeEntry('no-local', [
      { url: 'https://fallback.com/img.jpg', alt: 'Fallback' },
    ]);
    const result = resolvePreviewImage(entry, imageMap);
    expect(result).toBeDefined();
    expect(result!.src).toBe('https://fallback.com/img.jpg');
    expect(result!.isLocal).toBe(false);
  });

  it('resolves local image from image src filename', () => {
    const entry = makeEntry('no-local', [
      { src: 'board-b.jpg', alt: 'Board B' },
    ]);
    const result = resolvePreviewImage(entry, imageMap);
    expect(result).toBeDefined();
    expect(result!.isLocal).toBe(true);
    expect(result!.alt).toBe('Board B');
  });
});
