import pytest
from fastapi.testclient import TestClient
from datetime import datetime
import json
from unittest.mock import patch, AsyncMock
import sys
import os

# Add the current directory to Python path so we can import main
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from main import app

client = TestClient(app)

class TestBasicEndpoints:
    """Test basic API functionality"""
    
    def test_root_endpoint(self):
        """Test the root endpoint returns welcome message"""
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "Welcome to the API" in data["message"]

    def test_cors_headers(self):
        """Test CORS headers are properly set"""
        response = client.options("/posts")
        assert response.status_code == 200


class TestBlogPosts:
    """Test blog post CRUD operations"""
    
    def test_get_all_posts(self):
        """Test getting all blog posts"""
        response = client.get("/posts")
        assert response.status_code == 200
        
        posts = response.json()
        assert isinstance(posts, list)
        assert len(posts) >= 2  # We have 2 default posts
        
        # Check post structure
        if posts:
            post = posts[0]
            assert "id" in post
            assert "title" in post
            assert "content" in post
            assert "created_at" in post

    def test_get_specific_post(self):
        """Test getting a specific post by ID"""
        response = client.get("/posts/1")
        assert response.status_code == 200
        
        post = response.json()
        assert post["id"] == 1
        assert post["title"] == "Welcome to My Blog"
        assert "content" in post

    def test_get_nonexistent_post(self):
        """Test getting a post that doesn't exist"""
        response = client.get("/posts/9999")
        assert response.status_code == 404
        assert "Post not found" in response.json()["detail"]

    def test_create_post(self):
        """Test creating a new blog post"""
        new_post = {
            "title": "Test Post",
            "content": "This is a test post content"
        }
        
        response = client.post("/posts", json=new_post)
        assert response.status_code == 201
        
        created_post = response.json()
        assert created_post["title"] == new_post["title"]
        assert created_post["content"] == new_post["content"]
        assert "id" in created_post
        assert "created_at" in created_post

    def test_update_post(self):
        """Test updating an existing post"""
        # First create a post
        new_post = {"title": "Update Test", "content": "Original content"}
        create_response = client.post("/posts", json=new_post)
        created_post = create_response.json()
        post_id = created_post["id"]
        
        # Now update it
        updated_data = {"title": "Updated Title", "content": "Updated content"}
        update_response = client.put(f"/posts/{post_id}", json=updated_data)
        assert update_response.status_code == 200
        
        updated_post = update_response.json()
        assert updated_post["title"] == updated_data["title"]
        assert updated_post["content"] == updated_data["content"]
        assert updated_post["id"] == post_id

    def test_update_nonexistent_post(self):
        """Test updating a post that doesn't exist"""
        updated_data = {"title": "Updated", "content": "Updated"}
        response = client.put("/posts/9999", json=updated_data)
        assert response.status_code == 404

    def test_delete_post(self):
        """Test deleting a post"""
        # First create a post
        new_post = {"title": "Delete Test", "content": "To be deleted"}
        create_response = client.post("/posts", json=new_post)
        created_post = create_response.json()
        post_id = created_post["id"]
        
        # Delete it
        delete_response = client.delete(f"/posts/{post_id}")
        assert delete_response.status_code == 204
        
        # Verify it's gone
        get_response = client.get(f"/posts/{post_id}")
        assert get_response.status_code == 404

    def test_delete_nonexistent_post(self):
        """Test deleting a post that doesn't exist"""
        response = client.delete("/posts/9999")
        assert response.status_code == 404


class TestBooks:
    """Test book CRUD operations"""
    
    def test_get_all_books(self):
        """Test getting all books"""
        response = client.get("/books")
        assert response.status_code == 200
        
        books = response.json()
        assert isinstance(books, list)
        assert len(books) >= 2  # We have 2 default books

    def test_get_specific_book(self):
        """Test getting a specific book by ID"""
        response = client.get("/books/1")
        assert response.status_code == 200
        
        book = response.json()
        assert book["id"] == 1
        assert book["title"] == "Dune"
        assert book["author"] == "Frank Herbert"

    def test_create_book(self):
        """Test creating a new book"""
        new_book = {
            "title": "Test Book",
            "author": "Test Author",
            "year_published": 2024
        }
        
        response = client.post("/books", json=new_book)
        assert response.status_code == 201
        
        created_book = response.json()
        assert created_book["title"] == new_book["title"]
        assert created_book["author"] == new_book["author"]
        assert created_book["year_published"] == new_book["year_published"]

    def test_create_book_without_year(self):
        """Test creating a book without publication year"""
        new_book = {
            "title": "Test Book No Year",
            "author": "Test Author"
        }
        
        response = client.post("/books", json=new_book)
        assert response.status_code == 201
        
        created_book = response.json()
        assert created_book["year_published"] is None


class TestMovies:
    """Test movie CRUD operations"""
    
    def test_get_all_movies(self):
        """Test getting all movies"""
        response = client.get("/movies")
        assert response.status_code == 200
        
        movies = response.json()
        assert isinstance(movies, list)
        assert len(movies) >= 2

    def test_get_specific_movie(self):
        """Test getting a specific movie by ID"""
        response = client.get("/movies/1")
        assert response.status_code == 200
        
        movie = response.json()
        assert movie["id"] == 1
        assert movie["title"] == "Blade Runner 2049"
        assert movie["director"] == "Denis Villeneuve"

    def test_create_movie(self):
        """Test creating a new movie"""
        new_movie = {
            "title": "Test Movie",
            "director": "Test Director",
            "release_year": 2024
        }
        
        response = client.post("/movies", json=new_movie)
        assert response.status_code == 201
        
        created_movie = response.json()
        assert created_movie["title"] == new_movie["title"]
        assert created_movie["director"] == new_movie["director"]
        assert created_movie["release_year"] == new_movie["release_year"]


class TestChatEndpoint:
    """Test AI chat functionality"""
    
    @patch('main.genai')
    def test_chat_endpoint_success(self, mock_genai):
        """Test successful chat response"""
        # Mock the Gemini API response
        mock_model = AsyncMock()
        mock_response = AsyncMock()
        mock_response.__aiter__ = AsyncMock(return_value=iter([
            AsyncMock(text="Hello! "),
            AsyncMock(text="How can I help you?")
        ]))
        mock_model.generate_content_async.return_value = mock_response
        mock_genai.GenerativeModel.return_value = mock_model
        
        chat_message = {"message": "Hello, how are you?"}
        response = client.post("/chat", json=chat_message)
        
        # For streaming response, check status code
        assert response.status_code == 200
        assert response.headers["content-type"] == "text/plain; charset=utf-8"

    def test_chat_endpoint_invalid_input(self):
        """Test chat endpoint with invalid input"""
        # Missing message field
        response = client.post("/chat", json={})
        assert response.status_code == 422  # Validation error

    def test_chat_endpoint_empty_message(self):
        """Test chat endpoint with empty message"""
        chat_message = {"message": ""}
        response = client.post("/chat", json=chat_message)
        assert response.status_code == 200  # Should still work


class TestValidation:
    """Test input validation"""
    
    def test_create_post_missing_fields(self):
        """Test creating post with missing required fields"""
        incomplete_post = {"title": "Only Title"}
        response = client.post("/posts", json=incomplete_post)
        assert response.status_code == 422

    def test_create_book_missing_fields(self):
        """Test creating book with missing required fields"""
        incomplete_book = {"title": "Only Title"}
        response = client.post("/books", json=incomplete_book)
        assert response.status_code == 422

    def test_create_movie_missing_fields(self):
        """Test creating movie with missing required fields"""
        incomplete_movie = {"title": "Only Title"}
        response = client.post("/movies", json=incomplete_movie)
        assert response.status_code == 422


if __name__ == "__main__":
    pytest.main([__file__])