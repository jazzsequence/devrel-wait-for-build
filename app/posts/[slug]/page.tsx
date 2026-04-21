import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { format } from 'date-fns'
import { cacheLife, cacheTag } from 'next/cache'
import { fetchPost, WPNotFoundError, WPForbiddenError } from '@/lib/wordpress/client'
import { decodeHtmlEntities, normalizeWordPressUrl } from '@/lib/utils/html'
import type { WPPost } from '@/lib/wordpress/types'

async function getPost(slug: string): Promise<WPPost | null> {
  'use cache'
  cacheLife('blog')
  cacheTag('posts', `post:${slug}`)

  try {
    return await fetchPost(slug, { embed: true })
  } catch (error) {
    if (error instanceof WPNotFoundError || error instanceof WPForbiddenError) return null
    throw error
  }
}

async function PostContent({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getPost(slug)

  if (!post) notFound()

  const featuredMedia = post._embedded?.['wp:featuredmedia']?.[0]
  const hasImage = post.featured_media > 0 && featuredMedia

  return (
    <article>
      <header style={{ marginBottom: '2rem' }}>
        <time className="pds-overline-text pds-overline-text--sm" style={{ display: 'block', marginBottom: '0.5rem' }}>
          {format(new Date(post.date), 'MMMM d, yyyy')}
        </time>
        <h1 className="pds-ts-3xl pds-fw-bold" style={{ marginBottom: '1.5rem' }}>
          {decodeHtmlEntities(post.title.rendered)}
        </h1>
        {hasImage && (
          <div style={{ position: 'relative', width: '100%', height: '400px', borderRadius: '0.5rem', overflow: 'hidden', marginBottom: '2rem' }}>
            <Image
              src={normalizeWordPressUrl(featuredMedia.source_url)}
              alt={featuredMedia.alt_text || decodeHtmlEntities(post.title.rendered)}
              fill
              priority
              style={{ objectFit: 'cover' }}
              sizes="(max-width: 768px) 100vw, 768px"
            />
          </div>
        )}
      </header>

      <div
        className="post-content"
        dangerouslySetInnerHTML={{ __html: post.content.rendered }}
      />
    </article>
  )
}

function PostSkeleton() {
  const bar = (w: string, h: string) => (
    <div className="pds-shimmer" style={{ width: w, height: h, borderRadius: '4px' }} />
  )
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {bar('60%', '2.5rem')}
      {bar('100%', '24rem')}
      {bar('100%', '1rem')}
      {bar('100%', '1rem')}
      {bar('80%', '1rem')}
    </div>
  )
}

export default function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <main className="pds-container pds-container--narrow" style={{ padding: '3rem 1.5rem' }}>
      <Link href="/" className="pds-ts-s" style={{ display: 'inline-block', marginBottom: '2rem' }}>
        ← All posts
      </Link>
      <Suspense fallback={<PostSkeleton />}>
        <PostContent params={params} />
      </Suspense>
    </main>
  )
}
