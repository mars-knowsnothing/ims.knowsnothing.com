#!/usr/bin/env node

const { execSync } = require('child_process');
const fetch = require('node-fetch');

// Configuration
const BACKEND_URL = 'http://localhost:8000';
const FRONTEND_URL = 'http://localhost:3000';
const TEST_TIMEOUT = 30000;

class IntegrationTester {
    constructor() {
        this.results = {
            passed: 0,
            failed: 0,
            tests: []
        };
    }

    log(message, type = 'info') {
        const colors = {
            info: '\x1b[36m',
            success: '\x1b[32m',
            error: '\x1b[31m',
            warning: '\x1b[33m'
        };
        console.log(`${colors[type]}${message}\x1b[0m`);
    }

    async test(name, testFn) {
        try {
            this.log(`Running: ${name}`, 'info');
            await testFn();
            this.log(`✓ ${name}`, 'success');
            this.results.passed++;
            this.results.tests.push({ name, status: 'passed' });
        } catch (error) {
            this.log(`✗ ${name}: ${error.message}`, 'error');
            this.results.failed++;
            this.results.tests.push({ name, status: 'failed', error: error.message });
        }
    }

    async waitForService(url, serviceName, timeout = 30000) {
        const start = Date.now();
        while (Date.now() - start < timeout) {
            try {
                const response = await fetch(url);
                if (response.ok) {
                    this.log(`✓ ${serviceName} is ready`, 'success');
                    return true;
                }
            } catch (error) {
                // Service not ready yet
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        throw new Error(`${serviceName} not ready within ${timeout}ms`);
    }

    async testBackendHealth() {
        const response = await fetch(`${BACKEND_URL}/`);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(`Backend health check failed: ${response.status}`);
        }
        
        if (!data.message.includes('Welcome to the API')) {
            throw new Error('Backend root endpoint not returning expected message');
        }
    }

    async testFrontendHealth() {
        const response = await fetch(`${FRONTEND_URL}/`);
        
        if (!response.ok) {
            throw new Error(`Frontend health check failed: ${response.status}`);
        }

        const html = await response.text();
        if (!html.includes('<!DOCTYPE html>')) {
            throw new Error('Frontend not returning HTML');
        }
    }

    async testBlogPostsAPI() {
        // Test GET /posts
        const postsResponse = await fetch(`${BACKEND_URL}/posts`);
        if (!postsResponse.ok) {
            throw new Error('Failed to fetch posts');
        }
        
        const posts = await postsResponse.json();
        if (!Array.isArray(posts)) {
            throw new Error('Posts endpoint should return array');
        }

        // Test POST /posts
        const newPost = {
            title: 'Integration Test Post',
            content: 'This is a test post created during integration testing'
        };

        const createResponse = await fetch(`${BACKEND_URL}/posts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newPost)
        });

        if (!createResponse.ok) {
            throw new Error('Failed to create post');
        }

        const createdPost = await createResponse.json();
        if (createdPost.title !== newPost.title) {
            throw new Error('Created post title mismatch');
        }

        // Test GET specific post
        const getPostResponse = await fetch(`${BACKEND_URL}/posts/${createdPost.id}`);
        if (!getPostResponse.ok) {
            throw new Error('Failed to fetch specific post');
        }

        const fetchedPost = await getPostResponse.json();
        if (fetchedPost.id !== createdPost.id) {
            throw new Error('Fetched post ID mismatch');
        }
    }

    async testBooksAPI() {
        // Test GET /books
        const response = await fetch(`${BACKEND_URL}/books`);
        if (!response.ok) {
            throw new Error('Failed to fetch books');
        }

        const books = await response.json();
        if (!Array.isArray(books)) {
            throw new Error('Books endpoint should return array');
        }

        // Test creating a new book
        const newBook = {
            title: 'Integration Test Book',
            author: 'Test Author',
            year_published: 2024
        };

        const createResponse = await fetch(`${BACKEND_URL}/books`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newBook)
        });

        if (!createResponse.ok) {
            throw new Error('Failed to create book');
        }

        const createdBook = await createResponse.json();
        if (createdBook.title !== newBook.title) {
            throw new Error('Created book title mismatch');
        }
    }

    async testMoviesAPI() {
        // Test GET /movies
        const response = await fetch(`${BACKEND_URL}/movies`);
        if (!response.ok) {
            throw new Error('Failed to fetch movies');
        }

        const movies = await response.json();
        if (!Array.isArray(movies)) {
            throw new Error('Movies endpoint should return array');
        }

        // Test creating a new movie
        const newMovie = {
            title: 'Integration Test Movie',
            director: 'Test Director',
            release_year: 2024
        };

        const createResponse = await fetch(`${BACKEND_URL}/movies`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newMovie)
        });

        if (!createResponse.ok) {
            throw new Error('Failed to create movie');
        }

        const createdMovie = await createResponse.json();
        if (createdMovie.title !== newMovie.title) {
            throw new Error('Created movie title mismatch');
        }
    }

    async testChatAPI() {
        const chatMessage = { message: 'Hello, this is a test message' };
        
        const response = await fetch(`${BACKEND_URL}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(chatMessage)
        });

        if (!response.ok) {
            throw new Error(`Chat API failed: ${response.status}`);
        }

        // Check if response is streaming
        if (response.headers.get('content-type') !== 'text/plain; charset=utf-8') {
            throw new Error('Chat API should return streaming text response');
        }
    }

    async testFrontendBlogPage() {
        const response = await fetch(`${FRONTEND_URL}/blog`);
        if (!response.ok) {
            throw new Error(`Frontend blog page failed: ${response.status}`);
        }

        const html = await response.text();
        if (!html.includes('My Blog')) {
            throw new Error('Blog page not rendering correctly');
        }
    }

    async testFrontendChatPage() {
        const response = await fetch(`${FRONTEND_URL}/chat`);
        if (!response.ok) {
            throw new Error(`Frontend chat page failed: ${response.status}`);
        }

        const html = await response.text();
        if (!html.includes('<!DOCTYPE html>')) {
            throw new Error('Chat page not rendering HTML');
        }
    }

    async testCORSConfiguration() {
        const response = await fetch(`${BACKEND_URL}/posts`, {
            method: 'OPTIONS',
            headers: {
                'Origin': 'http://localhost:3000',
                'Access-Control-Request-Method': 'GET',
            }
        });

        if (!response.ok) {
            throw new Error('CORS preflight failed');
        }

        const allowOrigin = response.headers.get('access-control-allow-origin');
        if (!allowOrigin || allowOrigin === 'null') {
            throw new Error('CORS not properly configured');
        }
    }

    async runAllTests() {
        this.log('🚀 Starting Integration Tests', 'info');
        this.log('', 'info');

        // Wait for services to be ready
        await this.test('Backend Service Ready', () => this.waitForService(BACKEND_URL, 'Backend'));
        await this.test('Frontend Service Ready', () => this.waitForService(FRONTEND_URL, 'Frontend'));

        // Health checks
        await this.test('Backend Health Check', () => this.testBackendHealth());
        await this.test('Frontend Health Check', () => this.testFrontendHealth());

        // API functionality tests
        await this.test('Blog Posts API', () => this.testBlogPostsAPI());
        await this.test('Books API', () => this.testBooksAPI());
        await this.test('Movies API', () => this.testMoviesAPI());
        await this.test('Chat API', () => this.testChatAPI());

        // Frontend page tests
        await this.test('Frontend Blog Page', () => this.testFrontendBlogPage());
        await this.test('Frontend Chat Page', () => this.testFrontendChatPage());

        // Configuration tests
        await this.test('CORS Configuration', () => this.testCORSConfiguration());

        this.printResults();
    }

    printResults() {
        this.log('', 'info');
        this.log('=== Integration Test Results ===', 'info');
        this.log(`✓ Passed: ${this.results.passed}`, 'success');
        this.log(`✗ Failed: ${this.results.failed}`, 'error');
        this.log(`Total: ${this.results.tests.length}`, 'info');

        if (this.results.failed > 0) {
            this.log('', 'error');
            this.log('Failed Tests:', 'error');
            this.results.tests
                .filter(test => test.status === 'failed')
                .forEach(test => {
                    this.log(`  • ${test.name}: ${test.error}`, 'error');
                });
            process.exit(1);
        } else {
            this.log('', 'success');
            this.log('🎉 All integration tests passed!', 'success');
        }
    }
}

// Run tests
const tester = new IntegrationTester();
tester.runAllTests().catch(error => {
    console.error('Integration test runner failed:', error);
    process.exit(1);
});