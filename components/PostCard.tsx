'use client'
import Link from 'next/link'
import Image from 'next/image'
import { format } from 'date-fns'
import { Card, CardHeading } from '@pantheon-systems/pds-toolkit-react'
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
    <Link href={`/posts/${post.slug}`} style={{ textDecoration: 'none', display: 'block', height: '100%' }}>
      <Card style={{ height: '100%' }}>
        {hasImage && (
          <div slot="image" style={{ position: 'relative', height: '200px' }}>
            <Image
              src={normalizeWordPressUrl(featuredMedia.source_url)}
              alt={featuredMedia.alt_text || decodeHtmlEntities(post.title.rendered)}
              fill
              priority={priority}
              style={{ objectFit: 'cover' }}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
        )}
        <div>
          <p className="pds-overline-text pds-overline-text--sm">{formattedDate}</p>
          <CardHeading
            text={decodeHtmlEntities(post.title.rendered)}
            level="h2"
            fontSize="L"
          />
          {excerpt && (
            <p className="pds-ts-s pds-mar-block-end-m">{excerpt}</p>
          )}
          <span className="pds-ts-s pds-fw-semibold">Read more →</span>
        </div>
      </Card>
    </Link>
  )
}
