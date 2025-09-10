import os
import google.generativeai as genai
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import datetime
import asyncio
import logging

# --- Logging Configuration ---
logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(levelname)s - %(message)s',
                    filename='/app/backend.log',
                    filemode='w')

# --- Environment and AI Configuration ---
load_dotenv()
try:
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise KeyError("GEMINI_API_KEY not found or is empty.")
    genai.configure(api_key=api_key)
    logging.info("Gemini AI configured successfully.")
except KeyError as e:
    logging.error(f"FATAL: {e}")

# --- Pydantic Models ---
class PostBase(BaseModel):
    title: str
    content: str
class PostCreate(PostBase): pass
class Post(PostBase):
    id: int
    created_at: datetime.datetime

class BookBase(BaseModel):
    title: str
    author: str
    year_published: Optional[int] = None
class BookCreate(BookBase): pass
class Book(BookBase): id: int

class MovieBase(BaseModel):
    title: str
    director: str
    release_year: Optional[int] = None
class MovieCreate(MovieBase): pass
class Movie(MovieBase): id: int

class ChatMessage(BaseModel): message: str

# --- In-Memory Database ---
db_posts: List[Post] = [
    Post(id=1, title="Welcome to My Blog", content="This is the first post on my new, modern blog! Stay tuned for more.", created_at=datetime.datetime.now()),
    Post(id=2, title="FastAPI is Awesome", content="Building this API with FastAPI has been a breeze. It's so fast and intuitive.", created_at=datetime.datetime.now()),
]
db_books: List[Book] = [
    Book(id=1, title="Dune", author="Frank Herbert", year_published=1965),
    Book(id=2, title="Neuromancer", author="William Gibson", year_published=1984),
]
db_movies: List[Movie] = [
    Movie(id=1, title="Blade Runner 2049", director="Denis Villeneuve", release_year=2017),
    Movie(id=2, title="The Matrix", director="Wachowskis", release_year=1999),
]

# --- FastAPI App ---
app = FastAPI(title="Mars' Personal Website API")
origins = ["http://localhost:3000", "http://localhost:3001"]
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

@app.get("/")
def read_root(): return {"message": "Welcome to the API for Mars' personal website."}

# --- Blog Post Endpoints ---
@app.get("/posts", response_model=List[Post])
def get_posts(): return sorted(db_posts, key=lambda p: p.id, reverse=True)
@app.get("/posts/{post_id}", response_model=Post)
def get_post(post_id: int):
    post = next((p for p in db_posts if p.id == post_id), None)
    if not post: raise HTTPException(status_code=404, detail="Post not found")
    return post
@app.post("/posts", response_model=Post, status_code=201)
def create_post(post: PostCreate):
    new_id = max(p.id for p in db_posts) + 1 if db_posts else 1
    new_post = Post(id=new_id, created_at=datetime.datetime.now(), **post.model_dump())
    db_posts.append(new_post)
    return new_post
@app.put("/posts/{post_id}", response_model=Post)
def update_post(post_id: int, post_update: PostCreate):
    post = next((p for p in db_posts if p.id == post_id), None)
    if not post: raise HTTPException(status_code=404, detail="Post not found")
    update_data = post_update.model_dump(exclude_unset=True)
    for key, value in update_data.items(): setattr(post, key, value)
    return post
@app.delete("/posts/{post_id}", status_code=204)
def delete_post(post_id: int):
    post_index = next((i for i, p in enumerate(db_posts) if p.id == post_id), None)
    if post_index is None: raise HTTPException(status_code=404, detail="Post not found")
    db_posts.pop(post_index)

# --- Book Endpoints ---
@app.get("/books", response_model=List[Book])
def get_books(): return db_books
@app.get("/books/{book_id}", response_model=Book)
def get_book(book_id: int):
    book = next((b for b in db_books if b.id == book_id), None)
    if not book: raise HTTPException(status_code=404, detail="Book not found")
    return book
@app.post("/books", response_model=Book, status_code=201)
def create_book(book: BookCreate):
    new_id = max(b.id for b in db_books) + 1 if db_books else 1
    new_book = Book(id=new_id, **book.model_dump())
    db_books.append(new_book)
    return new_book
@app.put("/books/{book_id}", response_model=Book)
def update_book(book_id: int, book_update: BookCreate):
    book = next((b for b in db_books if b.id == book_id), None)
    if not book: raise HTTPException(status_code=404, detail="Book not found")
    update_data = book_update.model_dump(exclude_unset=True)
    for key, value in update_data.items(): setattr(book, key, value)
    return book
@app.delete("/books/{book_id}", status_code=204)
def delete_book(book_id: int):
    book_index = next((i for i, b in enumerate(db_books) if b.id == book_id), None)
    if book_index is None: raise HTTPException(status_code=404, detail="Book not found")
    db_books.pop(book_index)

# --- Movie Endpoints ---
@app.get("/movies", response_model=List[Movie])
def get_movies(): return db_movies
@app.get("/movies/{movie_id}", response_model=Movie)
def get_movie(movie_id: int):
    movie = next((m for m in db_movies if m.id == movie_id), None)
    if not movie: raise HTTPException(status_code=404, detail="Movie not found")
    return movie
@app.post("/movies", response_model=Movie, status_code=201)
def create_movie(movie: MovieCreate):
    new_id = max(m.id for m in db_movies) + 1 if db_movies else 1
    new_movie = Movie(id=new_id, **movie.model_dump())
    db_movies.append(new_movie)
    return new_movie
@app.put("/movies/{movie_id}", response_model=Movie)
def update_movie(movie_id: int, movie_update: MovieCreate):
    movie = next((m for m in db_movies if m.id == movie_id), None)
    if not movie: raise HTTPException(status_code=404, detail="Movie not found")
    update_data = movie_update.model_dump(exclude_unset=True)
    for key, value in update_data.items(): setattr(movie, key, value)
    return movie
@app.delete("/movies/{movie_id}", status_code=204)
def delete_movie(movie_id: int):
    movie_index = next((i for i, m in enumerate(db_movies) if m.id == movie_id), None)
    if movie_index is None: raise HTTPException(status_code=404, detail="Movie not found")
    db_movies.pop(movie_index)

# --- AI Chat Endpoint ---
async def stream_gemini_response(prompt: str):
    try:
        model = genai.GenerativeModel('models/gemini-1.5-flash-latest')
        response = await model.generate_content_async(prompt, stream=True)
        async for chunk in response:
            if chunk.text:
                yield chunk.text
                await asyncio.sleep(0.05)
    except Exception as e:
        logging.error(f"Error during Gemini API call: {e}", exc_info=True)
        yield "Sorry, I encountered an error while processing your request."
@app.post("/chat")
async def chat(chat_message: ChatMessage):
    return StreamingResponse(stream_gemini_response(chat_message.message), media_type="text/plain")
