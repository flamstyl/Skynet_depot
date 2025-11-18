"""
Sentinelle MCP - Configuration Manager
Handles loading, validation, and access to configuration settings.
"""

import os
import yaml
from pathlib import Path
from typing import Dict, List, Any, Optional
from datetime import datetime


class ConfigManager:
    """Manages configuration for Sentinelle MCP"""

    def __init__(self, config_path: str = "config.yaml"):
        """
        Initialize configuration manager.

        Args:
            config_path: Path to configuration YAML file
        """
        self.config_path = Path(config_path)
        self.config: Dict[str, Any] = {}
        self.load_config()

    def load_config(self) -> None:
        """Load configuration from YAML file"""
        try:
            if not self.config_path.exists():
                raise FileNotFoundError(f"Configuration file not found: {self.config_path}")

            with open(self.config_path, 'r', encoding='utf-8') as f:
                self.config = yaml.safe_load(f)

            self._validate_config()
            print(f"✓ Configuration loaded successfully from {self.config_path}")

        except Exception as e:
            print(f"✗ Error loading configuration: {e}")
            raise

    def save_config(self) -> None:
        """Save current configuration to YAML file"""
        try:
            with open(self.config_path, 'w', encoding='utf-8') as f:
                yaml.dump(self.config, f, default_flow_style=False, sort_keys=False)

            print(f"✓ Configuration saved to {self.config_path}")

        except Exception as e:
            print(f"✗ Error saving configuration: {e}")
            raise

    def _validate_config(self) -> None:
        """Validate configuration structure"""
        required_sections = ['sentinelle', 'watchers', 'ai', 'logging', 'reports']

        for section in required_sections:
            if section not in self.config:
                raise ValueError(f"Missing required configuration section: {section}")

    def get(self, key_path: str, default: Any = None) -> Any:
        """
        Get configuration value using dot notation.

        Args:
            key_path: Dot-separated path (e.g., 'watchers.enabled')
            default: Default value if key not found

        Returns:
            Configuration value or default
        """
        keys = key_path.split('.')
        value = self.config

        for key in keys:
            if isinstance(value, dict) and key in value:
                value = value[key]
            else:
                return default

        return value

    def set(self, key_path: str, value: Any, save: bool = False) -> None:
        """
        Set configuration value using dot notation.

        Args:
            key_path: Dot-separated path
            value: Value to set
            save: Whether to save config to file immediately
        """
        keys = key_path.split('.')
        config = self.config

        for key in keys[:-1]:
            if key not in config:
                config[key] = {}
            config = config[key]

        config[keys[-1]] = value

        if save:
            self.save_config()

    # === Watcher Configuration ===

    def get_watcher_paths(self) -> List[Dict[str, Any]]:
        """Get list of paths to watch"""
        paths = self.get('watchers.paths', [])
        return [p for p in paths if p.get('enabled', True)]

    def add_watcher_path(self, path: str, recursive: bool = True,
                        description: str = "", save: bool = True) -> None:
        """Add a new path to watch"""
        paths = self.get('watchers.paths', [])

        new_path = {
            'path': path,
            'recursive': recursive,
            'enabled': True,
            'description': description,
            'added_at': datetime.now().isoformat()
        }

        paths.append(new_path)
        self.set('watchers.paths', paths, save=save)

    def remove_watcher_path(self, path: str, save: bool = True) -> bool:
        """
        Remove a path from watchers.

        Returns:
            True if path was found and removed
        """
        paths = self.get('watchers.paths', [])
        original_length = len(paths)

        paths = [p for p in paths if p.get('path') != path]

        if len(paths) < original_length:
            self.set('watchers.paths', paths, save=save)
            return True

        return False

    def get_ignore_patterns(self) -> List[str]:
        """Get list of patterns to ignore"""
        return self.get('watchers.ignore_patterns', [])

    def is_watcher_enabled(self) -> bool:
        """Check if watchers are globally enabled"""
        return self.get('watchers.enabled', True)

    def get_debounce_seconds(self) -> int:
        """Get debounce time for events"""
        return self.get('watchers.debounce_seconds', 2)

    # === AI Configuration ===

    def is_ai_enabled(self) -> bool:
        """Check if AI analysis is enabled"""
        return self.get('ai.enabled', False)

    def get_default_ai_model(self) -> str:
        """Get default AI model to use"""
        return self.get('ai.default_model', 'claude_cli')

    def is_auto_analyze_enabled(self) -> bool:
        """Check if auto-analysis is enabled"""
        return self.get('ai.auto_analyze', False)

    def should_analyze_event(self, priority: str, file_type: str,
                            event_type: str) -> bool:
        """
        Determine if an event should trigger AI analysis.

        Args:
            priority: Event priority (low, medium, high, critical)
            file_type: File extension
            event_type: Type of event (created, modified, deleted)

        Returns:
            True if event should be analyzed by AI
        """
        if not self.is_ai_enabled():
            return False

        if self.is_auto_analyze_enabled():
            return True

        analyze_on = self.get('ai.analyze_on', [])

        for condition in analyze_on:
            if condition.get('priority') == priority:
                return True
            if condition.get('file_type') == file_type:
                return True
            if condition.get('event_type') == event_type:
                return True

        return False

    def get_ai_model_config(self, model_name: str) -> Optional[Dict[str, Any]]:
        """Get configuration for specific AI model"""
        return self.get(f'ai.models.{model_name}')

    def get_prompt_templates_dir(self) -> str:
        """Get directory containing AI prompt templates"""
        return self.get('ai.prompt_templates', '../ai_prompts/')

    def get_ai_safety_config(self) -> Dict[str, Any]:
        """Get AI safety configuration"""
        return self.get('ai.safety', {})

    def should_exclude_file(self, file_path: str) -> bool:
        """
        Check if file should be excluded from AI analysis for safety.

        Args:
            file_path: Path to file

        Returns:
            True if file should be excluded
        """
        safety_config = self.get_ai_safety_config()
        exclude_patterns = safety_config.get('exclude_patterns', [])

        file_path_lower = file_path.lower()

        for pattern in exclude_patterns:
            pattern_clean = pattern.replace('*', '')
            if pattern_clean in file_path_lower:
                return True

        return False

    # === Logging Configuration ===

    def get_log_level(self, component: Optional[str] = None) -> str:
        """
        Get log level for specific component or global.

        Args:
            component: Component name (watcher, processor, etc.)

        Returns:
            Log level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        """
        if component:
            return self.get(f'logging.components.{component}', 'INFO')

        return self.get('logging.level', 'INFO')

    def get_log_file_path(self) -> str:
        """Get path to log file"""
        return self.get('logging.file_config.path', '../../data/log_skynet.json')

    def is_log_rotation_enabled(self) -> bool:
        """Check if log rotation is enabled"""
        return self.get('logging.file_config.rotation', True)

    def get_log_max_size_mb(self) -> int:
        """Get maximum log file size in MB"""
        return self.get('logging.file_config.max_size_mb', 100)

    # === Reports Configuration ===

    def is_reports_enabled(self) -> bool:
        """Check if report generation is enabled"""
        return self.get('reports.enabled', True)

    def get_reports_dir(self) -> str:
        """Get reports output directory"""
        return self.get('reports.output_dir', '../../data/reports/')

    def get_report_formats(self) -> List[str]:
        """Get list of report formats to generate"""
        return self.get('reports.formats', ['json', 'markdown'])

    def get_report_retention_days(self) -> int:
        """Get number of days to retain reports"""
        return self.get('reports.retention_days', 30)

    # === MCP Configuration ===

    def is_mcp_enabled(self) -> bool:
        """Check if MCP integration is enabled"""
        return self.get('mcp.enabled', False)

    def get_mcp_endpoint(self) -> str:
        """Get MCP server endpoint"""
        return self.get('mcp.endpoint', 'http://localhost:3000')

    def should_notify_raphael(self) -> bool:
        """Check if Raphaël should be notified"""
        return self.get('mcp.notify_raphael', False)

    def should_notify_raphael_for_event(self, priority: str) -> bool:
        """
        Check if Raphaël should be notified for this event.

        Args:
            priority: Event priority

        Returns:
            True if notification should be sent
        """
        if not self.should_notify_raphael():
            return False

        notify_on = self.get('mcp.notify_on', [])

        for condition in notify_on:
            if condition.get('priority') == priority:
                return True

        return False

    def get_mcp_retry_config(self) -> Dict[str, Any]:
        """Get MCP retry configuration"""
        return self.get('mcp.retry', {})

    # === Performance Configuration ===

    def get_max_events_per_second(self) -> int:
        """Get maximum events to process per second"""
        return self.get('performance.max_events_per_second', 10)

    def get_max_concurrent_ai_calls(self) -> int:
        """Get maximum concurrent AI calls"""
        return self.get('performance.max_concurrent_ai_calls', 3)

    def get_queue_config(self) -> Dict[str, Any]:
        """Get event queue configuration"""
        return self.get('performance.queue', {})

    # === Utility Methods ===

    def reload(self) -> None:
        """Reload configuration from file"""
        self.load_config()

    def get_version(self) -> str:
        """Get Sentinelle version"""
        return self.get('sentinelle.version', 'unknown')

    def get_name(self) -> str:
        """Get Sentinelle name"""
        return self.get('sentinelle.name', 'Sentinelle MCP')

    def to_dict(self) -> Dict[str, Any]:
        """Get full configuration as dictionary"""
        return self.config.copy()

    def __repr__(self) -> str:
        return f"ConfigManager(version={self.get_version()}, path={self.config_path})"


# Singleton instance
_config_instance: Optional[ConfigManager] = None


def get_config(config_path: str = "config.yaml") -> ConfigManager:
    """
    Get singleton ConfigManager instance.

    Args:
        config_path: Path to configuration file

    Returns:
        ConfigManager instance
    """
    global _config_instance

    if _config_instance is None:
        _config_instance = ConfigManager(config_path)

    return _config_instance


if __name__ == "__main__":
    # Test configuration manager
    config = ConfigManager()

    print(f"\n=== {config.get_name()} v{config.get_version()} ===\n")

    print(f"Watchers enabled: {config.is_watcher_enabled()}")
    print(f"AI enabled: {config.is_ai_enabled()}")
    print(f"MCP enabled: {config.is_mcp_enabled()}")
    print(f"Reports enabled: {config.is_reports_enabled()}")

    print(f"\nWatcher paths:")
    for path in config.get_watcher_paths():
        print(f"  - {path['path']} ({'recursive' if path.get('recursive') else 'non-recursive'})")

    print(f"\nAI Model: {config.get_default_ai_model()}")
    print(f"Auto-analyze: {config.is_auto_analyze_enabled()}")

    print(f"\nLog level: {config.get_log_level()}")
    print(f"Log file: {config.get_log_file_path()}")

    print(f"\nReports directory: {config.get_reports_dir()}")
    print(f"Report formats: {', '.join(config.get_report_formats())}")
