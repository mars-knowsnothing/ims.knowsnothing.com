import sqlite3
import asyncio
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
import os
import json

class Database:
    def __init__(self, db_path: str = "anonymous_chat.db"):
        self.db_path = db_path
        self.init_database()

    def init_database(self):
        """Initialize the database with required tables"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()

            # Rate limiting table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS rate_limits (
                    ip_address TEXT PRIMARY KEY,
                    request_count INTEGER DEFAULT 0,
                    last_reset TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)

            # Chat history table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS chat_history (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    ip_address TEXT NOT NULL,
                    session_id TEXT NOT NULL,
                    message TEXT NOT NULL,
                    response TEXT NOT NULL,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)

            # Conversation sessions table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS conversation_sessions (
                    session_id TEXT PRIMARY KEY,
                    ip_address TEXT NOT NULL,
                    conversation_history TEXT DEFAULT '[]',
                    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)

            conn.commit()

    def check_rate_limit(self, ip_address: str, limit: int = 3) -> tuple[bool, int]:
        """
        Check if IP has exceeded rate limit (3 requests per hour)
        Returns (is_allowed, remaining_requests)
        """
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()

            # Get current rate limit data
            cursor.execute("""
                SELECT request_count, last_reset FROM rate_limits WHERE ip_address = ?
            """, (ip_address,))

            result = cursor.fetchone()
            current_time = datetime.now()

            if result is None:
                # First request from this IP
                cursor.execute("""
                    INSERT INTO rate_limits (ip_address, request_count, last_reset)
                    VALUES (?, 1, ?)
                """, (ip_address, current_time))
                conn.commit()
                return True, limit - 1

            request_count, last_reset = result
            last_reset = datetime.fromisoformat(last_reset)

            # Check if we need to reset the counter (1 hour has passed)
            if current_time - last_reset >= timedelta(hours=1):
                cursor.execute("""
                    UPDATE rate_limits
                    SET request_count = 1, last_reset = ?
                    WHERE ip_address = ?
                """, (current_time, ip_address))
                conn.commit()
                return True, limit - 1

            # Check if limit exceeded
            if request_count >= limit:
                return False, 0

            # Increment counter
            cursor.execute("""
                UPDATE rate_limits
                SET request_count = request_count + 1
                WHERE ip_address = ?
            """, (ip_address,))
            conn.commit()

            return True, limit - (request_count + 1)

    def get_conversation_history(self, ip_address: str, session_id: str) -> List[Dict[str, str]]:
        """Get conversation history for an IP and session"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()

            cursor.execute("""
                SELECT conversation_history FROM conversation_sessions
                WHERE ip_address = ? AND session_id = ?
            """, (ip_address, session_id))

            result = cursor.fetchone()
            if result:
                try:
                    return json.loads(result[0])
                except json.JSONDecodeError:
                    return []
            return []

    def save_conversation(self, ip_address: str, session_id: str, message: str, response: str):
        """Save a conversation turn and update session history"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()

            # Save individual chat record
            cursor.execute("""
                INSERT INTO chat_history (ip_address, session_id, message, response)
                VALUES (?, ?, ?, ?)
            """, (ip_address, session_id, message, response))

            # Get or create conversation session
            cursor.execute("""
                SELECT conversation_history FROM conversation_sessions
                WHERE ip_address = ? AND session_id = ?
            """, (ip_address, session_id))

            result = cursor.fetchone()
            current_time = datetime.now()

            if result:
                # Update existing session
                try:
                    history = json.loads(result[0])
                except json.JSONDecodeError:
                    history = []

                history.append({
                    "role": "user",
                    "content": message,
                    "timestamp": current_time.isoformat()
                })
                history.append({
                    "role": "assistant",
                    "content": response,
                    "timestamp": current_time.isoformat()
                })

                # Keep only last 20 messages (10 turns) to prevent database bloat
                if len(history) > 20:
                    history = history[-20:]

                cursor.execute("""
                    UPDATE conversation_sessions
                    SET conversation_history = ?, last_activity = ?
                    WHERE ip_address = ? AND session_id = ?
                """, (json.dumps(history), current_time, ip_address, session_id))
            else:
                # Create new session
                history = [
                    {
                        "role": "user",
                        "content": message,
                        "timestamp": current_time.isoformat()
                    },
                    {
                        "role": "assistant",
                        "content": response,
                        "timestamp": current_time.isoformat()
                    }
                ]

                cursor.execute("""
                    INSERT INTO conversation_sessions (session_id, ip_address, conversation_history, last_activity)
                    VALUES (?, ?, ?, ?)
                """, (session_id, ip_address, json.dumps(history), current_time))

            conn.commit()

    def cleanup_old_sessions(self, days: int = 7):
        """Clean up sessions older than specified days"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cutoff_date = datetime.now() - timedelta(days=days)

            cursor.execute("""
                DELETE FROM conversation_sessions
                WHERE last_activity < ?
            """, (cutoff_date,))

            cursor.execute("""
                DELETE FROM chat_history
                WHERE created_at < ?
            """, (cutoff_date,))

            conn.commit()

    def get_rate_limit_info(self, ip_address: str) -> Dict[str, Any]:
        """Get rate limit information for an IP"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()

            cursor.execute("""
                SELECT request_count, last_reset FROM rate_limits WHERE ip_address = ?
            """, (ip_address,))

            result = cursor.fetchone()
            if not result:
                return {"requests_made": 0, "reset_time": None, "time_until_reset": 0}

            request_count, last_reset = result
            last_reset = datetime.fromisoformat(last_reset)
            next_reset = last_reset + timedelta(hours=1)
            time_until_reset = max(0, (next_reset - datetime.now()).total_seconds())

            return {
                "requests_made": request_count,
                "reset_time": next_reset.isoformat(),
                "time_until_reset": int(time_until_reset)
            }