/**
 * WordPress REST API TypeScript types — posts only
 */

export interface WPRendered {
  rendered: string
  protected?: boolean
}

export interface WPAvatar {
  '24'?: string
  '48'?: string
  '96'?: string
}

export interface WPAuthor {
  id: number
  name: string
  url: string
  description: string
  link: string
  slug: string
  avatar_urls: WPAvatar
}

export interface WPFeaturedMedia {
  id: number
  source_url: string
  alt_text: string
  media_details?: {
    width: number | null
    height: number | null
    sizes?: Record<string, {
      source_url: string
      width: number
      height: number
    }>
  }
}

export interface WPTerm {
  id: number
  name: string
  slug: string
  taxonomy: string
  link?: string
  description?: string
  count?: number
}

export interface WPEmbedded {
  author?: WPAuthor[]
  'wp:featuredmedia'?: WPFeaturedMedia[]
  'wp:term'?: WPTerm[][]
}

export interface WPPost {
  id: number
  date: string
  date_gmt: string
  modified: string
  modified_gmt: string
  slug: string
  status: 'publish' | 'draft' | 'pending' | 'private' | 'future'
  type: 'post'
  link: string
  title: WPRendered
  content: WPRendered
  excerpt: WPRendered
  author: number
  featured_media: number
  comment_status: 'open' | 'closed'
  ping_status: 'open' | 'closed'
  sticky: boolean
  template: string
  format: 'standard' | 'aside' | 'chat' | 'gallery' | 'link' | 'image' | 'quote' | 'status' | 'video' | 'audio'
  meta: Record<string, unknown>
  categories: number[]
  tags: number[]
  _embedded?: WPEmbedded
}

export type WPAPIListResponse<T> = T[]

export interface PaginatedResponse<T> {
  data: T[]
  totalItems: number
  totalPages: number
  currentPage: number
}
