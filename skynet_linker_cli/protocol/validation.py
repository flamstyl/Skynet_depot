"""
MCP Message Validation

Validates MCP messages using Pydantic models and JSON schema.
"""

from typing import Dict, Any, Optional, List
from datetime import datetime
from pydantic import BaseModel, Field, validator, UUID4
from enum import Enum
import json
import jsonschema
from pathlib import Path


class MessageType(str, Enum):
    """MCP Message types"""
    TASK = "task"
    REPLY = "reply"
    CONTEXT_UPDATE = "context_update"
    BROADCAST = "broadcast"
    HEARTBEAT = "heartbeat"
    ACK = "ack"
    ERROR = "error"


class PayloadMeta(BaseModel):
    """Metadata within payload"""
    timestamp: str
    ttl: int = Field(default=3600, ge=0, le=86400)
    requires_ack: bool = False
    retry_count: int = Field(default=0, ge=0)

    class Config:
        extra = "allow"  # Allow additional fields


class PayloadContext(BaseModel):
    """Context within payload"""
    session_id: Optional[str] = None
    parent_message_id: Optional[str] = None
    priority: int = Field(default=5, ge=1, le=10)
    tags: List[str] = Field(default_factory=list)

    class Config:
        extra = "allow"  # Allow additional fields


class MessagePayload(BaseModel):
    """Message payload structure"""
    content: Any  # Can be string, dict, list, etc.
    context: PayloadContext = Field(default_factory=PayloadContext)
    meta: PayloadMeta

    class Config:
        extra = "forbid"  # Strict payload structure


class MCPMessageModel(BaseModel):
    """Pydantic model for MCP message validation"""
    id: str
    from_agent: str = Field(min_length=1, max_length=128, regex=r"^[a-zA-Z0-9_-]+$")
    to_agent: Optional[str] = Field(None, min_length=1, max_length=128, regex=r"^[a-zA-Z0-9_-]+$")
    type: MessageType
    channel: str = Field(default="default", min_length=1, max_length=128)
    payload: MessagePayload
    timestamp: str  # ISO 8601 format
    trace_id: str
    parent_id: Optional[str] = None
    encrypted: bool = False
    signature: Optional[str] = None

    @validator('timestamp')
    def validate_timestamp(cls, v):
        """Validate ISO 8601 timestamp format"""
        try:
            datetime.fromisoformat(v.replace('Z', '+00:00'))
        except ValueError:
            raise ValueError(f"Invalid ISO 8601 timestamp: {v}")
        return v

    @validator('type')
    def validate_message_type(cls, v):
        """Validate message type"""
        if v not in MessageType.__members__.values():
            raise ValueError(f"Invalid message type: {v}")
        return v

    @validator('to_agent')
    def validate_routing(cls, v, values):
        """Validate routing logic (broadcast vs direct)"""
        msg_type = values.get('type')

        # Broadcast messages should not have to_agent
        if msg_type == MessageType.BROADCAST and v is not None:
            raise ValueError("Broadcast messages cannot have 'to_agent' specified")

        # Direct messages should have to_agent
        if msg_type in [MessageType.TASK, MessageType.REPLY, MessageType.ACK] and v is None:
            raise ValueError(f"{msg_type} messages must have 'to_agent' specified")

        return v

    class Config:
        extra = "forbid"  # No additional fields allowed
        use_enum_values = True


class ValidationError(Exception):
    """Custom validation error"""
    def __init__(self, errors: List[str]):
        self.errors = errors
        super().__init__(f"Validation failed: {'; '.join(errors)}")


class MessageValidator:
    """MCP Message validator using Pydantic and JSON schema"""

    def __init__(self, schema_path: Optional[Path] = None):
        """
        Initialize validator.

        Args:
            schema_path: Path to JSON schema file (optional)
        """
        self.schema = None
        if schema_path and schema_path.exists():
            with open(schema_path, 'r') as f:
                self.schema = json.load(f)

    def validate_with_pydantic(self, message_dict: Dict[str, Any]) -> MCPMessageModel:
        """
        Validate message using Pydantic model.

        Args:
            message_dict: Message as dictionary

        Returns:
            Validated MCPMessageModel

        Raises:
            ValidationError: If validation fails
        """
        try:
            return MCPMessageModel(**message_dict)
        except Exception as e:
            raise ValidationError([str(e)])

    def validate_with_json_schema(self, message_dict: Dict[str, Any]) -> bool:
        """
        Validate message using JSON schema.

        Args:
            message_dict: Message as dictionary

        Returns:
            True if valid

        Raises:
            ValidationError: If validation fails
        """
        if not self.schema:
            raise ValueError("JSON schema not loaded")

        try:
            jsonschema.validate(instance=message_dict, schema=self.schema)
            return True
        except jsonschema.ValidationError as e:
            raise ValidationError([str(e)])

    def validate(self, message_dict: Dict[str, Any], strict: bool = True) -> bool:
        """
        Validate message (main method).

        Args:
            message_dict: Message as dictionary
            strict: If True, use both Pydantic and JSON schema

        Returns:
            True if valid

        Raises:
            ValidationError: If validation fails
        """
        errors = []

        # Always validate with Pydantic
        try:
            self.validate_with_pydantic(message_dict)
        except ValidationError as e:
            errors.extend(e.errors)

        # Optional JSON schema validation
        if strict and self.schema:
            try:
                self.validate_with_json_schema(message_dict)
            except ValidationError as e:
                errors.extend(e.errors)

        if errors:
            raise ValidationError(errors)

        return True


# Convenience functions

def validate_message(message_dict: Dict[str, Any], strict: bool = False) -> bool:
    """
    Quick validation function.

    Args:
        message_dict: Message to validate
        strict: Use JSON schema validation

    Returns:
        True if valid

    Raises:
        ValidationError: If invalid
    """
    # Try to find schema file
    schema_path = Path(__file__).parent / "schema.json"

    validator = MessageValidator(schema_path if schema_path.exists() else None)
    return validator.validate(message_dict, strict=strict)


def is_valid_message(message_dict: Dict[str, Any]) -> bool:
    """
    Check if message is valid (returns bool, no exceptions).

    Args:
        message_dict: Message to validate

    Returns:
        True if valid, False otherwise
    """
    try:
        validate_message(message_dict, strict=False)
        return True
    except (ValidationError, Exception):
        return False


def sanitize_message(message_dict: Dict[str, Any]) -> Dict[str, Any]:
    """
    Sanitize message by removing invalid fields.

    Args:
        message_dict: Raw message

    Returns:
        Sanitized message dictionary
    """
    try:
        # Validate and let Pydantic handle defaults
        validated = MCPMessageModel(**message_dict)
        return validated.dict()
    except Exception:
        # If validation fails, return original with warning
        return message_dict


def get_validation_errors(message_dict: Dict[str, Any]) -> List[str]:
    """
    Get list of validation errors without raising exception.

    Args:
        message_dict: Message to validate

    Returns:
        List of error messages (empty if valid)
    """
    try:
        validate_message(message_dict)
        return []
    except ValidationError as e:
        return e.errors
    except Exception as e:
        return [str(e)]
