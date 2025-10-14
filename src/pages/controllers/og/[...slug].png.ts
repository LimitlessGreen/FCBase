/** @jsxImportSource react */
import { ImageResponse } from '@vercel/og';
import type { APIContext } from 'astro';
import { getCollection, getEntry } from 'astro:content';
import { jsx, jsxs } from 'react/jsx-runtime';
import { formatMounting, getManufacturerName } from '@/lib/data-utils';

export const prerender = true;

const GRADIENT_BACKGROUND = 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)';

function resolveSlug(slug: APIContext['params']['slug']): string | null {
  if (!slug) return null;
  if (Array.isArray(slug)) {
    return slug.join('/');
  }
  return slug;
}

function createSummary(data: any): string {
  const seoSummary = typeof data?.seo?.summary === 'string' ? data.seo.summary.trim() : '';
  if (seoSummary) {
    return seoSummary.length > 160 ? `${seoSummary.slice(0, 157)}…` : seoSummary;
  }

  const notes = (() => {
    if (typeof data?.notes === 'string') return data.notes;
    if (Array.isArray(data?.notes)) return data.notes.join(' ');
    return '';
  })()
    .replace(/\s+/g, ' ')
    .trim();

  if (notes) {
    return notes.length > 160 ? `${notes.slice(0, 157)}…` : notes;
  }

  const mcu = data?.mcu ?? 'featured';
  const mounting = data?.mounting ? formatMounting(data.mounting) : 'custom';
  return `Flight controller with ${mcu} MCU and ${mounting} mounting.`;
}

export async function GET({ params }: APIContext) {
  const slug = resolveSlug(params.slug);
  if (!slug) {
    return new Response('Not Found', { status: 404 });
  }

  const controller = await getEntry('controllers', slug).catch(() => null);
  if (!controller) {
    return new Response('Not Found', { status: 404 });
  }

  const { data } = controller;
  const manufacturerEntry = data.brand
    ? await getEntry('manufacturers', data.brand).catch(() => null)
    : null;
  const manufacturerName = getManufacturerName(manufacturerEntry, data.brand);
  const mcuEntry = data.mcu ? await getEntry('mcu', data.mcu).catch(() => null) : null;
  const mcuName = mcuEntry?.data.title ?? mcuEntry?.data.name ?? data.mcu ?? 'Unknown MCU';
  const summary = createSummary(data);
  const mountingLabel = data.mounting ? formatMounting(data.mounting) : 'Custom';
  const ioSummaryParts = [
    typeof data.io?.uarts === 'number'
      ? `${data.io.uarts} UART${data.io.uarts === 1 ? '' : 's'}`
      : null,
    typeof data.io?.can === 'number' ? `${data.io.can} CAN` : null,
    data.io?.sd_card ? 'MicroSD logging' : null,
  ].filter(Boolean) as string[];
  const ioSummary = ioSummaryParts.join(' • ') || 'Expanded connectivity';

  const specCards = [
    { label: 'MCU', value: mcuName },
    { label: 'Mounting', value: mountingLabel },
    { label: 'I/O', value: ioSummary },
  ];

  const specCardNodes = specCards.map((spec) =>
    jsxs(
      'div',
      {
        style: {
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          padding: '28px',
          minWidth: '260px',
          borderRadius: '20px',
          background: 'rgba(15, 23, 42, 0.7)',
          border: '1px solid rgba(148, 163, 184, 0.2)',
          boxShadow: '0 20px 50px rgba(15, 23, 42, 0.45)',
        },
        children: [
          jsx('span', {
            style: { fontSize: '24px', fontWeight: 600, color: '#f8fafc' },
            children: spec.label,
          }),
          jsx('span', {
            style: { fontSize: '28px', fontWeight: 500, color: '#bae6fd', lineHeight: 1.2 },
            children: spec.value,
          }),
        ],
      },
      spec.label
    )
  );

  return new ImageResponse(
    jsxs('div', {
      style: {
        width: '1200px',
        height: '630px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '64px',
        background: GRADIENT_BACKGROUND,
        color: '#e2e8f0',
        fontFamily: 'Inter, "Helvetica Neue", Arial, sans-serif',
      },
      children: [
        jsxs('div', {
          style: { display: 'flex', flexDirection: 'column', gap: '18px' },
          children: [
            jsx('div', {
              style: {
                fontSize: '32px',
                fontWeight: 600,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: '#38bdf8',
              },
              children: manufacturerName,
            }),
            jsx('div', {
              style: {
                fontSize: '72px',
                fontWeight: 700,
                lineHeight: 1.05,
                letterSpacing: '-0.02em',
              },
              children: data.title,
            }),
            jsx('div', {
              style: {
                fontSize: '28px',
                color: '#cbd5f5',
                lineHeight: 1.35,
                maxWidth: '900px',
              },
              children: summary,
            }),
          ],
        }),
        jsxs('div', {
          style: { display: 'flex', gap: '24px', flexWrap: 'wrap' },
          children: specCardNodes,
        }),
        jsxs('div', {
          style: {
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '24px',
            color: '#94a3b8',
            letterSpacing: '0.08em',
          },
          children: [jsx('span', { children: 'FCBase' }), jsx('span', { children: slug })],
        }),
      ],
    }),
    {
      width: 1200,
      height: 630,
    }
  );
}

export async function getStaticPaths() {
  const controllers = await getCollection('controllers');
  return controllers.map((controller) => ({
    params: { slug: controller.id },
  }));
}
