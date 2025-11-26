"""
Configuration generator for agents
Generates YAML and JSON configurations
"""
import yaml
import json
from typing import Dict, Any
from pathlib import Path
from ..models.agent import AgentConfig
from ..config import Config

class ConfigGenerator:
    """Generate agent configurations in various formats"""

    @staticmethod
    def to_yaml(agent_config: AgentConfig) -> str:
        """Convert agent config to YAML string"""
        config_dict = agent_config.to_dict()
        return yaml.dump(config_dict, default_flow_style=False, sort_keys=False)

    @staticmethod
    def to_json(agent_config: AgentConfig, pretty: bool = True) -> str:
        """Convert agent config to JSON string"""
        config_dict = agent_config.to_dict()
        if pretty:
            return json.dumps(config_dict, indent=2)
        return json.dumps(config_dict)

    @staticmethod
    def to_n8n_workflow(agent_config: AgentConfig) -> Dict[str, Any]:
        """
        Convert agent config to n8n workflow format
        """
        nodes = []
        connections = {}

        # Create trigger node
        for idx, trigger in enumerate(agent_config.triggers):
            trigger_node = {
                "id": f"trigger_{idx}",
                "name": f"{trigger.type.capitalize()} Trigger",
                "type": ConfigGenerator._map_trigger_to_n8n_type(trigger.type),
                "typeVersion": 1,
                "position": [250, 300 + idx * 100],
                "parameters": trigger.config
            }
            nodes.append(trigger_node)

        # Create action nodes
        for idx, action in enumerate(agent_config.actions):
            action_node = {
                "id": f"action_{idx}",
                "name": action.name,
                "type": ConfigGenerator._map_action_to_n8n_type(action.type),
                "typeVersion": 1,
                "position": [450 + idx * 200, 300],
                "parameters": action.config
            }
            nodes.append(action_node)

            # Connect trigger to first action
            if idx == 0 and agent_config.triggers:
                connections["trigger_0"] = {
                    "main": [[{"node": f"action_{idx}", "type": "main", "index": 0}]]
                }

            # Connect actions in sequence
            if idx > 0:
                connections[f"action_{idx-1}"] = {
                    "main": [[{"node": f"action_{idx}", "type": "main", "index": 0}]]
                }

        # Create n8n workflow
        workflow = {
            "name": agent_config.name,
            "nodes": nodes,
            "connections": connections,
            "active": False,
            "settings": {
                "saveDataErrorExecution": "all",
                "saveDataSuccessExecution": "all",
                "saveManualExecutions": True
            },
            "tags": ["mcp-forge", "ai-agent"],
            "meta": {
                "description": agent_config.description,
                "model": agent_config.model,
                "role": agent_config.role
            }
        }

        return workflow

    @staticmethod
    def to_mcp_config(agent_config: AgentConfig) -> Dict[str, Any]:
        """
        Convert agent config to MCP (Model Context Protocol) format
        """
        mcp_config = {
            "agent": {
                "name": agent_config.name,
                "description": agent_config.description,
                "version": "1.0.0"
            },
            "model": {
                "provider": ConfigGenerator._get_provider_from_model(agent_config.model),
                "name": agent_config.model,
                "parameters": agent_config.metadata.get("model_params", {})
            },
            "context": {
                "role": agent_config.role,
                "instructions": agent_config.instructions,
                "memory": agent_config.memory_config
            },
            "triggers": [
                {
                    "type": t.type,
                    "config": t.config
                } for t in agent_config.triggers
            ],
            "actions": [
                {
                    "type": a.type,
                    "name": a.name,
                    "config": a.config,
                    "retry": a.retry_config
                } for a in agent_config.actions
            ],
            "conditions": [
                {
                    "type": c.type,
                    "expression": c.expression,
                    "branches": {
                        "true": c.true_branch,
                        "false": c.false_branch
                    }
                } for c in agent_config.conditions
            ],
            "integrations": agent_config.integrations
        }

        return mcp_config

    @staticmethod
    def save_to_file(agent_config: AgentConfig, format: str = 'yaml',
                     directory: Path = None) -> Path:
        """
        Save agent config to file

        Args:
            agent_config: Agent configuration
            format: Output format ('yaml', 'json', 'n8n', 'mcp')
            directory: Output directory (defaults to Config.EXPORTS_DIR)

        Returns:
            Path to saved file
        """
        if directory is None:
            directory = Config.EXPORTS_DIR

        directory.mkdir(parents=True, exist_ok=True)

        # Generate filename
        safe_name = agent_config.name.lower().replace(' ', '_').replace('-', '_')

        if format == 'yaml':
            content = ConfigGenerator.to_yaml(agent_config)
            filepath = directory / f"{safe_name}.yaml"
        elif format == 'json':
            content = ConfigGenerator.to_json(agent_config)
            filepath = directory / f"{safe_name}.json"
        elif format == 'n8n':
            workflow = ConfigGenerator.to_n8n_workflow(agent_config)
            content = json.dumps(workflow, indent=2)
            filepath = directory / f"{safe_name}_n8n.json"
        elif format == 'mcp':
            mcp_config = ConfigGenerator.to_mcp_config(agent_config)
            content = json.dumps(mcp_config, indent=2)
            filepath = directory / f"{safe_name}_mcp.json"
        else:
            raise ValueError(f"Unsupported format: {format}")

        # Write to file
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)

        return filepath

    @staticmethod
    def _map_trigger_to_n8n_type(trigger_type: str) -> str:
        """Map trigger type to n8n node type"""
        mapping = {
            'time': 'n8n-nodes-base.cron',
            'webhook': 'n8n-nodes-base.webhook',
            'event': 'n8n-nodes-base.trigger',
            'manual': 'n8n-nodes-base.manualTrigger',
            'file_watch': 'n8n-nodes-base.localFileTrigger'
        }
        return mapping.get(trigger_type, 'n8n-nodes-base.trigger')

    @staticmethod
    def _map_action_to_n8n_type(action_type: str) -> str:
        """Map action type to n8n node type"""
        mapping = {
            'http_request': 'n8n-nodes-base.httpRequest',
            'database': 'n8n-nodes-base.postgres',
            'file_ops': 'n8n-nodes-base.readWriteFile',
            'ai_call': 'n8n-nodes-base.openAi',
            'email': 'n8n-nodes-base.emailSend',
            'slack': 'n8n-nodes-base.slack'
        }
        return mapping.get(action_type, 'n8n-nodes-base.function')

    @staticmethod
    def _get_provider_from_model(model: str) -> str:
        """Get provider from model name"""
        if 'claude' in model.lower():
            return 'anthropic'
        elif 'gpt' in model.lower():
            return 'openai'
        elif 'gemini' in model.lower():
            return 'google'
        elif 'llama' in model.lower():
            return 'meta'
        return 'unknown'
