"""
FastAPI Models - Pydantic models for REST API and WebSocket

Defines request/response models for the MCP server API.
"""

from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
from datetime import datetime


# ========== AGENT MODELS ==========

class AgentRegisterRequest(BaseModel):
    """Request to register an agent"""
    agent_id: str = Field(..., min_length=1, max_length=128, regex=r"^[a-zA-Z0-9_-]+$")
    agent_type: str = Field(default="generic", description="Type/role of agent")
    channels: List[str] = Field(default_factory=lambda: ["default"], description="Channels to subscribe to")
    priority: int = Field(default=5, ge=1, le=10, description="Agent priority (1-10)")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata")

    class Config:
        schema_extra = {
            "example": {
                "agent_id": "claude_cli",
                "agent_type": "planner",
                "channels": ["skynet_core", "default"],
                "priority": 8,
                "metadata": {"version": "1.0", "capabilities": ["planning", "analysis"]}
            }
        }


class AgentInfo(BaseModel):
    """Agent information"""
    agent_id: str
    agent_type: str
    priority: int
    channels: List[str]
    message_count: int = 0
    connected_at: Optional[str] = None
    metadata: Dict[str, Any] = {}


class AgentListResponse(BaseModel):
    """Response for listing agents"""
    total: int
    agents: List[AgentInfo]


# ========== MESSAGE MODELS ==========

class SendMessageRequest(BaseModel):
    """Request to send a message via REST API"""
    from_agent: str
    to_agent: Optional[str] = None
    type: str = "task"
    channel: str = "default"
    content: Any
    context: Dict[str, Any] = Field(default_factory=dict)
    meta: Dict[str, Any] = Field(default_factory=dict)
    encrypt: bool = False

    class Config:
        schema_extra = {
            "example": {
                "from_agent": "claude_cli",
                "to_agent": "gemini",
                "type": "task",
                "channel": "skynet_core",
                "content": "Recherche les derniers papiers sur RAG",
                "context": {"session_id": "sess_123", "priority": 8},
                "meta": {"ttl": 3600},
                "encrypt": False
            }
        }


class MessageResponse(BaseModel):
    """Response for message operations"""
    success: bool
    message_id: Optional[str] = None
    recipients: List[str] = Field(default_factory=list)
    error: Optional[str] = None


# ========== SESSION MODELS ==========

class CreateSessionRequest(BaseModel):
    """Request to create a session"""
    session_id: Optional[str] = None  # Auto-generated if not provided
    participants: List[str]
    goal: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)

    class Config:
        schema_extra = {
            "example": {
                "participants": ["claude_cli", "gemini"],
                "goal": "Collaborative research on RAG",
                "metadata": {"deadline": "2025-12-01", "tags": ["research", "rag"]}
            }
        }


class SessionInfo(BaseModel):
    """Session information"""
    session_id: str
    participants: List[str]
    status: str
    created_at: str
    updated_at: Optional[str] = None
    message_count: int = 0
    metadata: Dict[str, Any] = {}


class SessionListResponse(BaseModel):
    """Response for listing sessions"""
    total: int
    sessions: List[SessionInfo]


# ========== CONTEXT MODELS ==========

class ContextUpdateRequest(BaseModel):
    """Request to update agent context"""
    agent_id: str
    context: Dict[str, Any]

    class Config:
        schema_extra = {
            "example": {
                "agent_id": "claude_cli",
                "context": {
                    "global_summary": "Analyzing RAG papers",
                    "last_intent": "Research latest developments",
                    "shared_knowledge": {"fact1": "RAG improves LLM accuracy"}
                }
            }
        }


class ContextResponse(BaseModel):
    """Response for context operations"""
    success: bool
    agent_id: str
    context: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


# ========== CHANNEL MODELS ==========

class ChannelSubscribeRequest(BaseModel):
    """Request to subscribe to a channel"""
    agent_id: str
    channel: str


class ChannelInfo(BaseModel):
    """Channel information"""
    channel: str
    subscribers: List[str]
    message_count: int = 0


class ChannelListResponse(BaseModel):
    """Response for listing channels"""
    total: int
    channels: List[ChannelInfo]


# ========== STATS & HEALTH MODELS ==========

class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    version: str
    uptime_seconds: float
    redis_connected: bool
    total_agents: int
    total_channels: int


class StatsResponse(BaseModel):
    """Statistics response"""
    server: Dict[str, Any]
    routing: Dict[str, Any]
    storage: Dict[str, Any]


class ServerInfo(BaseModel):
    """Server information"""
    version: str = "1.0.0"
    protocol_version: str = "MCP/1.0"
    features: List[str] = [
        "websocket",
        "rest_api",
        "encryption",
        "redis_storage",
        "multi_agent_routing"
    ]
    uptime: float = 0.0


# ========== ERROR MODELS ==========

class ErrorResponse(BaseModel):
    """Error response"""
    error: str
    error_code: str
    details: Optional[Dict[str, Any]] = None
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

    class Config:
        schema_extra = {
            "example": {
                "error": "Agent not found",
                "error_code": "AGENT_NOT_FOUND",
                "details": {"agent_id": "unknown_agent"},
                "timestamp": "2025-11-19T12:34:56Z"
            }
        }


# ========== WEBSOCKET MODELS ==========

class WebSocketMessage(BaseModel):
    """WebSocket message wrapper"""
    type: str  # "mcp_message", "control", "error"
    data: Dict[str, Any]


class ControlMessage(BaseModel):
    """Control message for WebSocket"""
    action: str  # "ping", "pong", "subscribe", "unsubscribe"
    params: Dict[str, Any] = Field(default_factory=dict)
