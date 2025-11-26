"""
Sentinelle MCP - Watcher Service
Main service that monitors file system changes using watchdog.
"""

import os
import sys
import time
import threading
from pathlib import Path
from typing import Dict, Any, List, Optional
from datetime import datetime
from collections import deque
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler, FileSystemEvent

# Import Sentinelle components
from config_manager import get_config
from log_manager import get_logger
from event_processor import EventProcessor
from report_generator import ReportGenerator
from ai_bridge import AIBridge


class SentinelleEventHandler(FileSystemEventHandler):
    """Handles file system events"""

    def __init__(self, event_queue: deque, debounce_seconds: int = 2):
        """
        Initialize event handler.

        Args:
            event_queue: Queue to store events
            debounce_seconds: Seconds to wait before processing event
        """
        super().__init__()
        self.event_queue = event_queue
        self.debounce_seconds = debounce_seconds
        self.recent_events: Dict[str, float] = {}  # path -> timestamp

    def _should_ignore_event(self, event: FileSystemEvent) -> bool:
        """Check if event should be ignored"""
        # Ignore directory events
        if event.is_directory:
            return True

        # Debounce - ignore if same file was modified recently
        path = event.src_path
        current_time = time.time()

        if path in self.recent_events:
            time_since_last = current_time - self.recent_events[path]
            if time_since_last < self.debounce_seconds:
                return True

        self.recent_events[path] = current_time

        # Clean old entries
        if len(self.recent_events) > 1000:
            cutoff = current_time - (self.debounce_seconds * 2)
            self.recent_events = {
                p: t for p, t in self.recent_events.items()
                if t > cutoff
            }

        return False

    def on_created(self, event: FileSystemEvent):
        """Handle file created event"""
        if self._should_ignore_event(event):
            return

        self.event_queue.append({
            'event_type': 'created',
            'src_path': event.src_path,
            'timestamp': datetime.now().isoformat()
        })

    def on_modified(self, event: FileSystemEvent):
        """Handle file modified event"""
        if self._should_ignore_event(event):
            return

        self.event_queue.append({
            'event_type': 'modified',
            'src_path': event.src_path,
            'timestamp': datetime.now().isoformat()
        })

    def on_deleted(self, event: FileSystemEvent):
        """Handle file deleted event"""
        if self._should_ignore_event(event):
            return

        self.event_queue.append({
            'event_type': 'deleted',
            'src_path': event.src_path,
            'timestamp': datetime.now().isoformat()
        })

    def on_moved(self, event: FileSystemEvent):
        """Handle file moved event"""
        if self._should_ignore_event(event):
            return

        self.event_queue.append({
            'event_type': 'moved',
            'src_path': event.src_path,
            'dest_path': getattr(event, 'dest_path', None),
            'timestamp': datetime.now().isoformat()
        })


class SentinelleWatcherService:
    """Main Sentinelle MCP watcher service"""

    def __init__(self, config_path: str = "config.yaml"):
        """
        Initialize watcher service.

        Args:
            config_path: Path to configuration file
        """
        print("🟣 Initializing Sentinelle MCP - Skynet Context Watcher...")

        # Load configuration
        self.config = get_config(config_path)
        print(f"✓ Configuration loaded: v{self.config.get_version()}")

        # Setup logging
        log_path = self.config.get_log_file_path()
        log_level = self.config.get_log_level()
        self.logger = get_logger(log_path, level=log_level)
        print(f"✓ Logging initialized: {log_path}")

        # Initialize components
        self.event_processor = EventProcessor(self.config, self.logger)
        self.report_generator = ReportGenerator(self.config, self.logger)
        self.ai_bridge = AIBridge(self.config, self.logger)

        print("✓ Components initialized")

        # Event queue and processing
        self.event_queue: deque = deque(maxlen=1000)
        self.processing_thread: Optional[threading.Thread] = None
        self.running = False

        # Watchdog observers
        self.observers: List[Observer] = []

        # Statistics
        self.stats = {
            'started_at': None,
            'total_events': 0,
            'events_processed': 0,
            'ai_analyses': 0,
            'reports_generated': 0,
            'errors': 0
        }

        self.logger.info(
            "watcher_service",
            f"Sentinelle MCP v{self.config.get_version()} initialized"
        )

    def start(self):
        """Start the watcher service"""
        if self.running:
            print("⚠ Sentinelle is already running")
            return

        print("\n🚀 Starting Sentinelle MCP...\n")

        self.running = True
        self.stats['started_at'] = datetime.now().isoformat()

        # Start event processing thread
        self.processing_thread = threading.Thread(
            target=self._process_events_loop,
            daemon=True
        )
        self.processing_thread.start()

        # Setup watchers for configured paths
        self._setup_watchers()

        self.logger.info("watcher_service", "Sentinelle MCP started successfully")

        print("✓ Sentinelle MCP is now watching for changes")
        print(f"✓ Monitoring {len(self.observers)} path(s)")
        print(f"✓ AI Analysis: {'Enabled' if self.config.is_ai_enabled() else 'Disabled'}")
        print(f"✓ MCP Integration: {'Enabled' if self.config.is_mcp_enabled() else 'Disabled'}")
        print("\nPress Ctrl+C to stop\n")

    def _setup_watchers(self):
        """Setup file system watchers for configured paths"""
        paths = self.config.get_watcher_paths()

        if not paths:
            print("⚠ No paths configured to watch")
            self.logger.warning("watcher_service", "No watcher paths configured")
            return

        debounce = self.config.get_debounce_seconds()

        for path_config in paths:
            path = path_config.get('path')
            recursive = path_config.get('recursive', True)
            description = path_config.get('description', '')

            if not os.path.exists(path):
                print(f"⚠ Path does not exist: {path}")
                self.logger.warning(
                    "watcher_service",
                    f"Watcher path does not exist: {path}"
                )
                continue

            try:
                # Create observer
                observer = Observer()
                event_handler = SentinelleEventHandler(
                    self.event_queue,
                    debounce_seconds=debounce
                )

                observer.schedule(
                    event_handler,
                    path,
                    recursive=recursive
                )

                observer.start()
                self.observers.append(observer)

                print(f"👁  Watching: {path}")
                if description:
                    print(f"   {description}")

                self.logger.info(
                    "watcher_service",
                    f"Watcher started for: {path}",
                    metadata={'recursive': recursive, 'description': description}
                )

            except Exception as e:
                print(f"✗ Error setting up watcher for {path}: {e}")
                self.logger.log_error_with_exception(
                    "watcher_service",
                    f"Error setting up watcher for {path}",
                    e
                )

    def _process_events_loop(self):
        """Main event processing loop (runs in thread)"""
        self.logger.info("watcher_service", "Event processing loop started")

        while self.running:
            try:
                # Check if there are events to process
                if not self.event_queue:
                    time.sleep(0.1)
                    continue

                # Get event from queue
                raw_event = self.event_queue.popleft()
                self.stats['total_events'] += 1

                # Process event
                self._process_event(raw_event)

            except Exception as e:
                self.stats['errors'] += 1
                self.logger.log_error_with_exception(
                    "watcher_service",
                    "Error in event processing loop",
                    e
                )
                time.sleep(1)  # Brief pause on error

    def _process_event(self, raw_event: Dict[str, Any]):
        """
        Process a single event.

        Args:
            raw_event: Raw event from watchdog
        """
        try:
            # Process and classify event
            processed_event = self.event_processor.process_event(raw_event)

            # Check if event should be processed further
            if not self.event_processor.should_process_event(processed_event):
                return

            self.stats['events_processed'] += 1

            # AI Analysis (if configured)
            ai_analysis = None
            if self.event_processor.should_trigger_ai_analysis(processed_event):
                ai_analysis = self.ai_bridge.analyze_event(processed_event)
                if ai_analysis:
                    self.stats['ai_analyses'] += 1

            # Generate report
            if self.config.is_reports_enabled():
                self.report_generator.generate_report(processed_event, ai_analysis)
                self.stats['reports_generated'] += 1

            # Notify via MCP (if configured)
            if self.event_processor.should_notify_raphael(processed_event):
                self._notify_via_mcp(processed_event, ai_analysis)

            # Print event to console
            self._print_event(processed_event, ai_analysis)

        except Exception as e:
            self.stats['errors'] += 1
            self.logger.log_error_with_exception(
                "watcher_service",
                "Error processing event",
                e
            )

    def _notify_via_mcp(self, event: Dict[str, Any],
                       ai_analysis: Optional[Dict[str, Any]] = None):
        """
        Send notification via MCP.

        Args:
            event: Processed event
            ai_analysis: Optional AI analysis
        """
        # TODO: Implement MCP notification
        # This will call the MCP server endpoint
        try:
            import requests

            endpoint = self.config.get_mcp_endpoint()
            url = f"{endpoint}/notify/event"

            payload = {
                'event': event,
                'ai_analysis': ai_analysis
            }

            response = requests.post(url, json=payload, timeout=5)

            if response.status_code == 200:
                self.logger.info(
                    "watcher_service",
                    "MCP notification sent successfully",
                    event_id=event.get('event_id')
                )

        except Exception as e:
            self.logger.error(
                "watcher_service",
                f"MCP notification failed: {e}",
                event_id=event.get('event_id')
            )

    def _print_event(self, event: Dict[str, Any],
                    ai_analysis: Optional[Dict[str, Any]] = None):
        """Print event to console"""
        # Color codes
        priority_colors = {
            'critical': '\033[91m',  # Red
            'high': '\033[93m',      # Yellow
            'medium': '\033[94m',    # Blue
            'low': '\033[92m'        # Green
        }

        reset = '\033[0m'

        priority = event.get('priority', 'low')
        color = priority_colors.get(priority, '')

        timestamp = event.get('timestamp', '').split('T')[1].split('.')[0]

        print(f"{color}[{timestamp}] {event.get('event_type').upper():8} "
              f"{event.get('file_name'):30} "
              f"[{priority.upper()}]{reset}")

        if ai_analysis and ai_analysis.get('summary'):
            summary = ai_analysis['summary'][:80]
            print(f"  💡 AI: {summary}...")

    def stop(self):
        """Stop the watcher service"""
        if not self.running:
            return

        print("\n\n🛑 Stopping Sentinelle MCP...")

        self.running = False

        # Stop all observers
        for observer in self.observers:
            observer.stop()

        # Wait for observers to finish
        for observer in self.observers:
            observer.join(timeout=5)

        # Wait for processing thread
        if self.processing_thread:
            self.processing_thread.join(timeout=5)

        self.logger.info("watcher_service", "Sentinelle MCP stopped")

        # Print final statistics
        self._print_stats()

        print("\n✓ Sentinelle MCP stopped\n")

    def _print_stats(self):
        """Print service statistics"""
        print("\n" + "="*60)
        print("📊 Sentinelle MCP Statistics")
        print("="*60)

        if self.stats['started_at']:
            started = datetime.fromisoformat(self.stats['started_at'])
            duration = datetime.now() - started
            hours = duration.total_seconds() / 3600

            print(f"Running time: {duration}")
            print(f"Started at: {self.stats['started_at']}")

        print(f"\nEvents:")
        print(f"  Total detected: {self.stats['total_events']}")
        print(f"  Processed: {self.stats['events_processed']}")
        print(f"  AI analyses: {self.stats['ai_analyses']}")
        print(f"  Reports generated: {self.stats['reports_generated']}")
        print(f"  Errors: {self.stats['errors']}")

        print("="*60 + "\n")

    def get_stats(self) -> Dict[str, Any]:
        """Get service statistics"""
        return self.stats.copy()

    def is_running(self) -> bool:
        """Check if service is running"""
        return self.running

    def __repr__(self) -> str:
        return f"SentinelleWatcherService(running={self.running}, watchers={len(self.observers)})"


def main():
    """Main entry point"""
    import signal

    # Create service
    service = SentinelleWatcherService()

    # Handle Ctrl+C gracefully
    def signal_handler(sig, frame):
        service.stop()
        sys.exit(0)

    signal.signal(signal.SIGINT, signal_handler)

    # Start service
    service.start()

    # Keep running
    try:
        while service.is_running():
            time.sleep(1)
    except KeyboardInterrupt:
        service.stop()


if __name__ == "__main__":
    main()
