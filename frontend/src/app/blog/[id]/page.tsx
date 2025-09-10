import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Define the type for a Post, matching the backend model
type Post = {
  id: number;
  title: string;
  content: string;
  created_at: string;
};

// This function fetches a single post by its ID
async function getPost(id: string): Promise<Post | null> {
  try {
    const res = await fetch(`http://localhost:8000/posts/${id}`, { cache: 'no-store' });
    if (res.status === 404) {
      return null; // Post not found
    }
    if (!res.ok) {
      throw new Error('Failed to fetch post');
    }
    return res.json();
  } catch (error) {
    console.error("Error fetching post:", error);
    return null;
  }
}

// The page component receives params, which includes the dynamic segment [id]
export default async function BlogPostPage({ params }: { params: { id: string } }) {
  const post = await getPost(params.id);

  if (!post) {
    return (
      <main className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-4xl font-bold text-red-500 mb-4">Post Not Found</h1>
        <p className="text-gray-400">The post you are looking for does not exist.</p>
        <Link href="/blog" className="mt-8 inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500">
          Back to Blog
        </Link>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/blog" className="text-blue-400 hover:underline mb-8 block">
          &larr; Back to Blog
        </Link>
        <h1 className="text-5xl font-extrabold text-white mb-4">{post.title}</h1>
        <div className="text-sm text-gray-500 mb-8">
          Published on {new Date(post.created_at).toLocaleDateString()}
        </div>
        <article className="prose prose-invert prose-lg max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {post.content}
          </ReactMarkdown>
        </article>
      </div>
    </main>
  );
}
