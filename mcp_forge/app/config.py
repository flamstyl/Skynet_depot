"""
Configuration for MCP Forge
"""
import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class Config:
    """Application configuration"""

    # Base paths
    BASE_DIR = Path(__file__).parent.parent
    DATA_DIR = BASE_DIR / "data"
    AGENTS_DIR = DATA_DIR / "agents"
    EXPORTS_DIR = DATA_DIR / "exports"

    # Server
    FLASK_ENV = os.getenv('FLASK_ENV', 'development')
    DEBUG = os.getenv('FLASK_DEBUG', 'True').lower() == 'true'
    PORT = int(os.getenv('PORT', 5002))
    HOST = os.getenv('HOST', '0.0.0.0')
    SECRET_KEY = os.getenv('SECRET_KEY', 'mcp-forge-secret-key-change-in-production')

    # AI APIs
    ANTHROPIC_API_KEY = os.getenv('ANTHROPIC_API_KEY', '')
    OPENAI_API_KEY = os.getenv('OPENAI_API_KEY', '')

    # Database
    DATABASE_PATH = os.getenv('DATABASE_PATH', str(DATA_DIR / 'agents' / 'mcp_forge.db'))

    # n8n Integration
    N8N_AGENTS_DIR = os.getenv('N8N_AGENTS_DIR', '/tmp/n8n/agents')
    N8N_API_URL = os.getenv('N8N_API_URL', 'http://localhost:5678')
    N8N_API_KEY = os.getenv('N8N_API_KEY', '')

    # Execution settings
    MAX_DRY_RUN_TIME = int(os.getenv('MAX_DRY_RUN_TIME', 30))
    SANDBOX_ENABLED = os.getenv('SANDBOX_ENABLED', 'True').lower() == 'true'

    # Logging
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
    LOG_FILE = os.getenv('LOG_FILE', 'mcp_forge.log')

    # Supported AI models
    SUPPORTED_MODELS = {
        'anthropic': [
            'claude-3-5-sonnet-20241022',
            'claude-3-opus-20240229',
            'claude-3-haiku-20240307'
        ],
        'openai': [
            'gpt-4-turbo-preview',
            'gpt-4',
            'gpt-3.5-turbo'
        ]
    }

    # Agent component types
    COMPONENT_TYPES = {
        'triggers': ['time', 'event', 'webhook', 'manual', 'file_watch'],
        'actions': ['http_request', 'database', 'file_ops', 'ai_call', 'email', 'slack'],
        'conditions': ['if_else', 'switch', 'loop', 'filter', 'rate_limit'],
        'integrations': ['n8n', 'mcp', 'api', 'database', 'filesystem']
    }

    @classmethod
    def init_directories(cls):
        """Create necessary directories if they don't exist"""
        cls.DATA_DIR.mkdir(exist_ok=True)
        cls.AGENTS_DIR.mkdir(exist_ok=True)
        cls.EXPORTS_DIR.mkdir(exist_ok=True)
