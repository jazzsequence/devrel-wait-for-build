/**
 * Zod validation schemas for WordPress REST API — posts only
 */

import { z } from 'zod'

export const WPRenderedSchema = z.object({
  rendered: z.string(),
  protected: z.boolean().optional(),
}).passthrough()

export const WPAvatarSchema = z.object({
  '24': z.string().optional(),
  '48': z.string().optional(),
  '96': z.string().optional(),
}).passthrough()

export const WPAuthorSchema = z.object({
  id: z.number(),
  name: z.string(),
  url: z.string(),
  description: z.string(),
  link: z.string(),
  slug: z.string(),
  avatar_urls: WPAvatarSchema,
}).passthrough()

export const WPFeaturedMediaSchema = z.object({
  id: z.number(),
  source_url: z.string(),
  alt_text: z.string(),
  media_details: z.object({
    width: z.coerce.number().nullable(),
    height: z.coerce.number().nullable(),
    sizes: z.record(z.string(), z.object({
      source_url: z.string(),
      width: z.coerce.number(),
      height: z.coerce.number(),
    }).passthrough()).optional(),
  }).passthrough().optional(),
}).passthrough()

export const WPTermSchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  taxonomy: z.string(),
  link: z.string().optional(),
  description: z.string().optional(),
  count: z.number().optional(),
}).passthrough()

export const WPEmbeddedSchema = z.object({
  author: z.array(WPAuthorSchema).optional(),
  'wp:featuredmedia': z.array(WPFeaturedMediaSchema).optional(),
  'wp:term': z.array(z.array(WPTermSchema)).optional(),
}).passthrough().optional()

export const WPPostSchema = z.object({
  id: z.number(),
  date: z.string(),
  date_gmt: z.string(),
  modified: z.string(),
  modified_gmt: z.string(),
  slug: z.string(),
  status: z.enum(['publish', 'draft', 'pending', 'private', 'future']),
  type: z.literal('post'),
  link: z.string(),
  title: WPRenderedSchema,
  content: WPRenderedSchema,
  excerpt: WPRenderedSchema,
  author: z.number(),
  featured_media: z.number(),
  comment_status: z.enum(['open', 'closed']),
  ping_status: z.enum(['open', 'closed']),
  sticky: z.boolean(),
  template: z.string(),
  format: z.enum(['standard', 'aside', 'chat', 'gallery', 'link', 'image', 'quote', 'status', 'video', 'audio']),
  meta: z.union([z.record(z.string(), z.unknown()), z.array(z.unknown())]).transform(val =>
    Array.isArray(val) ? {} as Record<string, unknown> : val
  ) as unknown as z.ZodType<Record<string, unknown>>,
  categories: z.array(z.number()),
  tags: z.array(z.number()),
  _embedded: WPEmbeddedSchema,
}).passthrough()

export const WPPostsSchema = z.array(WPPostSchema)

export type InferredWPPost = z.infer<typeof WPPostSchema>
