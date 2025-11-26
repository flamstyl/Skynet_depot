"""
Agent data models
"""
from dataclasses import dataclass, field, asdict
from typing import List, Dict, Any, Optional
from datetime import datetime
from enum import Enum

class AgentStatus(Enum):
    """Agent status"""
    DRAFT = "draft"
    ACTIVE = "active"
    INACTIVE = "inactive"
    TESTING = "testing"
    ERROR = "error"

class TriggerType(Enum):
    """Trigger types"""
    TIME = "time"
    EVENT = "event"
    WEBHOOK = "webhook"
    MANUAL = "manual"
    FILE_WATCH = "file_watch"

class ActionType(Enum):
    """Action types"""
    HTTP_REQUEST = "http_request"
    DATABASE = "database"
    FILE_OPS = "file_ops"
    AI_CALL = "ai_call"
    EMAIL = "email"
    SLACK = "slack"

@dataclass
class Trigger:
    """Agent trigger configuration"""
    type: str
    config: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self):
        return asdict(self)

@dataclass
class Action:
    """Agent action configuration"""
    type: str
    name: str
    config: Dict[str, Any] = field(default_factory=dict)
    retry_config: Optional[Dict[str, Any]] = None

    def to_dict(self):
        return asdict(self)

@dataclass
class Condition:
    """Agent condition/logic"""
    type: str
    expression: str
    true_branch: Optional[List[str]] = None
    false_branch: Optional[List[str]] = None

    def to_dict(self):
        return asdict(self)

@dataclass
class AgentConfig:
    """Complete agent configuration"""
    name: str
    description: str
    model: str
    role: str
    instructions: List[str]
    triggers: List[Trigger] = field(default_factory=list)
    actions: List[Action] = field(default_factory=list)
    conditions: List[Condition] = field(default_factory=list)
    context: Dict[str, Any] = field(default_factory=dict)
    memory_config: Dict[str, Any] = field(default_factory=dict)
    integrations: List[Dict[str, Any]] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self):
        return {
            'name': self.name,
            'description': self.description,
            'model': self.model,
            'role': self.role,
            'instructions': self.instructions,
            'triggers': [t.to_dict() for t in self.triggers],
            'actions': [a.to_dict() for a in self.actions],
            'conditions': [c.to_dict() for c in self.conditions],
            'context': self.context,
            'memory_config': self.memory_config,
            'integrations': self.integrations,
            'metadata': self.metadata
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'AgentConfig':
        """Create AgentConfig from dictionary"""
        return cls(
            name=data['name'],
            description=data.get('description', ''),
            model=data['model'],
            role=data.get('role', ''),
            instructions=data.get('instructions', []),
            triggers=[Trigger(**t) for t in data.get('triggers', [])],
            actions=[Action(**a) for a in data.get('actions', [])],
            conditions=[Condition(**c) for c in data.get('conditions', [])],
            context=data.get('context', {}),
            memory_config=data.get('memory_config', {}),
            integrations=data.get('integrations', []),
            metadata=data.get('metadata', {})
        )

@dataclass
class Agent:
    """Agent entity"""
    id: Optional[int]
    name: str
    description: str
    model: str
    config: AgentConfig
    status: str = AgentStatus.DRAFT.value
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    version: int = 1

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'model': self.model,
            'config': self.config.to_dict(),
            'status': self.status,
            'created_at': self.created_at,
            'updated_at': self.updated_at,
            'version': self.version
        }

@dataclass
class ValidationResult:
    """AI validation result"""
    agent_id: int
    validator: str
    score: float
    feedback: str
    suggestions: List[str]
    validated_at: str

    def to_dict(self):
        return asdict(self)

@dataclass
class ExecutionResult:
    """Execution result"""
    agent_id: int
    execution_type: str
    status: str
    input_data: Optional[Any] = None
    output_data: Optional[Any] = None
    error_message: Optional[str] = None
    duration_ms: int = 0
    executed_at: Optional[str] = None

    def to_dict(self):
        return asdict(self)
