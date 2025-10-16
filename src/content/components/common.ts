import { z } from 'astro:content';

export const knownIssueSchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  severity: z.enum(['info', 'low', 'medium', 'high', 'critical']),
  date: z
    .string()
    .regex(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/),
  source: z.string(),
  url: z.string().url().optional(),
  description: z.string().optional(),
});

export const componentImageSchema = z.object({
  id: z.string().optional(),
  type: z.enum(['hero', 'gallery', 'detail']).optional(),
  alt: z.string(),
  credit: z.string().optional(),
  source_url: z.string().url().optional(),
  src: z.string().min(1).optional(),
  url: z.string().url().optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
});
