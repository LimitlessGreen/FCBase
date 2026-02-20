/** @jsxImportSource react */
import { ImageResponse } from '@vercel/og';
import type { APIContext } from 'astro';
import { getCollection, getEntry } from 'astro:content';
import { jsx, jsxs } from 'react/jsx-runtime';
import { getManufacturerName } from '@/lib/data-utils';
import { getManufacturersMap } from '@/lib/content-cache.server';

export const prerender = true;

const GRADIENT_BACKGROUND = 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)';

function resolveSlug(slug: APIContext['params']['slug']): string | null {
  if (!slug) return null;
  if (Array.isArray(slug)) {
    return slug.join('/');
  }
  return slug;
}

const supportLevelLabels: Record<string, string> = {
  official: 'Official EdgeTX',
  manufacturer: 'Manufacturer',
  community: 'Community',
};

const supportStatusLabels: Record<string, string> = {
  supported: 'Active',
  limited: 'Limited',
  sunset: 'Sunset',
  planned: 'Planned',
};

export async function GET({ params }: APIContext) {
  const slug = resolveSlug(params.slug);
  if (!slug) {
    return new Response('Not Found', { status: 404 });
  }

  const transmitter = await getEntry('transmitters', slug).catch(() => null);
  if (!transmitter) {
    return new Response('Not Found', { status: 404 });
  }

  const { data } = transmitter;
  const manufacturers = await getManufacturersMap();
  const manufacturerEntry = data.brand ? manufacturers.get(data.brand) ?? null : null;
  const manufacturerName = getManufacturerName(manufacturerEntry, data.brand);

  const supportLevel = supportLevelLabels[data.support.level] ?? data.support.level;
  const supportStatus = supportStatusLabels[data.support.status] ?? data.support.status;
  const formFactor = data.hardware?.form_factor
    ? data.hardware.form_factor.charAt(0).toUpperCase() + data.hardware.form_factor.slice(1)
    : 'Radio';

  const summary = `${supportLevel} support since ${data.support.since_version}. ${formFactor} transmitter by ${manufacturerName}.`;

  const specCards = [
    { label: 'Support', value: `${supportLevel} · ${supportStatus}` },
    { label: 'Since', value: data.support.since_version },
    { label: 'Form', value: formFactor },
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
  const transmitters = await getCollection('transmitters');
  return transmitters.map((transmitter) => ({
    params: { slug: transmitter.id },
  }));
}
