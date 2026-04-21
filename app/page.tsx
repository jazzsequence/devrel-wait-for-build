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
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <header className="mb-10">
        <h1 className="text-4xl font-bold mb-2">jazzsequence.com</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Latest posts via the WordPress REST API
        </p>
      </header>

      {error && (
        <p className="text-red-600 dark:text-red-400 mb-6">{error}</p>
      )}

      {!error && posts.length === 0 && (
        <p className="text-gray-500">No posts found.</p>
      )}

      {!error && posts.length > 0 && <PostsList posts={posts} />}
    </main>
  )
}
