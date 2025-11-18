#!/usr/bin/env python3
"""
Sample Test Agent
A simple demo agent for testing the Skynet Agent Launcher.
Outputs messages every second with timestamps.
"""

import time
import sys
from datetime import datetime

def main():
    """Run the sample agent."""
    print("=" * 60)
    print("  SAMPLE AGENT STARTED")
    print("=" * 60)
    print(f"  Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)
    print()

    counter = 0

    try:
        while True:
            counter += 1
            timestamp = datetime.now().strftime('%H:%M:%S')

            # Output various types of messages
            if counter % 5 == 0:
                print(f"[{timestamp}] ⚡ Processing batch #{counter // 5}...")
            elif counter % 3 == 0:
                print(f"[{timestamp}] 🔍 Analyzing data stream...")
            else:
                print(f"[{timestamp}] 💚 Heartbeat #{counter} - System operational")

            # Flush to ensure immediate output
            sys.stdout.flush()

            # Sleep for 1 second
            time.sleep(1)

    except KeyboardInterrupt:
        print()
        print("=" * 60)
        print("  SAMPLE AGENT STOPPED")
        print(f"  Stopped at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"  Total heartbeats: {counter}")
        print("=" * 60)

if __name__ == "__main__":
    main()
