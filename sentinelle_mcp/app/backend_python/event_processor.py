"""
Sentinelle MCP - Event Processor
Processes file system events, classifies them, and routes to appropriate handlers.
"""

import os
import hashlib
from pathlib import Path
from typing import Dict, Any, Optional, List
from datetime import datetime
from enum import Enum
import uuid


class EventType(Enum):
    """File system event types"""
    CREATED = "created"
    MODIFIED = "modified"
    DELETED = "deleted"
    MOVED = "moved"


class Priority(Enum):
    """Event priority levels"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class FileCategory(Enum):
    """File categories"""
    CODE = "code"
    DOCUMENT = "document"
    CONFIG = "config"
    DATA = "data"
    PROMPT = "prompt"
    MODEL = "model"
    UNKNOWN = "unknown"


class EventProcessor:
    """Processes and classifies file system events"""

    # File type mappings
    CODE_EXTENSIONS = {'.py', '.js', '.ts', '.jsx', '.tsx', '.java', '.cpp', '.c',
                      '.h', '.cs', '.go', '.rs', '.rb', '.php', '.swift', '.kt'}

    DOCUMENT_EXTENSIONS = {'.md', '.txt', '.doc', '.docx', '.pdf', '.rtf', '.odt'}

    CONFIG_EXTENSIONS = {'.yaml', '.yml', '.json', '.toml', '.ini', '.conf',
                        '.xml', '.properties', '.env'}

    DATA_EXTENSIONS = {'.csv', '.xlsx', '.xls', '.db', '.sqlite', '.sql',
                      '.parquet', '.arrow', '.feather'}

    PROMPT_EXTENSIONS = {'.md', '.txt'}  # In prompt directories

    MODEL_EXTENSIONS = {'.pt', '.pth', '.h5', '.pkl', '.ckpt', '.safetensors',
                       '.onnx', '.tflite', '.pb'}

    def __init__(self, config_manager, log_manager):
        """
        Initialize event processor.

        Args:
            config_manager: ConfigManager instance
            log_manager: LogManager instance
        """
        self.config = config_manager
        self.logger = log_manager
        self.processed_events: List[str] = []  # Cache of recent event IDs

    def process_event(self, raw_event: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process a raw file system event.

        Args:
            raw_event: Raw event from watchdog

        Returns:
            Processed and enriched event
        """
        # Generate unique event ID
        event_id = str(uuid.uuid4())

        # Extract basic info
        event_type = raw_event.get('event_type', 'unknown')
        file_path = raw_event.get('src_path', raw_event.get('path', ''))

        # Build processed event
        processed = {
            'event_id': event_id,
            'timestamp': datetime.now().isoformat(),
            'event_type': event_type,
            'path': file_path,
            'file_name': os.path.basename(file_path),
            'file_extension': self._get_extension(file_path),
            'directory': os.path.dirname(file_path),
        }

        # Classify event
        processed['category'] = self._classify_file(file_path)
        processed['priority'] = self._determine_priority(processed)

        # Enrich with metadata
        if event_type != EventType.DELETED.value:
            processed['metadata'] = self._get_file_metadata(file_path)
        else:
            processed['metadata'] = {}

        # Add context
        processed['context'] = self._get_context(file_path)

        # Log event
        self.logger.log_event(processed, component="event_processor")

        # Add to processed cache
        self.processed_events.append(event_id)
        if len(self.processed_events) > 1000:  # Keep last 1000
            self.processed_events = self.processed_events[-1000:]

        return processed

    def _get_extension(self, file_path: str) -> str:
        """Get file extension"""
        return Path(file_path).suffix.lower()

    def _classify_file(self, file_path: str) -> str:
        """
        Classify file based on extension and location.

        Args:
            file_path: Path to file

        Returns:
            Category string
        """
        ext = self._get_extension(file_path)
        path_lower = file_path.lower()

        # Check if in prompt directory
        if 'prompt' in path_lower or 'prompts' in path_lower:
            if ext in self.PROMPT_EXTENSIONS:
                return FileCategory.PROMPT.value

        # Check by extension
        if ext in self.CODE_EXTENSIONS:
            return FileCategory.CODE.value

        if ext in self.CONFIG_EXTENSIONS:
            return FileCategory.CONFIG.value

        if ext in self.DATA_EXTENSIONS:
            return FileCategory.DATA.value

        if ext in self.MODEL_EXTENSIONS:
            return FileCategory.MODEL.value

        if ext in self.DOCUMENT_EXTENSIONS:
            return FileCategory.DOCUMENT.value

        return FileCategory.UNKNOWN.value

    def _determine_priority(self, event: Dict[str, Any]) -> str:
        """
        Determine event priority.

        Args:
            event: Processed event

        Returns:
            Priority level
        """
        category = event.get('category', 'unknown')
        event_type = event.get('event_type', 'unknown')
        extension = event.get('file_extension', '')

        # Critical: Important config or code changes
        if category == FileCategory.CONFIG.value:
            if extension in {'.yaml', '.yml', '.env'}:
                return Priority.CRITICAL.value

        # Critical: Model files
        if category == FileCategory.MODEL.value:
            return Priority.CRITICAL.value

        # High: Code files created or modified
        if category == FileCategory.CODE.value:
            if event_type in {EventType.CREATED.value, EventType.MODIFIED.value}:
                return Priority.HIGH.value

        # High: Prompt files
        if category == FileCategory.PROMPT.value:
            return Priority.HIGH.value

        # Medium: Documents
        if category == FileCategory.DOCUMENT.value:
            return Priority.MEDIUM.value

        # Medium: Data files
        if category == FileCategory.DATA.value:
            return Priority.MEDIUM.value

        # Low: Everything else
        return Priority.LOW.value

    def _get_file_metadata(self, file_path: str) -> Dict[str, Any]:
        """
        Get file metadata.

        Args:
            file_path: Path to file

        Returns:
            Metadata dictionary
        """
        metadata = {}

        try:
            if not os.path.exists(file_path):
                return metadata

            stat = os.stat(file_path)

            metadata['size_bytes'] = stat.st_size
            metadata['size_kb'] = round(stat.st_size / 1024, 2)
            metadata['created_at'] = datetime.fromtimestamp(stat.st_ctime).isoformat()
            metadata['modified_at'] = datetime.fromtimestamp(stat.st_mtime).isoformat()

            # Calculate file hash for change detection
            if stat.st_size < 10 * 1024 * 1024:  # Only hash files < 10MB
                metadata['hash'] = self._calculate_hash(file_path)

            # Check if file is readable
            metadata['readable'] = os.access(file_path, os.R_OK)
            metadata['writable'] = os.access(file_path, os.W_OK)

        except Exception as e:
            self.logger.error(
                "event_processor",
                f"Error getting metadata for {file_path}: {e}"
            )

        return metadata

    def _calculate_hash(self, file_path: str, algorithm: str = 'sha256') -> str:
        """
        Calculate file hash.

        Args:
            file_path: Path to file
            algorithm: Hash algorithm

        Returns:
            Hex digest of hash
        """
        try:
            hash_obj = hashlib.new(algorithm)

            with open(file_path, 'rb') as f:
                # Read in chunks for large files
                for chunk in iter(lambda: f.read(4096), b''):
                    hash_obj.update(chunk)

            return hash_obj.hexdigest()

        except Exception as e:
            self.logger.error(
                "event_processor",
                f"Error calculating hash for {file_path}: {e}"
            )
            return ""

    def _get_context(self, file_path: str) -> Dict[str, Any]:
        """
        Get contextual information about file location.

        Args:
            file_path: Path to file

        Returns:
            Context dictionary
        """
        context = {}

        try:
            path_parts = Path(file_path).parts

            # Check for common project indicators
            context['in_git_repo'] = '.git' in path_parts
            context['in_node_project'] = 'node_modules' in path_parts
            context['in_python_project'] = any(p in path_parts for p in ['venv', '.venv', '__pycache__'])

            # Extract project name (heuristic)
            for i, part in enumerate(path_parts):
                if part in ['Projects', 'AI_Projects', 'Skynet_depot', 'repos']:
                    if i + 1 < len(path_parts):
                        context['project_name'] = path_parts[i + 1]
                        break

            # Check if in specific subdirectories
            path_lower = file_path.lower()
            context['in_prompts_dir'] = 'prompt' in path_lower
            context['in_config_dir'] = 'config' in path_lower or 'settings' in path_lower
            context['in_src_dir'] = 'src' in path_lower or 'source' in path_lower
            context['in_tests_dir'] = 'test' in path_lower
            context['in_docs_dir'] = 'doc' in path_lower or 'documentation' in path_lower

        except Exception as e:
            self.logger.error(
                "event_processor",
                f"Error getting context for {file_path}: {e}"
            )

        return context

    def should_process_event(self, event: Dict[str, Any]) -> bool:
        """
        Determine if event should be processed further.

        Args:
            event: Processed event

        Returns:
            True if event should be processed
        """
        # Check if file should be ignored
        file_path = event.get('path', '')

        # Check ignore patterns from config
        ignore_patterns = self.config.get_ignore_patterns()

        for pattern in ignore_patterns:
            pattern_clean = pattern.replace('*', '')
            if pattern_clean in file_path:
                self.logger.debug(
                    "event_processor",
                    f"Event ignored due to pattern {pattern}: {file_path}"
                )
                return False

        return True

    def should_trigger_ai_analysis(self, event: Dict[str, Any]) -> bool:
        """
        Determine if event should trigger AI analysis.

        Args:
            event: Processed event

        Returns:
            True if AI analysis should be triggered
        """
        if not self.config.is_ai_enabled():
            return False

        priority = event.get('priority', 'low')
        file_extension = event.get('file_extension', '')
        event_type = event.get('event_type', '')

        return self.config.should_analyze_event(priority, file_extension, event_type)

    def should_notify_raphael(self, event: Dict[str, Any]) -> bool:
        """
        Determine if Raphaël should be notified.

        Args:
            event: Processed event

        Returns:
            True if notification should be sent
        """
        if not self.config.is_mcp_enabled():
            return False

        priority = event.get('priority', 'low')
        return self.config.should_notify_raphael_for_event(priority)

    def batch_process_events(self, raw_events: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Process multiple events in batch.

        Args:
            raw_events: List of raw events

        Returns:
            List of processed events
        """
        processed_events = []

        for raw_event in raw_events:
            try:
                processed = self.process_event(raw_event)

                if self.should_process_event(processed):
                    processed_events.append(processed)

            except Exception as e:
                self.logger.error(
                    "event_processor",
                    f"Error processing event: {e}",
                    metadata={'raw_event': raw_event}
                )

        return processed_events

    def get_stats(self) -> Dict[str, Any]:
        """
        Get processing statistics.

        Returns:
            Statistics dictionary
        """
        return {
            'total_processed': len(self.processed_events),
            'processor_version': '1.0.0'
        }

    def __repr__(self) -> str:
        return f"EventProcessor(processed={len(self.processed_events)})"


if __name__ == "__main__":
    # Test event processor
    from config_manager import ConfigManager
    from log_manager import LogManager
    import tempfile

    # Create temporary log
    with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.json') as f:
        temp_log = f.name

    config = ConfigManager()
    logger = LogManager(temp_log, level="DEBUG")
    processor = EventProcessor(config, logger)

    print(f"\n=== Testing Sentinelle MCP Event Processor ===\n")

    # Test events
    test_events = [
        {
            'event_type': 'created',
            'src_path': '/home/user/AI_Projects/myproject/src/main.py'
        },
        {
            'event_type': 'modified',
            'src_path': '/home/user/AI_Projects/myproject/config.yaml'
        },
        {
            'event_type': 'deleted',
            'src_path': '/home/user/AI_Projects/myproject/temp.txt'
        },
        {
            'event_type': 'created',
            'src_path': '/home/user/AI_Projects/prompts/analyze_change.md'
        }
    ]

    print("Processing test events:\n")

    for raw_event in test_events:
        processed = processor.process_event(raw_event)

        print(f"Event: {processed['event_type']} - {processed['file_name']}")
        print(f"  Category: {processed['category']}")
        print(f"  Priority: {processed['priority']}")
        print(f"  Should analyze with AI: {processor.should_trigger_ai_analysis(processed)}")
        print(f"  Should notify Raphaël: {processor.should_notify_raphael(processed)}")
        print()

    stats = processor.get_stats()
    print(f"Statistics:")
    print(f"  Total processed: {stats['total_processed']}")

    # Cleanup
    import os
    os.unlink(temp_log)

    print(f"\n✓ Test completed")
