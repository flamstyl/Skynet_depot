"""
Agent Builder - Build and manage agents
"""
from typing import Dict, Any, List, Optional
from ..models.agent import Agent, AgentConfig, Trigger, Action, Condition
from ..database import Database
from .config_generator import ConfigGenerator
from .ai_validator import AIValidator

class AgentBuilder:
    """Build and manage AI agents"""

    def __init__(self, db: Optional[Database] = None):
        self.db = db or Database()
        self.config_generator = ConfigGenerator()
        self.ai_validator = AIValidator()

    def create_agent(self, name: str, description: str, model: str,
                    role: str = "", instructions: List[str] = None) -> Agent:
        """
        Create a new agent

        Args:
            name: Agent name
            description: Agent description
            model: AI model to use
            role: Agent role/persona
            instructions: List of instructions

        Returns:
            Created Agent object
        """
        config = AgentConfig(
            name=name,
            description=description,
            model=model,
            role=role,
            instructions=instructions or []
        )

        agent_id = self.db.create_agent(
            name=name,
            description=description,
            model=model,
            config=config.to_dict()
        )

        return Agent(
            id=agent_id,
            name=name,
            description=description,
            model=model,
            config=config
        )

    def get_agent(self, agent_id: int) -> Optional[Agent]:
        """Get agent by ID"""
        agent_data = self.db.get_agent(agent_id)
        if not agent_data:
            return None

        config = AgentConfig.from_dict(agent_data['config'])

        return Agent(
            id=agent_data['id'],
            name=agent_data['name'],
            description=agent_data['description'],
            model=agent_data['model'],
            config=config,
            status=agent_data['status'],
            created_at=agent_data['created_at'],
            updated_at=agent_data['updated_at'],
            version=agent_data['version']
        )

    def get_agent_by_name(self, name: str) -> Optional[Agent]:
        """Get agent by name"""
        agent_data = self.db.get_agent_by_name(name)
        if not agent_data:
            return None

        config = AgentConfig.from_dict(agent_data['config'])

        return Agent(
            id=agent_data['id'],
            name=agent_data['name'],
            description=agent_data['description'],
            model=agent_data['model'],
            config=config,
            status=agent_data['status'],
            created_at=agent_data['created_at'],
            updated_at=agent_data['updated_at'],
            version=agent_data['version']
        )

    def list_agents(self) -> List[Agent]:
        """List all agents"""
        agents_data = self.db.list_agents()

        return [
            Agent(
                id=data['id'],
                name=data['name'],
                description=data['description'],
                model=data['model'],
                config=AgentConfig.from_dict(data['config']),
                status=data['status'],
                created_at=data['created_at'],
                updated_at=data['updated_at'],
                version=data['version']
            )
            for data in agents_data
        ]

    def update_agent(self, agent_id: int, **kwargs) -> bool:
        """Update agent"""
        return self.db.update_agent(agent_id, **kwargs)

    def delete_agent(self, agent_id: int) -> bool:
        """Delete agent"""
        return self.db.delete_agent(agent_id)

    def add_trigger(self, agent_id: int, trigger_type: str, config: Dict[str, Any]) -> bool:
        """Add trigger to agent"""
        agent = self.get_agent(agent_id)
        if not agent:
            return False

        trigger = Trigger(type=trigger_type, config=config)
        agent.config.triggers.append(trigger)

        return self.db.update_agent(agent_id, config=agent.config.to_dict())

    def add_action(self, agent_id: int, action_type: str, name: str,
                  config: Dict[str, Any], retry_config: Optional[Dict[str, Any]] = None) -> bool:
        """Add action to agent"""
        agent = self.get_agent(agent_id)
        if not agent:
            return False

        action = Action(type=action_type, name=name, config=config, retry_config=retry_config)
        agent.config.actions.append(action)

        return self.db.update_agent(agent_id, config=agent.config.to_dict())

    def add_condition(self, agent_id: int, condition_type: str, expression: str,
                     true_branch: List[str] = None, false_branch: List[str] = None) -> bool:
        """Add condition to agent"""
        agent = self.get_agent(agent_id)
        if not agent:
            return False

        condition = Condition(
            type=condition_type,
            expression=expression,
            true_branch=true_branch,
            false_branch=false_branch
        )
        agent.config.conditions.append(condition)

        return self.db.update_agent(agent_id, config=agent.config.to_dict())

    def set_instructions(self, agent_id: int, instructions: List[str]) -> bool:
        """Set agent instructions"""
        agent = self.get_agent(agent_id)
        if not agent:
            return False

        agent.config.instructions = instructions
        return self.db.update_agent(agent_id, config=agent.config.to_dict())

    def set_role(self, agent_id: int, role: str) -> bool:
        """Set agent role"""
        agent = self.get_agent(agent_id)
        if not agent:
            return False

        agent.config.role = role
        return self.db.update_agent(agent_id, config=agent.config.to_dict())

    def export_agent(self, agent_id: int, format: str = 'yaml') -> Optional[str]:
        """
        Export agent configuration

        Args:
            agent_id: Agent ID
            format: Export format ('yaml', 'json', 'n8n', 'mcp')

        Returns:
            Path to exported file or None if failed
        """
        agent = self.get_agent(agent_id)
        if not agent:
            return None

        try:
            filepath = self.config_generator.save_to_file(agent.config, format)
            return str(filepath)
        except Exception:
            return None

    def validate_agent(self, agent_id: int, validator: str = "claude") -> Optional[Dict[str, Any]]:
        """
        Validate agent using AI

        Args:
            agent_id: Agent ID
            validator: Validator to use ('claude' or 'gpt')

        Returns:
            Validation result dictionary
        """
        agent = self.get_agent(agent_id)
        if not agent:
            return None

        validation_result = self.ai_validator.validate(agent.config, validator)
        validation_result.agent_id = agent_id

        # Save validation to database
        self.db.add_validation(
            agent_id=agent_id,
            validator=validation_result.validator,
            score=validation_result.score,
            feedback=validation_result.feedback,
            suggestions=validation_result.suggestions
        )

        return validation_result.to_dict()

    def clone_agent(self, agent_id: int, new_name: str) -> Optional[Agent]:
        """Clone an existing agent"""
        agent = self.get_agent(agent_id)
        if not agent:
            return None

        return self.create_agent(
            name=new_name,
            description=f"Clone of {agent.name}",
            model=agent.model,
            role=agent.config.role,
            instructions=agent.config.instructions.copy()
        )

    def get_agent_stats(self, agent_id: int) -> Optional[Dict[str, Any]]:
        """Get agent statistics"""
        agent = self.get_agent(agent_id)
        if not agent:
            return None

        execution_logs = self.db.get_execution_logs(agent_id, limit=100)

        total_executions = len(execution_logs)
        successful = sum(1 for log in execution_logs if log['status'] == 'success')
        failed = sum(1 for log in execution_logs if log['status'] == 'error')

        avg_duration = 0
        if total_executions > 0:
            avg_duration = sum(log['duration_ms'] for log in execution_logs) / total_executions

        return {
            'agent_id': agent_id,
            'name': agent.name,
            'total_executions': total_executions,
            'successful_executions': successful,
            'failed_executions': failed,
            'success_rate': (successful / total_executions * 100) if total_executions > 0 else 0,
            'average_duration_ms': avg_duration,
            'status': agent.status,
            'version': agent.version
        }
