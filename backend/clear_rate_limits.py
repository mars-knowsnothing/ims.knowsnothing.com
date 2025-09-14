#!/usr/bin/env python3
"""
Script to clear rate limit data from the database.
This is used during server startup to reset IP-based chat limits.
"""

import sqlite3
import os
from pathlib import Path

def clear_rate_limits():
    """Clear all rate limit records from the database."""

    # Database path
    db_path = Path(__file__).parent / "anonymous_chat.db"

    if not db_path.exists():
        print("📝 Database doesn't exist yet, will be created on first startup")
        return

    try:
        # Connect to database
        conn = sqlite3.connect(str(db_path))
        cursor = conn.cursor()

        # Clear rate limits table
        cursor.execute("DELETE FROM rate_limits")
        deleted_records = cursor.rowcount

        # Commit changes
        conn.commit()
        conn.close()

        print(f"🧹 Cleared {deleted_records} rate limit record(s)")
        print("✅ All IP addresses now have full quota (3 requests/hour)")

    except sqlite3.Error as e:
        print(f"❌ Error clearing rate limits: {e}")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")

if __name__ == "__main__":
    clear_rate_limits()