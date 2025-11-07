#!/usr/bin/env python3
"""
Manual script to clean up corrupted Redis sessions.
Run this if you encounter Unicode decode errors.

Usage:
    python cleanup_sessions.py
"""

from dotenv import load_dotenv
load_dotenv()

from utils.redis_client import clear_corrupted_sessions
import sys

def main():
    print("🔍 Scanning for corrupted sessions...")

    try:
        corrupted_count = clear_corrupted_sessions()

        if corrupted_count > 0:
            print(f"✅ Successfully cleaned up {corrupted_count} corrupted sessions")
        else:
            print("✨ No corrupted sessions found - Redis is clean!")

        return 0

    except Exception as e:
        print(f"❌ Error during cleanup: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main())
