"""
Skynet Companion Backend API
FastAPI server providing endpoints for the overlay application
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, List, Optional, Any
from datetime import datetime
import asyncio
import logging

from websocket_bridge import MCPBridge

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("companion_api")

# Initialize FastAPI app
app = FastAPI(
    title="Skynet Companion API",
    description="Backend API for Skynet Companion Overlay",
    version="1.0.0"
)

# CORS middleware (allow local WinUI3 app)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO: Restrict to localhost in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize MCP Bridge
mcp_bridge = MCPBridge(mcp_url="ws://localhost:8080/mcp")


# === Data Models ===

class OverlayMessage(BaseModel):
    id: str
    agent: str = "claude"
    content: str
    context: Optional[Dict[str, Any]] = None
    timestamp: str = datetime.utcnow().isoformat()
    type: str = "query"


class OverlayResponse(BaseModel):
    id: str
    content: str
    agent: str
    success: bool = True
    error: Optional[str] = None
    timestamp: str = datetime.utcnow().isoformat()


class VoiceQuery(BaseModel):
    query: str
    agent: str = "claude"


class ClipboardContent(BaseModel):
    text: str
    timestamp: str = datetime.utcnow().isoformat()
    source_app: str = "unknown"


class Agent(BaseModel):
    name: str
    display_name: str
    description: str
    available: bool = True
    icon: str = "🤖"


# === Endpoints ===

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "service": "Skynet Companion API",
        "status": "running",
        "version": "1.0.0"
    }


@app.get("/health")
async def health_check():
    """Detailed health check"""
    mcp_connected = await mcp_bridge.is_connected()
    return {
        "api": "healthy",
        "mcp_connection": "connected" if mcp_connected else "disconnected",
        "timestamp": datetime.utcnow().isoformat()
    }


@app.post("/overlay/send", response_model=OverlayResponse)
async def send_to_agent(message: OverlayMessage):
    """
    Send message to AI agent via MCP
    """
    try:
        logger.info(f"Sending message to agent: {message.agent}")

        # Forward to MCP Server
        response = await mcp_bridge.send_message({
            "agent": message.agent,
            "content": message.content,
            "context": message.context or {},
            "type": message.type
        })

        return OverlayResponse(
            id=message.id,
            content=response.get("content", ""),
            agent=message.agent,
            success=True
        )

    except Exception as e:
        logger.error(f"Error sending message: {e}")
        return OverlayResponse(
            id=message.id,
            content="",
            agent=message.agent,
            success=False,
            error=str(e)
        )


@app.post("/overlay/voice/query", response_model=OverlayResponse)
async def process_voice_query(query: VoiceQuery):
    """
    Process voice transcription and get AI response
    """
    try:
        logger.info(f"Voice query: {query.query[:50]}...")

        # Load voice query prompt
        # TODO: Load from prompts/voice_query.md
        system_prompt = "Respond concisely and contextually. If command detected, return JSON action."

        response = await mcp_bridge.send_message({
            "agent": query.agent,
            "content": query.query,
            "context": {
                "type": "voice",
                "system_prompt": system_prompt
            },
            "type": "voice"
        })

        return OverlayResponse(
            id=f"voice_{datetime.utcnow().timestamp()}",
            content=response.get("content", ""),
            agent=query.agent,
            success=True
        )

    except Exception as e:
        logger.error(f"Voice query error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/overlay/clipboard/analyze", response_model=OverlayResponse)
async def analyze_clipboard(content: ClipboardContent):
    """
    Analyze clipboard content with AI
    """
    try:
        logger.info("Analyzing clipboard content")

        # Load clipboard analysis prompt
        # TODO: Load from prompts/clipboard_analyze.md
        analysis_prompt = f"""
        Analyze the following content. Provide:
        - Summary
        - Suggested actions
        - Tags
        - Any risks or warnings

        Content:
        {content.text}
        """

        response = await mcp_bridge.send_message({
            "agent": "claude",  # Use Claude for analysis
            "content": analysis_prompt,
            "context": {
                "type": "clipboard",
                "source_app": content.source_app
            },
            "type": "clipboard"
        })

        return OverlayResponse(
            id=f"clipboard_{datetime.utcnow().timestamp()}",
            content=response.get("content", ""),
            agent="claude",
            success=True
        )

    except Exception as e:
        logger.error(f"Clipboard analysis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/overlay/agents", response_model=List[Agent])
async def get_available_agents():
    """
    Get list of available AI agents
    """
    # TODO: Query MCP Server for available agents
    # For now, return static list
    return [
        Agent(
            name="claude",
            display_name="Claude",
            description="Anthropic's Claude - Advanced reasoning and coding",
            available=True,
            icon="🤖"
        ),
        Agent(
            name="gpt",
            display_name="ChatGPT",
            description="OpenAI's GPT-4 - Versatile assistant",
            available=True,
            icon="💬"
        ),
        Agent(
            name="gemini",
            display_name="Gemini",
            description="Google's Gemini - Multimodal AI",
            available=True,
            icon="✨"
        ),
        Agent(
            name="comet",
            display_name="Comet",
            description="Perplexity - Research assistant",
            available=False,  # Not connected yet
            icon="🔍"
        )
    ]


@app.get("/overlay/context")
async def get_context():
    """
    Get current context (clipboard, recent memories, etc.)
    """
    # TODO: Implement context aggregation
    return {
        "clipboard": {
            "available": True,
            "last_updated": datetime.utcnow().isoformat()
        },
        "memory": {
            "count": 0,
            "last_updated": datetime.utcnow().isoformat()
        }
    }


@app.post("/overlay/context")
async def update_context(context: Dict[str, Any]):
    """
    Update context
    """
    # TODO: Store context updates
    logger.info(f"Context updated: {context.keys()}")
    return {"success": True}


@app.websocket("/overlay/stream")
async def websocket_stream(websocket: WebSocket):
    """
    WebSocket endpoint for streaming AI responses
    """
    await websocket.accept()
    logger.info("WebSocket client connected")

    try:
        while True:
            # Receive message from client
            data = await websocket.receive_json()

            logger.info(f"WebSocket message: {data.get('content', '')[:50]}...")

            # Stream response from MCP
            async for chunk in mcp_bridge.stream_message(data):
                await websocket.send_json({
                    "type": "chunk",
                    "content": chunk
                })

            # Send completion marker
            await websocket.send_json({
                "type": "complete"
            })

    except WebSocketDisconnect:
        logger.info("WebSocket client disconnected")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        await websocket.close()


# === Startup / Shutdown ===

@app.on_event("startup")
async def startup_event():
    """Initialize connections on startup"""
    logger.info("🚀 Starting Skynet Companion API...")

    # Connect to MCP Server
    try:
        await mcp_bridge.connect()
        logger.info("✅ Connected to MCP Server")
    except Exception as e:
        logger.error(f"❌ Failed to connect to MCP: {e}")
        logger.warning("⚠️  API will run but agent calls will fail")


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("Shutting down Skynet Companion API...")
    await mcp_bridge.disconnect()


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "companion_api:app",
        host="127.0.0.1",
        port=8765,
        reload=True,
        log_level="info"
    )
