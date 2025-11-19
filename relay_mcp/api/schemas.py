"""
Pydantic schemas for FastAPI endpoints
"""

from pydantic import BaseModel, Field
from typing import Dict, Any, Optional, List
from datetime import datetime
from enum import Enum


class MessageType(str, Enum):
    """Message type enum"""
    REQUEST = "request"
    RESPONSE = "response"
    BROADCAST = "broadcast"
    NOTIFICATION = "notification"


class Priority(str, Enum):
    """Priority enum"""
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    CRITICAL = "critical"


class MessagePayload(BaseModel):
    """Message payload schema"""
    content: str = Field(..., description="Message content")
    context: Optional[Dict[str, Any]] = Field(default={}, description="Optional context")


class MessageMetadata(BaseModel):
    """Message metadata schema"""
    timestamp: Optional[str] = Field(None, description="ISO timestamp")
    priority: Priority = Field(Priority.NORMAL, description="Message priority")
    ttl: int = Field(3600, description="Time-to-live in seconds")


class SendMessageRequest(BaseModel):
    """Request schema for /mcp/send endpoint"""
    from_ai: str = Field(..., alias="from", description="Source AI identifier")
    to: str = Field(..., description="Target AI identifier")
    payload: MessagePayload = Field(..., description="Message payload")
    type: MessageType = Field(MessageType.REQUEST, description="Message type")
    metadata: Optional[MessageMetadata] = Field(default=None, description="Message metadata")
    key: Optional[str] = Field(None, description="Optional custom message key")

    class Config:
        populate_by_name = True


class MessageResponse(BaseModel):
    """Response schema for message send"""
    key: str = Field(..., description="Message key")
    status: str = Field(..., description="Processing status")
    message: str = Field(..., description="Status message")


class StatsResponse(BaseModel):
    """Response schema for /mcp/stats endpoint"""
    server: Dict[str, Any]
    message_bus: Dict[str, Any]
    buffer: Dict[str, Any]
    persistence: Dict[str, Any]


class BufferMessage(BaseModel):
    """Schema for a message in the buffer"""
    key: str
    from_ai: str = Field(..., alias="from")
    to: str
    type: str
    payload: Dict[str, Any]
    metadata: Dict[str, Any]

    class Config:
        populate_by_name = True


class BufferResponse(BaseModel):
    """Response schema for /mcp/buffer endpoint"""
    total: int
    messages: List[BufferMessage]


class LogEntry(BaseModel):
    """Schema for a log entry"""
    message: Dict[str, Any]
    response: Optional[Dict[str, Any]]
    logged_at: str


class RecentLogsResponse(BaseModel):
    """Response schema for /mcp/logs/recent endpoint"""
    count: int
    logs: List[Dict[str, Any]]


class ConnectionInfo(BaseModel):
    """Schema for connector information"""
    ai_key: str
    enabled: bool
    healthy: bool


class ConnectionsResponse(BaseModel):
    """Response schema for /mcp/connections endpoint"""
    total: int
    connections: List[str]


class HealthResponse(BaseModel):
    """Response schema for /health endpoint"""
    status: str
    version: str = "1.0.0"
    uptime_seconds: Optional[float] = None
    active_connectors: int = 0
