/**
 * WordPress REST API client for jazzsequence.com
 * Features: retry logic, rate limiting, Zod validation, ISR caching
 */

import type { z } from 'zod'
import { WPPostSchema, WPPostsSchema } from './schemas'
import type { WPPost, WPAPIListResponse, PaginatedResponse } from './types'

const API_BASE_URL =
  process.env.WORDPRESS_API_URL || 'https://jazzsequence.com/wp-json/wp/v2'

// ===== Error Classes =====

export class WPAPIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public endpoint?: string
  ) {
    super(message)
    this.name = 'WPAPIError'
  }
}

export class WPValidationError extends Error {
  constructor(
    message: string,
    public zodError: z.ZodError
  ) {
    super(message)
    this.name = 'WPValidationError'
  }
}

export class WPNotFoundError extends WPAPIError {
  constructor(slug: string) {
    super(`Post not found: ${slug}`, 404)
    this.name = 'WPNotFoundError'
  }
}

export class WPForbiddenError extends WPAPIError {
  constructor(slug: string) {
    super(`Post is private or restricted: ${slug}`, 403)
    this.name = 'WPForbiddenError'
  }
}

// ===== Options =====

export interface ISROptions {
  revalidate?: number | false
  tags?: string[]
  cache?: RequestCache
}

export interface FetchOptions {
  page?: number
  perPage?: number
  embed?: boolean
  search?: string
  categories?: number[]
  tags?: number[]
  orderBy?: 'date' | 'title' | 'modified'
  order?: 'asc' | 'desc'
  isr?: ISROptions
}

// ===== Rate Limiting =====

class TokenBucketRateLimiter {
  private tokens: number
  private lastRefill: number

  constructor(
    private readonly maxTokens: number,
    private readonly refillRate: number
  ) {
    this.tokens = maxTokens
    this.lastRefill = Date.now()
  }

  async tryAcquire(): Promise<void> {
    this.refill()
    if (this.tokens >= 1) {
      this.tokens -= 1
      return
    }
    await new Promise(r => setTimeout(r, (1 / this.refillRate) * 1000))
    this.refill()
    this.tokens -= 1
  }

  private refill(): void {
    const elapsed = (Date.now() - this.lastRefill) / 1000
    this.tokens = Math.min(this.maxTokens, this.tokens + elapsed * this.refillRate)
    this.lastRefill = Date.now()
  }
}

const rateLimiter = new TokenBucketRateLimiter(20, 10)

// ===== Fetch Infrastructure =====

async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  maxRetries = 3
): Promise<Response> {
  let lastError: Error | null = null
  const retryable = [408, 429, 500, 502, 503, 504]

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: { 'Content-Type': 'application/json', ...options.headers },
      })

      if (response.ok) return response

      if (!retryable.includes(response.status)) {
        throw new WPAPIError(`HTTP ${response.status}: ${response.statusText}`, response.status, url)
      }

      lastError = new WPAPIError(`HTTP ${response.status}: ${response.statusText}`, response.status, url)
    } catch (error) {
      if (error instanceof WPAPIError && !retryable.includes(error.statusCode || 0)) throw error
      lastError = error instanceof Error ? error : new Error('Unknown error')
    }

    if (attempt < maxRetries - 1) {
      const delay = Math.min(1000 * Math.pow(2, attempt), 5000)
      await new Promise(r => setTimeout(r, delay + delay * 0.2 * (Math.random() - 0.5)))
    }
  }

  throw lastError || new Error('Max retries exceeded')
}

async function fetchAndValidate<T extends z.ZodTypeAny>(
  url: string,
  schema: T,
  options: RequestInit = {}
): Promise<z.infer<T>> {
  await rateLimiter.tryAcquire()
  const response = await fetchWithRetry(url, options)
  const data = await response.json()
  const result = schema.safeParse(data)

  if (!result.success) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[Zod Validation Error]', { url, errors: result.error.issues })
    }
    throw new WPValidationError(`Validation failed for ${url}`, result.error)
  }

  return result.data
}

async function fetchAndValidateWithResponse<T extends z.ZodTypeAny>(
  url: string,
  schema: T,
  options: RequestInit = {}
): Promise<{ data: z.infer<T>; response: Response }> {
  await rateLimiter.tryAcquire()
  const response = await fetchWithRetry(url, options)
  const data = await response.json()
  const result = schema.safeParse(data)

  if (!result.success) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[Zod Validation Error]', { url, errors: result.error.issues })
    }
    throw new WPValidationError(`Validation failed for ${url}`, result.error)
  }

  return { data: result.data, response }
}

function buildQueryParams(options: Omit<FetchOptions, 'isr'> = {}): string {
  const params = new URLSearchParams()
  if (options.page) params.append('page', options.page.toString())
  if (options.perPage) params.append('per_page', options.perPage.toString())
  if (options.embed) params.append('_embed', 'true')
  if (options.search) params.append('search', options.search)
  if (options.categories) params.append('categories', options.categories.join(','))
  if (options.tags) params.append('tags', options.tags.join(','))
  if (options.orderBy) params.append('orderby', options.orderBy)
  if (options.order) params.append('order', options.order)
  const qs = params.toString()
  return qs ? `?${qs}` : ''
}

function buildISROptions(options: ISROptions = {}): RequestInit {
  const cacheOptions: RequestInit = {}
  if (options.revalidate !== undefined || options.tags) {
    cacheOptions.next = {
      ...(options.revalidate !== undefined && { revalidate: options.revalidate }),
      ...(options.tags && { tags: options.tags }),
    }
  }
  if (options.cache !== undefined) cacheOptions.cache = options.cache
  return cacheOptions
}

export function createCacheTags(type: string, slug?: string, extra: string[] = []): string[] {
  return [type, ...(slug ? [`${type}:${slug}`] : []), ...extra]
}

// ===== Public API =====

/**
 * Fetch a page of posts.
 */
export async function fetchPosts(options: FetchOptions = {}): Promise<WPAPIListResponse<WPPost>> {
  const { isr, ...fetchOpts } = options
  const isrOptions = isr || {}
  if (isrOptions.revalidate !== undefined && !isrOptions.tags) {
    isrOptions.tags = createCacheTags('posts')
  }
  const url = `${API_BASE_URL}/posts${buildQueryParams(fetchOpts)}`
  return fetchAndValidate(url, WPPostsSchema, buildISROptions(isrOptions))
}

/**
 * Fetch posts with pagination metadata from response headers.
 */
export async function fetchPostsWithPagination(
  options: FetchOptions = {}
): Promise<PaginatedResponse<WPPost>> {
  const { isr, ...fetchOpts } = options
  const isrOptions = isr || {}
  if (isrOptions.revalidate !== undefined && !isrOptions.tags) {
    isrOptions.tags = createCacheTags('posts')
  }
  const url = `${API_BASE_URL}/posts${buildQueryParams(fetchOpts)}`

  const { data, response } = await fetchAndValidateWithResponse(
    url,
    WPPostsSchema,
    buildISROptions(isrOptions)
  )

  const totalItems = parseInt(response.headers.get('X-WP-Total') || '0', 10) || data.length
  const totalPages = parseInt(response.headers.get('X-WP-TotalPages') || '1', 10)

  return {
    data: data as WPPost[],
    totalItems,
    totalPages,
    currentPage: options.page || 1,
  }
}

/**
 * Fetch a single post by slug.
 */
export async function fetchPost(
  slug: string,
  options: Omit<FetchOptions, 'search'> = {}
): Promise<WPPost> {
  const { isr, ...fetchOpts } = options
  const isrOptions = isr || {}
  if (isrOptions.revalidate !== undefined && !isrOptions.tags) {
    isrOptions.tags = createCacheTags('posts', slug)
  }

  const baseQuery = buildQueryParams(fetchOpts)
  const sep = baseQuery ? '&' : '?'
  const url = `${API_BASE_URL}/posts${baseQuery}${sep}slug=${slug}`

  const data = await fetchAndValidate(url, WPPostsSchema, buildISROptions(isrOptions))

  if (!data.length) throw new WPNotFoundError(slug)
  if (data[0].status === 'private') throw new WPForbiddenError(slug)

  return data[0] as WPPost
}

// Re-export schema for external use
export { WPPostSchema }
