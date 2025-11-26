"""
Visual builder component models
"""
from dataclasses import dataclass, asdict
from typing import Dict, Any, List, Optional
from enum import Enum

class ComponentCategory(Enum):
    """Component categories"""
    TRIGGER = "trigger"
    ACTION = "action"
    CONDITION = "condition"
    INTEGRATION = "integration"
    DATA = "data"

@dataclass
class ComponentPort:
    """Component connection port"""
    id: str
    name: str
    type: str  # input, output
    data_type: str  # string, number, boolean, object, array, any

    def to_dict(self):
        return asdict(self)

@dataclass
class ComponentMetadata:
    """Component metadata for visual builder"""
    id: str
    name: str
    category: str
    icon: str
    color: str
    description: str
    inputs: List[ComponentPort]
    outputs: List[ComponentPort]
    config_schema: Dict[str, Any]

    def to_dict(self):
        return asdict(self)

# Predefined component templates
COMPONENT_TEMPLATES = {
    "triggers": {
        "cron": ComponentMetadata(
            id="trigger_cron",
            name="Cron Trigger",
            category=ComponentCategory.TRIGGER.value,
            icon="⏰",
            color="#4CAF50",
            description="Execute on a cron schedule",
            inputs=[],
            outputs=[
                ComponentPort("output", "Event", "output", "object")
            ],
            config_schema={
                "type": "object",
                "properties": {
                    "schedule": {
                        "type": "string",
                        "description": "Cron expression (e.g., '0 */6 * * *')",
                        "default": "0 */1 * * *"
                    },
                    "timezone": {
                        "type": "string",
                        "default": "UTC"
                    }
                },
                "required": ["schedule"]
            }
        ),
        "webhook": ComponentMetadata(
            id="trigger_webhook",
            name="Webhook Trigger",
            category=ComponentCategory.TRIGGER.value,
            icon="🔗",
            color="#2196F3",
            description="Trigger via HTTP webhook",
            inputs=[],
            outputs=[
                ComponentPort("output", "Request", "output", "object")
            ],
            config_schema={
                "type": "object",
                "properties": {
                    "path": {
                        "type": "string",
                        "description": "Webhook path"
                    },
                    "method": {
                        "type": "string",
                        "enum": ["GET", "POST", "PUT", "DELETE"],
                        "default": "POST"
                    },
                    "auth": {
                        "type": "object",
                        "properties": {
                            "type": {"type": "string", "enum": ["none", "api_key", "bearer"]},
                            "key": {"type": "string"}
                        }
                    }
                },
                "required": ["path"]
            }
        ),
        "event": ComponentMetadata(
            id="trigger_event",
            name="Event Trigger",
            category=ComponentCategory.TRIGGER.value,
            icon="📡",
            color="#9C27B0",
            description="Trigger on system events",
            inputs=[],
            outputs=[
                ComponentPort("output", "Event Data", "output", "object")
            ],
            config_schema={
                "type": "object",
                "properties": {
                    "event_type": {
                        "type": "string",
                        "description": "Type of event to listen for"
                    },
                    "filters": {
                        "type": "object",
                        "description": "Event filters"
                    }
                },
                "required": ["event_type"]
            }
        )
    },
    "actions": {
        "ai_call": ComponentMetadata(
            id="action_ai_call",
            name="AI Call",
            category=ComponentCategory.ACTION.value,
            icon="🤖",
            color="#FF5722",
            description="Call an AI model",
            inputs=[
                ComponentPort("input", "Prompt", "input", "string"),
                ComponentPort("context", "Context", "input", "object")
            ],
            outputs=[
                ComponentPort("output", "Response", "output", "string"),
                ComponentPort("metadata", "Metadata", "output", "object")
            ],
            config_schema={
                "type": "object",
                "properties": {
                    "model": {
                        "type": "string",
                        "enum": ["claude-3-5-sonnet-20241022", "gpt-4-turbo-preview", "gpt-3.5-turbo"],
                        "default": "claude-3-5-sonnet-20241022"
                    },
                    "max_tokens": {
                        "type": "number",
                        "default": 4096
                    },
                    "temperature": {
                        "type": "number",
                        "minimum": 0,
                        "maximum": 1,
                        "default": 0.7
                    },
                    "system_prompt": {
                        "type": "string",
                        "description": "System instructions"
                    }
                },
                "required": ["model"]
            }
        ),
        "http_request": ComponentMetadata(
            id="action_http_request",
            name="HTTP Request",
            category=ComponentCategory.ACTION.value,
            icon="🌐",
            color="#00BCD4",
            description="Make an HTTP request",
            inputs=[
                ComponentPort("url", "URL", "input", "string"),
                ComponentPort("body", "Body", "input", "any")
            ],
            outputs=[
                ComponentPort("response", "Response", "output", "object"),
                ComponentPort("status", "Status Code", "output", "number")
            ],
            config_schema={
                "type": "object",
                "properties": {
                    "method": {
                        "type": "string",
                        "enum": ["GET", "POST", "PUT", "DELETE", "PATCH"],
                        "default": "GET"
                    },
                    "headers": {
                        "type": "object",
                        "description": "HTTP headers"
                    },
                    "timeout": {
                        "type": "number",
                        "default": 30000
                    },
                    "retry": {
                        "type": "object",
                        "properties": {
                            "max_attempts": {"type": "number", "default": 3},
                            "backoff": {"type": "number", "default": 1000}
                        }
                    }
                },
                "required": ["method"]
            }
        ),
        "file_ops": ComponentMetadata(
            id="action_file_ops",
            name="File Operations",
            category=ComponentCategory.ACTION.value,
            icon="📁",
            color="#795548",
            description="Read/write files",
            inputs=[
                ComponentPort("path", "File Path", "input", "string"),
                ComponentPort("content", "Content", "input", "any")
            ],
            outputs=[
                ComponentPort("result", "Result", "output", "any"),
                ComponentPort("success", "Success", "output", "boolean")
            ],
            config_schema={
                "type": "object",
                "properties": {
                    "operation": {
                        "type": "string",
                        "enum": ["read", "write", "append", "delete", "exists"],
                        "default": "read"
                    },
                    "encoding": {
                        "type": "string",
                        "default": "utf-8"
                    }
                },
                "required": ["operation"]
            }
        )
    },
    "conditions": {
        "if_else": ComponentMetadata(
            id="condition_if_else",
            name="If/Else",
            category=ComponentCategory.CONDITION.value,
            icon="🔀",
            color="#FF9800",
            description="Conditional branching",
            inputs=[
                ComponentPort("input", "Input", "input", "any")
            ],
            outputs=[
                ComponentPort("true", "True Branch", "output", "any"),
                ComponentPort("false", "False Branch", "output", "any")
            ],
            config_schema={
                "type": "object",
                "properties": {
                    "condition": {
                        "type": "string",
                        "description": "Condition expression (e.g., 'input > 10')"
                    }
                },
                "required": ["condition"]
            }
        ),
        "switch": ComponentMetadata(
            id="condition_switch",
            name="Switch",
            category=ComponentCategory.CONDITION.value,
            icon="🔄",
            color="#FFC107",
            description="Multi-way branching",
            inputs=[
                ComponentPort("input", "Input", "input", "any")
            ],
            outputs=[
                ComponentPort("output", "Matched Branch", "output", "any")
            ],
            config_schema={
                "type": "object",
                "properties": {
                    "cases": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "condition": {"type": "string"},
                                "output": {"type": "string"}
                            }
                        }
                    },
                    "default": {
                        "type": "string",
                        "description": "Default output"
                    }
                }
            }
        ),
        "filter": ComponentMetadata(
            id="condition_filter",
            name="Filter",
            category=ComponentCategory.CONDITION.value,
            icon="🔍",
            color="#FFEB3B",
            description="Filter array items",
            inputs=[
                ComponentPort("array", "Array", "input", "array")
            ],
            outputs=[
                ComponentPort("filtered", "Filtered", "output", "array")
            ],
            config_schema={
                "type": "object",
                "properties": {
                    "filter_expression": {
                        "type": "string",
                        "description": "Filter expression (e.g., 'item.value > 5')"
                    }
                },
                "required": ["filter_expression"]
            }
        )
    },
    "integrations": {
        "n8n": ComponentMetadata(
            id="integration_n8n",
            name="n8n Workflow",
            category=ComponentCategory.INTEGRATION.value,
            icon="⚡",
            color="#E91E63",
            description="Trigger n8n workflow",
            inputs=[
                ComponentPort("data", "Data", "input", "object")
            ],
            outputs=[
                ComponentPort("result", "Result", "output", "object")
            ],
            config_schema={
                "type": "object",
                "properties": {
                    "workflow_id": {
                        "type": "string",
                        "description": "n8n workflow ID"
                    },
                    "webhook_url": {
                        "type": "string",
                        "description": "Webhook URL"
                    }
                },
                "required": ["workflow_id"]
            }
        )
    }
}

def get_component_template(category: str, component_type: str) -> Optional[ComponentMetadata]:
    """Get component template by category and type"""
    if category in COMPONENT_TEMPLATES and component_type in COMPONENT_TEMPLATES[category]:
        return COMPONENT_TEMPLATES[category][component_type]
    return None

def get_all_components() -> Dict[str, List[ComponentMetadata]]:
    """Get all available components"""
    result = {}
    for category, components in COMPONENT_TEMPLATES.items():
        result[category] = [comp for comp in components.values()]
    return result
