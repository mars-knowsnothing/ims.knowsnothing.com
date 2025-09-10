// Define the type for a Book, matching the backend model
type Book = {
  id: number;
  title: string;
  author: string;
  year_published: number | null;
};

// This is a Server Component, so we can fetch data directly.
async function getBooks(): Promise<Book[]> {
  try {
    const res = await fetch('http://localhost:8000/books', { cache: 'no-store' });
    if (!res.ok) {
      throw new Error('Failed to fetch books');
    }
    return res.json();
  } catch (error) {
    console.error("Error fetching books:", error);
    return [];
  }
}

export default async function BookshelfPage() {
  const books = await getBooks();

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8 text-white">My Bookshelf</h1>

      {books.length === 0 ? (
        <p className="text-gray-400">
          Could not load books. Is the backend server running?
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {books.map((book) => (
            <div key={book.id} className="bg-gray-800 rounded-lg p-6 flex flex-col">
              <h2 className="text-2xl font-semibold text-blue-400 mb-2">{book.title}</h2>
              <p className="text-gray-300 mb-4">by {book.author}</p>
              {book.year_published && (
                <p className="text-sm text-gray-500 mt-auto">
                  Published in {book.year_published}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
