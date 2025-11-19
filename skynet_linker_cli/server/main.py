"""
MCP Server - Multi-agent Communication Protocol Server

FastAPI-based WebSocket + REST server for coordinating multiple AI agents.
"""

import logging
import time
import asyncio
from typing import Dict, Any, Optional
from datetime import datetime
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Query, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn

# Local imports
from server.redis_store import RedisStore
from server.routing_engine import RoutingEngine
from server.websocket_router import ConnectionManager
from server.encryption import MessageEncryption
from server.models import (
    AgentRegisterRequest, AgentListResponse, AgentInfo,
    SendMessageRequest, MessageResponse,
    CreateSessionRequest, SessionInfo, SessionListResponse,
    ContextUpdateRequest, ContextResponse,
    ChannelSubscribeRequest, ChannelListResponse, ChannelInfo,
    HealthResponse, StatsResponse, ServerInfo, ErrorResponse
)
from protocol.mcp_message import build_task_message, parse_message
from protocol.validation import validate_message, is_valid_message


# ========== LOGGING SETUP ==========

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# ========== SERVER STATE ==========

class ServerState:
    """Global server state"""
    def __init__(self):
        self.start_time = time.time()
        self.redis_store: Optional[RedisStore] = None
        self.routing_engine: Optional[RoutingEngine] = None
        self.connection_manager: Optional[ConnectionManager] = None
        self.encryption: Optional[MessageEncryption] = None
        self.version = "1.0.0"


server_state = ServerState()


# ========== LIFESPAN EVENTS ==========

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager for startup/shutdown events.
    """
    # Startup
    logger.info("🚀 Starting MCP Server...")

    # Initialize Redis
    redis_url = "redis://localhost:6379/0"  # TODO: Load from config
    server_state.redis_store = RedisStore(redis_url=redis_url)
    await server_state.redis_store.connect()

    # Initialize routing engine
    server_state.routing_engine = RoutingEngine()

    # Initialize encryption (optional for MVP)
    # server_state.encryption = MessageEncryption()

    # Initialize connection manager
    server_state.connection_manager = ConnectionManager(
        routing_engine=server_state.routing_engine,
        redis_store=server_state.redis_store,
        encryption=server_state.encryption
    )

    logger.info("✅ MCP Server started successfully")

    yield

    # Shutdown
    logger.info("🛑 Shutting down MCP Server...")

    # Disconnect all agents
    if server_state.connection_manager:
        await server_state.connection_manager.disconnect_all()

    # Close Redis connection
    if server_state.redis_store:
        await server_state.redis_store.disconnect()

    logger.info("✅ MCP Server shutdown complete")


# ========== FASTAPI APP ==========

app = FastAPI(
    title="Skynet Linker - MCP Server",
    description="Multi-agent Communication Protocol Server for coordinating AI agents",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO: Restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ========== WEBSOCKET ENDPOINTS ==========

@app.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    agent_id: str = Query(..., description="Agent identifier"),
    agent_type: str = Query(default="generic", description="Agent type"),
    channels: str = Query(default="default", description="Comma-separated channels"),
    priority: int = Query(default=5, ge=1, le=10, description="Agent priority")
):
    """
    WebSocket endpoint for agent connections.

    Query Parameters:
    - agent_id: Unique agent identifier
    - agent_type: Type/role of agent
    - channels: Comma-separated channel names
    - priority: Agent priority (1-10)

    Example:
    ws://localhost:8000/ws?agent_id=claude_cli&agent_type=planner&channels=skynet_core,default&priority=8
    """
    channel_list = [c.strip() for c in channels.split(",") if c.strip()]

    try:
        # Connect agent
        await server_state.connection_manager.connect(
            websocket=websocket,
            agent_id=agent_id,
            agent_type=agent_type,
            channels=channel_list,
            priority=priority
        )

        # Listen for messages
        while True:
            try:
                # Receive message from agent
                raw_data = await websocket.receive_json()

                # Handle the message
                await server_state.connection_manager.handle_incoming_message(
                    agent_id=agent_id,
                    raw_message=raw_data
                )

            except WebSocketDisconnect:
                logger.info(f"WebSocket disconnected: {agent_id}")
                break
            except Exception as e:
                logger.error(f"Error handling WebSocket message from {agent_id}: {e}")
                await server_state.connection_manager.send_error_message(
                    websocket, str(e), "MESSAGE_ERROR"
                )

    except Exception as e:
        logger.error(f"WebSocket connection error for {agent_id}: {e}")
    finally:
        # Cleanup on disconnect
        await server_state.connection_manager.disconnect(agent_id)


# ========== REST API ENDPOINTS ==========

# --- Health & Info ---

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    redis_ok = await server_state.redis_store.ping() if server_state.redis_store else False

    return HealthResponse(
        status="healthy" if redis_ok else "degraded",
        version=server_state.version,
        uptime_seconds=time.time() - server_state.start_time,
        redis_connected=redis_ok,
        total_agents=server_state.connection_manager.get_connection_count(),
        total_channels=len(server_state.routing_engine.channel_subscriptions)
    )


@app.get("/info", response_model=ServerInfo)
async def server_info():
    """Get server information"""
    return ServerInfo(
        version=server_state.version,
        uptime=time.time() - server_state.start_time
    )


@app.get("/stats", response_model=StatsResponse)
async def get_stats():
    """Get server statistics"""
    redis_stats = await server_state.redis_store.get_stats()
    routing_stats = server_state.routing_engine.get_routing_stats()

    return StatsResponse(
        server={
            "uptime_seconds": time.time() - server_state.start_time,
            "connected_agents": server_state.connection_manager.get_connection_count()
        },
        routing=routing_stats,
        storage=redis_stats
    )


# --- Agent Management ---

@app.get("/agents", response_model=AgentListResponse)
async def list_agents():
    """List all connected agents"""
    agents = server_state.routing_engine.get_all_agents()

    agent_infos = []
    for agent in agents:
        conn_info = server_state.connection_manager.get_connection_info(agent["agent_id"])

        agent_infos.append(AgentInfo(
            agent_id=agent["agent_id"],
            agent_type=agent["agent_type"],
            priority=agent["priority"],
            channels=server_state.routing_engine.get_agent_channels(agent["agent_id"]),
            message_count=agent.get("message_count", 0),
            connected_at=conn_info.get("connected_at") if conn_info else None,
            metadata=agent.get("metadata", {})
        ))

    return AgentListResponse(
        total=len(agent_infos),
        agents=agent_infos
    )


@app.get("/agents/{agent_id}")
async def get_agent(agent_id: str):
    """Get specific agent information"""
    agent = server_state.routing_engine.get_agent(agent_id)

    if not agent:
        raise HTTPException(status_code=404, detail=f"Agent {agent_id} not found")

    conn_info = server_state.connection_manager.get_connection_info(agent_id)

    return AgentInfo(
        agent_id=agent["agent_id"],
        agent_type=agent["agent_type"],
        priority=agent["priority"],
        channels=server_state.routing_engine.get_agent_channels(agent_id),
        message_count=agent.get("message_count", 0),
        connected_at=conn_info.get("connected_at") if conn_info else None,
        metadata=agent.get("metadata", {})
    )


# --- Message Operations ---

@app.post("/messages/send", response_model=MessageResponse)
async def send_message(request: SendMessageRequest):
    """
    Send a message via REST API (alternative to WebSocket).

    Used for external integrations or agents without persistent WebSocket.
    """
    try:
        # Build MCP message
        message = build_task_message(
            from_agent=request.from_agent,
            to_agent=request.to_agent,
            task_description=request.content,
            channel=request.channel,
            context=request.context,
            meta=request.meta
        ).to_dict()

        # Validate message
        if not is_valid_message(message):
            raise HTTPException(status_code=400, detail="Invalid message format")

        # Route message
        sent_count = await server_state.connection_manager.route_message(message)

        recipients = server_state.routing_engine.route_message(message)

        return MessageResponse(
            success=sent_count > 0,
            message_id=message["id"],
            recipients=recipients
        )

    except Exception as e:
        logger.error(f"Failed to send message: {e}")
        return MessageResponse(success=False, error=str(e))


# --- Context Management ---

@app.get("/context/{agent_id}", response_model=ContextResponse)
async def get_context(agent_id: str):
    """Get agent context from Redis"""
    context = await server_state.redis_store.get_context(agent_id)

    if context is None:
        return ContextResponse(
            success=False,
            agent_id=agent_id,
            error="Context not found"
        )

    return ContextResponse(
        success=True,
        agent_id=agent_id,
        context=context
    )


@app.post("/context", response_model=ContextResponse)
async def update_context(request: ContextUpdateRequest):
    """Update agent context in Redis"""
    success = await server_state.redis_store.set_context(
        request.agent_id,
        request.context
    )

    return ContextResponse(
        success=success,
        agent_id=request.agent_id,
        context=request.context if success else None
    )


# --- Session Management ---

@app.post("/sessions", response_model=SessionInfo)
async def create_session(request: CreateSessionRequest):
    """Create a new collaboration session"""
    import uuid

    session_id = request.session_id or str(uuid.uuid4())

    metadata = request.metadata or {}
    metadata["participants"] = request.participants
    if request.goal:
        metadata["goal"] = request.goal

    success = await server_state.redis_store.create_session(session_id, metadata)

    if not success:
        raise HTTPException(status_code=500, detail="Failed to create session")

    session = await server_state.redis_store.get_session(session_id)

    return SessionInfo(**session)


@app.get("/sessions/{session_id}", response_model=SessionInfo)
async def get_session(session_id: str):
    """Get session information"""
    session = await server_state.redis_store.get_session(session_id)

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    return SessionInfo(**session)


# --- Channel Management ---

@app.get("/channels", response_model=ChannelListResponse)
async def list_channels():
    """List all active channels"""
    channels = []

    for channel_name, subscribers in server_state.routing_engine.channel_subscriptions.items():
        channels.append(ChannelInfo(
            channel=channel_name,
            subscribers=list(subscribers),
            message_count=0  # TODO: Track message count per channel
        ))

    return ChannelListResponse(
        total=len(channels),
        channels=channels
    )


# ========== ERROR HANDLERS ==========

@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    """Handle HTTP exceptions"""
    return JSONResponse(
        status_code=exc.status_code,
        content=ErrorResponse(
            error=exc.detail,
            error_code=f"HTTP_{exc.status_code}",
        ).dict()
    )


# ========== MAIN ENTRY POINT ==========

if __name__ == "__main__":
    uvicorn.run(
        "server.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
