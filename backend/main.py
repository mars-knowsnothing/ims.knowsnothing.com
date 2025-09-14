from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
import uuid
from typing import List, Dict, Any, Optional
import asyncio
from contextlib import asynccontextmanager
import os

from database import Database
from gemini_ai import GeminiAI

# Pydantic models
class ChatMessage(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000, description="User message")
    session_id: Optional[str] = Field(None, description="Session ID for conversation continuity")

class ChatResponse(BaseModel):
    response: str
    session_id: str
    remaining_requests: int
    rate_limit_info: Dict[str, Any]

class RateLimitInfo(BaseModel):
    requests_made: int
    reset_time: Optional[str]
    time_until_reset: int
    limit: int = 3

class HealthCheck(BaseModel):
    status: str
    gemini_available: bool
    database_connected: bool

# Global instances
db = None
ai = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize services on startup and cleanup on shutdown"""
    global db, ai

    try:
        # Initialize database
        db = Database()
        print("✅ Database initialized successfully")

        # Initialize Gemini AI
        api_key = os.getenv("GOOGLE_API_KEY")
        if not api_key:
            print("⚠️  Warning: GOOGLE_API_KEY not found. Set this environment variable for AI functionality.")
            ai = None
        else:
            ai = GeminiAI(api_key)
            print("✅ Gemini AI initialized (validation skipped during startup)")

        # Clean up old database records
        if db:
            db.cleanup_old_sessions(days=7)
            print("✅ Database cleanup completed")

        yield

    except Exception as e:
        print(f"❌ Startup error: {e}")
        yield
    finally:
        print("🔄 Shutting down services...")

# Initialize FastAPI app
app = FastAPI(
    title="Anonymous Chat Backend",
    description="A FastAPI backend for Anonymous-themed chat using Google Gemini 2.5 Flash",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_client_ip(request: Request) -> str:
    """Get client IP address, handling proxies"""
    # Check for forwarded headers (for reverse proxies)
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()

    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip

    # Fall back to direct connection IP
    return request.client.host if request.client else "unknown"

@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    """Global rate limiting middleware"""
    # Skip rate limiting for health check and non-chat endpoints
    if request.url.path in ["/", "/health", "/rate-limit-info"]:
        return await call_next(request)

    if not db:
        return JSONResponse(
            status_code=503,
            content={"error": "Database service unavailable"}
        )

    # Apply rate limiting only to chat endpoint
    if request.url.path == "/chat" and request.method == "POST":
        ip_address = get_client_ip(request)
        is_allowed, remaining = db.check_rate_limit(ip_address, limit=3)

        if not is_allowed:
            rate_info = db.get_rate_limit_info(ip_address)
            return JSONResponse(
                status_code=429,
                content={
                    "error": "Rate limit exceeded",
                    "message": "You have exceeded the limit of 3 requests per hour. The collective values thoughtful discourse over spam.",
                    "rate_limit_info": rate_info
                }
            )

        # Add rate limit info to request for use in endpoint
        request.state.remaining_requests = remaining
        request.state.ip_address = ip_address

    return await call_next(request)

@app.get("/", response_model=Dict[str, str])
async def root():
    """Root endpoint"""
    return {
        "message": "Anonymous Chat Backend is running",
        "status": "We are Anonymous. We are Legion.",
        "version": "1.0.0"
    }

@app.get("/health", response_model=HealthCheck)
async def health_check():
    """Health check endpoint"""
    gemini_available = ai is not None
    database_connected = db is not None

    status = "healthy" if gemini_available and database_connected else "degraded"

    return HealthCheck(
        status=status,
        gemini_available=gemini_available,
        database_connected=database_connected
    )

@app.get("/rate-limit-info", response_model=RateLimitInfo)
async def get_rate_limit_info(request: Request):
    """Get rate limit information for the requesting IP"""
    if not db:
        raise HTTPException(status_code=503, detail="Database service unavailable")

    ip_address = get_client_ip(request)
    rate_info = db.get_rate_limit_info(ip_address)

    return RateLimitInfo(
        requests_made=rate_info["requests_made"],
        reset_time=rate_info["reset_time"],
        time_until_reset=rate_info["time_until_reset"],
        limit=3
    )

@app.post("/chat", response_model=ChatResponse)
async def chat(message_data: ChatMessage, request: Request):
    """Main chat endpoint with rate limiting and conversation history"""

    if not ai:
        raise HTTPException(
            status_code=503,
            detail="AI service unavailable. The collective's consciousness is temporarily offline."
        )

    if not db:
        raise HTTPException(
            status_code=503,
            detail="Database service unavailable"
        )

    try:
        # Get IP and rate limit info from middleware
        ip_address = getattr(request.state, 'ip_address', get_client_ip(request))
        remaining_requests = getattr(request.state, 'remaining_requests', 0)

        # Generate or use provided session ID
        session_id = message_data.session_id or str(uuid.uuid4())

        # Get conversation history for context
        conversation_history = db.get_conversation_history(ip_address, session_id)

        # Generate AI response
        response_text = await ai.generate_response(
            message_data.message,
            conversation_history
        )

        # Save conversation to database
        db.save_conversation(
            ip_address=ip_address,
            session_id=session_id,
            message=message_data.message,
            response=response_text
        )

        # Get updated rate limit info
        rate_limit_info = db.get_rate_limit_info(ip_address)

        return ChatResponse(
            response=response_text,
            session_id=session_id,
            remaining_requests=remaining_requests,
            rate_limit_info=rate_limit_info
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred while processing your request: {str(e)}"
        )

@app.get("/conversation/{session_id}")
async def get_conversation_history(session_id: str, request: Request):
    """Get conversation history for a session"""
    if not db:
        raise HTTPException(status_code=503, detail="Database service unavailable")

    ip_address = get_client_ip(request)
    history = db.get_conversation_history(ip_address, session_id)

    return {
        "session_id": session_id,
        "conversation_history": history,
        "message_count": len(history)
    }

@app.delete("/conversation/{session_id}")
async def clear_conversation(session_id: str, request: Request):
    """Clear conversation history for a session (placeholder - implement if needed)"""
    return {
        "message": "Conversation clearing not implemented yet",
        "session_id": session_id
    }

@app.get("/model-info")
async def get_model_info():
    """Get information about the AI model"""
    if not ai:
        raise HTTPException(status_code=503, detail="AI service unavailable")

    return ai.get_model_info()

# Error handlers
@app.exception_handler(429)
async def rate_limit_handler(request: Request, exc):
    return JSONResponse(
        status_code=429,
        content={
            "error": "Rate limit exceeded",
            "message": "The collective requires patience. You may try again in an hour.",
        }
    )

@app.exception_handler(500)
async def internal_error_handler(request: Request, exc):
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "message": "An anomaly has occurred in the matrix. The collective will adapt and overcome.",
        }
    )

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=True,
        log_level="info"
    )
