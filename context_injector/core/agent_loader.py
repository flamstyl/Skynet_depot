"""
Skynet Context Injector — Agent Loader Module
Handles loading agent configurations and launching them with context injection
"""

import json
import os
import subprocess
import logging
from datetime import datetime
from typing import List, Dict, Optional


# Setup logging
LOG_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'logs')
os.makedirs(LOG_DIR, exist_ok=True)
LOG_FILE = os.path.join(LOG_DIR, 'injector.log')

logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] %(levelname)s: %(message)s',
    handlers=[
        logging.FileHandler(LOG_FILE, encoding='utf-8'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)


def load_agents() -> List[Dict]:
    """
    Load agent configurations from agents.json

    Returns:
        List of agent configuration dictionaries
    """
    agents_file = os.path.join(
        os.path.dirname(os.path.dirname(__file__)),
        'agents',
        'agents.json'
    )

    if not os.path.exists(agents_file):
        logger.error(f"Agents configuration file not found: {agents_file}")
        return []

    try:
        with open(agents_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
            agents = data.get('agents', [])
            logger.info(f"Loaded {len(agents)} agent configurations")
            return agents
    except Exception as e:
        logger.error(f"Error loading agents configuration: {e}")
        return []


def launch_agent_with_context(agent: Dict, context_text: str, context_file_name: str) -> subprocess.Popen:
    """
    Launch an agent CLI with context injection via stdin.

    Args:
        agent: Agent configuration dictionary
        context_text: The formatted context content to inject
        context_file_name: Name of the context file (for logging)

    Returns:
        subprocess.Popen object representing the running agent process

    Raises:
        Exception: If agent launch fails
    """
    agent_name = agent.get('name', 'Unknown Agent')
    agent_exec = agent.get('exec', '')
    working_dir = agent.get('working_dir', os.getcwd())

    if not agent_exec:
        raise ValueError(f"Agent '{agent_name}' has no executable command defined")

    logger.info(f"=" * 60)
    logger.info(f"Launching agent: {agent_name}")
    logger.info(f"Command: {agent_exec}")
    logger.info(f"Working directory: {working_dir}")
    logger.info(f"Context file: {context_file_name}")
    logger.info(f"Context size: {len(context_text)} characters")
    logger.info(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    try:
        # Create the working directory if it doesn't exist
        os.makedirs(working_dir, exist_ok=True)

        # Launch the agent process
        # Note: This creates an interactive subprocess
        # On Windows, we need shell=True for commands like "claude --chat"
        process = subprocess.Popen(
            agent_exec,
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            shell=True,
            cwd=working_dir,
            text=True,
            bufsize=1
        )

        # Inject context into stdin
        if context_text:
            try:
                process.stdin.write(context_text + "\n")
                process.stdin.flush()
                logger.info(f"✓ Context successfully injected into {agent_name}")
            except Exception as e:
                logger.error(f"✗ Failed to inject context: {e}")

        logger.info(f"✓ Agent launched successfully (PID: {process.pid})")
        logger.info(f"=" * 60)

        # Log injection history
        _log_injection_history(agent_name, context_file_name)

        return process

    except FileNotFoundError:
        error_msg = f"Agent executable not found: {agent_exec}"
        logger.error(f"✗ {error_msg}")
        raise Exception(error_msg)
    except Exception as e:
        error_msg = f"Failed to launch agent '{agent_name}': {e}"
        logger.error(f"✗ {error_msg}")
        raise Exception(error_msg)


def _log_injection_history(agent_name: str, context_file: str):
    """
    Log injection history to a separate history file.

    Args:
        agent_name: Name of the agent
        context_file: Name of the context file
    """
    history_file = os.path.join(LOG_DIR, 'injection_history.log')

    try:
        with open(history_file, 'a', encoding='utf-8') as f:
            timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            f.write(f"[{timestamp}] Injected '{context_file}' into '{agent_name}'\n")
    except Exception as e:
        logger.error(f"Failed to write injection history: {e}")


def get_agent_by_name(agent_name: str) -> Optional[Dict]:
    """
    Get agent configuration by name.

    Args:
        agent_name: Name of the agent

    Returns:
        Agent configuration dictionary or None if not found
    """
    agents = load_agents()
    for agent in agents:
        if agent.get('name') == agent_name:
            return agent
    return None


def validate_agent_config(agent: Dict) -> bool:
    """
    Validate an agent configuration.

    Args:
        agent: Agent configuration dictionary

    Returns:
        True if valid, False otherwise
    """
    required_fields = ['name', 'exec']
    for field in required_fields:
        if field not in agent or not agent[field]:
            logger.error(f"Agent configuration missing required field: {field}")
            return False
    return True
