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

// Receives the params Promise directly so it can be awaited inside the Suspense boundary
async function PostContent({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getPost(slug)

  if (!post) notFound()

  const featuredMedia = post._embedded?.['wp:featuredmedia']?.[0]
  const hasImage = post.featured_media > 0 && featuredMedia

  return (
    <article>
      <header className="mb-8">
        <time className="text-gray-500 dark:text-gray-400 text-sm font-mono block mb-3">
          {format(new Date(post.date), 'MMMM d, yyyy')}
        </time>
        <h1 className="text-3xl font-bold mb-6 leading-snug">
          {decodeHtmlEntities(post.title.rendered)}
        </h1>
        {hasImage && (
          <div className="relative w-full h-64 sm:h-96 rounded-xl overflow-hidden mb-8">
            <Image
              src={normalizeWordPressUrl(featuredMedia.source_url)}
              alt={featuredMedia.alt_text || decodeHtmlEntities(post.title.rendered)}
              fill
              priority
              className="object-cover"
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

export default function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <Link
        href="/"
        className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-8 inline-block transition-colors"
      >
        ← All posts
      </Link>
      <Suspense fallback={<p className="text-gray-500 mt-8">Loading post…</p>}>
        <PostContent params={params} />
      </Suspense>
    </main>
  )
}
