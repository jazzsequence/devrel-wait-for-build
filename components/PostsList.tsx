import PostCard from './PostCard'
import type { WPPost } from '@/lib/wordpress/types'

interface PostsListProps {
  posts: WPPost[]
}

export default function PostsList({ posts }: PostsListProps) {
  return (
    <div className="pds-grid">
      {posts.map((post, index) => (
        <div key={post.id} className="pds-grid-item pds-grid-item--md-6 pds-grid-item--lg-4">
          <PostCard post={post} priority={index < 3} />
        </div>
      ))}
    </div>
  )
}
