"""Configuration management for Grok CLI"""

import yaml
from pathlib import Path
from typing import Optional


def load_config(config_file: Optional[str] = None) -> dict:
    """Load configuration from YAML file"""
    if config_file:
        config_path = Path(config_file)
    else:
        # Use default config
        config_path = Path(__file__).parent / "default_config.yaml"

    if not config_path.exists():
        raise FileNotFoundError(f"Config file not found: {config_path}")

    with open(config_path, "r") as f:
        config = yaml.safe_load(f)

    return config


__all__ = ["load_config"]
