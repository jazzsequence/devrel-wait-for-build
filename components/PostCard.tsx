import Link from 'next/link'
import Image from 'next/image'
import { format } from 'date-fns'
import { decodeHtmlEntities, excerptToDescription, normalizeWordPressUrl } from '@/lib/utils/html'
import type { WPPost } from '@/lib/wordpress/types'

interface PostCardProps {
  post: WPPost
  priority?: boolean
}

export default function PostCard({ post, priority = false }: PostCardProps) {
  const featuredMedia = post._embedded?.['wp:featuredmedia']?.[0]
  const hasImage = post.featured_media > 0 && featuredMedia
  const formattedDate = format(new Date(post.date), 'MMMM d, yyyy')
  const excerpt = excerptToDescription(post.excerpt.rendered) ?? ''

  return (
    <article className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden group transition-colors hover:border-gray-400 dark:hover:border-gray-500">
      <Link href={`/posts/${post.slug}`} className="block relative h-52 overflow-hidden">
        {hasImage ? (
          <Image
            src={normalizeWordPressUrl(featuredMedia.source_url)}
            alt={featuredMedia.alt_text || decodeHtmlEntities(post.title.rendered)}
            fill
            priority={priority}
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) calc(100vw - 32px), (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-900" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <time className="text-gray-300 text-xs font-mono block mb-1">{formattedDate}</time>
          <h2 className="font-bold text-white text-base leading-snug">
            {decodeHtmlEntities(post.title.rendered)}
          </h2>
        </div>
      </Link>

      <div className="p-4">
        {excerpt && (
          <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-3 line-clamp-3">
            {excerpt}
          </p>
        )}
        <Link
          href={`/posts/${post.slug}`}
          className="text-blue-600 dark:text-blue-400 text-sm font-medium hover:underline"
        >
          Read more →
        </Link>
      </div>
    </article>
  )
}
