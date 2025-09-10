// Define the type for a Movie, matching the backend model
type Movie = {
  id: number;
  title: string;
  director: string;
  release_year: number | null;
};

// This is a Server Component, so we can fetch data directly.
async function getMovies(): Promise<Movie[]> {
  try {
    const res = await fetch('http://localhost:8000/movies', { cache: 'no-store' });
    if (!res.ok) {
      throw new Error('Failed to fetch movies');
    }
    return res.json();
  } catch (error) {
    console.error("Error fetching movies:", error);
    return [];
  }
}

export default async function MovieLibraryPage() {
  const movies = await getMovies();

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8 text-white">My Movie Library</h1>

      {movies.length === 0 ? (
        <p className="text-gray-400">
          Could not load movies. Is the backend server running?
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {movies.map((movie) => (
            <div key={movie.id} className="bg-gray-800 rounded-lg p-6 flex flex-col">
              <h2 className="text-2xl font-semibold text-purple-400 mb-2">{movie.title}</h2>
              <p className="text-gray-300 mb-4">Directed by {movie.director}</p>
              {movie.release_year && (
                <p className="text-sm text-gray-500 mt-auto">
                  Released in {movie.release_year}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
