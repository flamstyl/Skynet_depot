"""
FastAPI application for RelayMCP REST interface
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import asyncio
from datetime import datetime, timezone
from typing import Optional

from api.schemas import (
    SendMessageRequest,
    MessageResponse,
    StatsResponse,
    BufferResponse,
    RecentLogsResponse,
    ConnectionsResponse,
    HealthResponse
)
from core.relay_server import RelayServer
from core.protocol_mcp import MCPProtocol, Priority


# Global server instance
relay_server: Optional[RelayServer] = None
server_task: Optional[asyncio.Task] = None
start_time: Optional[datetime] = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup/shutdown"""
    global relay_server, server_task, start_time

    # Startup
    print("Starting RelayMCP FastAPI server...")
    relay_server = RelayServer()
    start_time = datetime.now(timezone.utc)

    # Start relay server in background
    server_task = asyncio.create_task(relay_server.start())

    yield

    # Shutdown
    print("Shutting down RelayMCP FastAPI server...")
    await relay_server.stop()
    if server_task:
        server_task.cancel()
        try:
            await server_task
        except asyncio.CancelledError:
            pass


# Create FastAPI app
app = FastAPI(
    title="RelayMCP API",
    description="Message Communication Protocol relay server for multi-AI coordination",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO: Configure properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", tags=["root"])
async def root():
    """Root endpoint"""
    return {
        "service": "RelayMCP",
        "version": "1.0.0",
        "description": "Multi-AI communication relay server",
        "endpoints": {
            "health": "/health",
            "send_message": "POST /mcp/send",
            "stats": "/mcp/stats",
            "buffer": "/mcp/buffer",
            "recent_logs": "/mcp/logs/recent",
            "connections": "/mcp/connections"
        }
    }


@app.get("/health", response_model=HealthResponse, tags=["health"])
async def health_check():
    """Health check endpoint"""
    if not relay_server or not relay_server.running:
        raise HTTPException(status_code=503, detail="Server not running")

    uptime = None
    if start_time:
        uptime = (datetime.now(timezone.utc) - start_time).total_seconds()

    active_connectors = len(relay_server.message_bus.get_active_connections())

    return HealthResponse(
        status="healthy",
        version="1.0.0",
        uptime_seconds=uptime,
        active_connectors=active_connectors
    )


@app.post("/mcp/send", response_model=MessageResponse, tags=["messages"])
async def send_message(request: SendMessageRequest):
    """
    Send MCP message to target AI

    This endpoint accepts an MCP message and enqueues it for processing.
    The message will be routed to the appropriate AI connector.
    """
    if not relay_server or not relay_server.running:
        raise HTTPException(status_code=503, detail="Server not running")

    try:
        # Build MCP message
        metadata = request.metadata or {}
        message = MCPProtocol.build_request(
            from_ai=request.from_ai,
            to_ai=request.to,
            content=request.payload.content,
            context=request.payload.context,
            priority=Priority(metadata.priority) if hasattr(metadata, 'priority') else Priority.NORMAL,
            ttl=metadata.ttl if hasattr(metadata, 'ttl') else 3600,
            message_key=request.key
        )

        # Enqueue message
        success = await relay_server.message_bus.enqueue(message)

        if not success:
            raise HTTPException(status_code=400, detail="Failed to enqueue message")

        return MessageResponse(
            key=message["key"],
            status="enqueued",
            message=f"Message enqueued for routing to {request.to}"
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")


@app.get("/mcp/stats", response_model=StatsResponse, tags=["monitoring"])
async def get_stats():
    """
    Get comprehensive statistics

    Returns statistics about the server, message bus, buffer, and persistence layer.
    """
    if not relay_server:
        raise HTTPException(status_code=503, detail="Server not initialized")

    try:
        stats = relay_server.get_stats()
        return StatsResponse(**stats)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving stats: {str(e)}")


@app.get("/mcp/buffer", tags=["monitoring"])
async def get_buffer(limit: int = 100):
    """
    Get buffer contents

    Returns recent messages from the circular buffer.
    """
    if not relay_server:
        raise HTTPException(status_code=503, detail="Server not initialized")

    try:
        messages = relay_server.buffer_manager.get_recent(limit=limit)
        return {
            "total": len(messages),
            "limit": limit,
            "messages": messages
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving buffer: {str(e)}")


@app.get("/mcp/logs/recent", tags=["monitoring"])
async def get_recent_logs(limit: int = 50):
    """
    Get recent traffic logs

    Returns recently completed messages with their responses.
    """
    if not relay_server:
        raise HTTPException(status_code=503, detail="Server not initialized")

    try:
        logs = relay_server.message_bus.get_recent_completed(limit=limit)
        return {
            "count": len(logs),
            "limit": limit,
            "logs": logs
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving logs: {str(e)}")


@app.get("/mcp/connections", response_model=ConnectionsResponse, tags=["monitoring"])
async def get_connections():
    """
    Get active AI connections

    Returns list of currently registered AI connectors.
    """
    if not relay_server:
        raise HTTPException(status_code=503, detail="Server not initialized")

    try:
        connections = relay_server.message_bus.get_active_connections()
        return ConnectionsResponse(
            total=len(connections),
            connections=connections
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving connections: {str(e)}")


@app.get("/mcp/buffer/conversation/{ai1}/{ai2}", tags=["monitoring"])
async def get_conversation(ai1: str, ai2: str):
    """
    Get conversation between two AIs

    Returns all messages exchanged between the specified AIs.
    """
    if not relay_server:
        raise HTTPException(status_code=503, detail="Server not initialized")

    try:
        messages = relay_server.buffer_manager.get_conversation(ai1, ai2)
        return {
            "ai1": ai1,
            "ai2": ai2,
            "count": len(messages),
            "messages": messages
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving conversation: {str(e)}")


# Entry point for uvicorn
if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "api.fastapi_app:app",
        host="127.0.0.1",
        port=8000,
        reload=False,
        log_level="info"
    )
