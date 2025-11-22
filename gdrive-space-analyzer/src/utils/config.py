"""Configuration management."""

import json
import os
from pathlib import Path
from typing import Any, Dict, Optional
from dataclasses import dataclass, asdict


@dataclass
class Config:
    """Application configuration."""

    # Cache settings
    cache_ttl_hours: int = 24
    auto_refresh: bool = False
    refresh_interval_hours: int = 6

    # Analysis settings
    large_file_threshold_mb: int = 100
    duplicate_detection_enabled: bool = True

    # UI settings
    theme: str = "auto"  # auto, light, dark
    notifications_enabled: bool = True
    show_hidden_files: bool = False

    # Export settings
    export_format: str = "json"  # json, csv, html
    export_include_metadata: bool = True

    # Advanced
    max_workers: int = 4
    batch_size: int = 1000
    debug_mode: bool = False

    @classmethod
    def get_config_dir(cls) -> Path:
        """Get configuration directory."""
        config_home = os.environ.get("XDG_CONFIG_HOME")
        if not config_home:
            config_home = Path.home() / ".config"
        else:
            config_home = Path(config_home)

        config_dir = config_home / "gdrive-analyzer"
        config_dir.mkdir(parents=True, exist_ok=True)
        return config_dir

    @classmethod
    def get_data_dir(cls) -> Path:
        """Get data directory for database."""
        data_home = os.environ.get("XDG_DATA_HOME")
        if not data_home:
            data_home = Path.home() / ".local" / "share"
        else:
            data_home = Path(data_home)

        data_dir = data_home / "gdrive-analyzer"
        data_dir.mkdir(parents=True, exist_ok=True)
        return data_dir

    @classmethod
    def get_cache_dir(cls) -> Path:
        """Get cache directory."""
        cache_home = os.environ.get("XDG_CACHE_HOME")
        if not cache_home:
            cache_home = Path.home() / ".cache"
        else:
            cache_home = Path(cache_home)

        cache_dir = cache_home / "gdrive-analyzer"
        cache_dir.mkdir(parents=True, exist_ok=True)
        return cache_dir

    @classmethod
    def load(cls) -> "Config":
        """Load configuration from file."""
        config_file = cls.get_config_dir() / "settings.json"

        if config_file.exists():
            try:
                with open(config_file, "r") as f:
                    data = json.load(f)
                return cls(**data)
            except (json.JSONDecodeError, TypeError) as e:
                print(f"Error loading config: {e}, using defaults")
                return cls()

        return cls()

    def save(self) -> None:
        """Save configuration to file."""
        config_file = self.get_config_dir() / "settings.json"

        with open(config_file, "w") as f:
            json.dump(asdict(self), f, indent=2)

    def update(self, **kwargs: Any) -> None:
        """Update configuration values."""
        for key, value in kwargs.items():
            if hasattr(self, key):
                setattr(self, key, value)
        self.save()

    def reset(self) -> None:
        """Reset to default configuration."""
        default = Config()
        for key in asdict(default).keys():
            setattr(self, key, getattr(default, key))
        self.save()


# Global config instance
_config: Optional[Config] = None


def get_config() -> Config:
    """Get global config instance."""
    global _config
    if _config is None:
        _config = Config.load()
    return _config
