import { fetchPostsWithPagination } from '@/lib/wordpress/client'
import type { WPPost } from '@/lib/wordpress/types'
import PostsList from '@/components/PostsList'
import { cacheLife, cacheTag } from 'next/cache'

async function getPosts(): Promise<{ posts: WPPost[]; error?: string }> {
  'use cache'
  cacheLife('blog')
  cacheTag('posts')

  try {
    const result = await fetchPostsWithPagination({
      perPage: 9,
      embed: true,
    })
    return { posts: result.data }
  } catch {
    return { posts: [], error: 'Failed to load posts.' }
  }
}

export default async function Home() {
  const { posts, error } = await getPosts()

  return (
    <main className="pds-container pds-container--x-wide" style={{ padding: '3rem 1.5rem' }}>
      <header style={{ marginBottom: '2.5rem' }}>
        <h1 className="pds-ts-3xl pds-fw-bold pds-mar-block-end-s">Latest Posts</h1>
        <p className="pds-ts-m">Pulled live from jazzsequence.com via the WordPress REST API</p>
      </header>

      {error && <p style={{ color: 'var(--pds-color-text-critical, red)' }}>{error}</p>}
      {!error && posts.length === 0 && <p className="pds-ts-m">No posts found.</p>}
      {!error && posts.length > 0 && <PostsList posts={posts} />}
    </main>
  )
}
