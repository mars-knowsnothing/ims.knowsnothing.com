import Link from 'next/link';

// Define the type for a Post, matching the backend model
type Post = {
  id: number;
  title: string;
  content: string;
  created_at: string;
};

// This is a Server Component, so we can fetch data directly.
// We add { cache: 'no-store' } to ensure we get fresh data on every request,
// which is useful for development.
async function getPosts(): Promise<Post[]> {
  try {
    const res = await fetch('http://localhost:8000/posts', { cache: 'no-store' });
    if (!res.ok) {
      // This will be caught by the error boundary
      throw new Error('Failed to fetch posts');
    }
    return res.json();
  } catch (error) {
    console.error("Error fetching posts:", error);
    // In a real app, you'd handle this more gracefully.
    // For now, we return an empty array to prevent crashing the page.
    return [];
  }
}

export default async function BlogPage() {
  const posts = await getPosts();

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8 text-white">My Blog</h1>

      {posts.length === 0 ? (
        <p className="text-gray-400">
          Could not load posts. Is the backend server running?
        </p>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
            <Link href={`/blog/${post.id}`} key={post.id} className="block p-6 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors">
              <h2 className="text-2xl font-semibold text-blue-400 mb-2">{post.title}</h2>
              <p className="text-gray-300 line-clamp-2">
                {post.content}
              </p>
              <div className="text-sm text-gray-500 mt-4">
                {new Date(post.created_at).toLocaleDateString()}
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
