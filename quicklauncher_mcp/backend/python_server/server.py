"""
QuickLauncher MCP - Backend Server (FastAPI)
"""
import os
import time
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from models import (
    SearchRequest, AIPromptRequest, ActionRequest,
    SearchResponse, AIResponse, ActionResponse, IndexRebuildResponse,
    PluginInfo, HealthResponse, IndexedItem
)
from indexer import Indexer
from actions_manager import ActionsManager
from ai_bridge import AIBridge


# Configuration
BASE_DIR = Path(__file__).parent.parent.parent
DATA_DIR = BASE_DIR / 'data'
CONFIG_DIR = BASE_DIR / 'launcher' / 'config'

DB_PATH = str(DATA_DIR / 'index.db')
CONFIG_PATH = str(CONFIG_DIR / 'settings.json')
INDEXER_CONFIG_PATH = str(BASE_DIR / 'backend' / 'python_server' / 'config.yaml')

# Ensure directories exist
DATA_DIR.mkdir(parents=True, exist_ok=True)
CONFIG_DIR.mkdir(parents=True, exist_ok=True)

# Global instances
indexer: Indexer = None
actions_manager: ActionsManager = None
ai_bridge: AIBridge = None
start_time = time.time()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup/shutdown"""
    global indexer, actions_manager, ai_bridge

    # Startup
    print("Initializing QuickLauncher Backend...")

    indexer = Indexer(DB_PATH, INDEXER_CONFIG_PATH)
    actions_manager = ActionsManager()
    ai_bridge = AIBridge()

    # Build initial index if empty
    stats = indexer.get_stats()
    if stats['total'] == 0:
        print("Building initial index...")
        result = indexer.rebuild_index()
        print(f"Index built: {result['indexed']} items in {result['duration']}")

    print("QuickLauncher Backend ready!")

    yield

    # Shutdown
    print("Shutting down QuickLauncher Backend...")


# Create FastAPI app
app = FastAPI(
    title="QuickLauncher MCP Backend",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Health check
@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    stats = indexer.get_stats()

    return HealthResponse(
        status="ok",
        version="1.0.0",
        uptime=time.time() - start_time,
        indexed_items=stats['total'],
        plugins=0  # TODO: Count loaded plugins
    )


# Search endpoint
@app.post("/search")
async def search(request: SearchRequest):
    """Search indexed items"""
    start = time.time()

    results = indexer.search(request.query, limit=10)

    duration = time.time() - start

    return {
        'results': results,
        'query': request.query,
        'count': len(results),
        'duration': duration
    }


# AI prompt endpoint
@app.post("/ai", response_model=AIResponse)
async def ai_prompt(request: AIPromptRequest):
    """Process AI prompt"""

    result = await ai_bridge.process_prompt(request.prompt, request.mode)

    return AIResponse(
        response=result['response'],
        actions=result.get('actions', []),
        mode=result.get('mode', request.mode)
    )


# Action execution endpoint
@app.post("/action", response_model=ActionResponse)
async def execute_action(request: ActionRequest):
    """Execute an action"""

    result = actions_manager.execute(
        request.type,
        request.target,
        request.input,
        request.metadata
    )

    # Update frequency if item_id is in metadata
    if request.metadata and 'id' in request.metadata:
        try:
            indexer.update_frequency(request.metadata['id'])
        except:
            pass

    return ActionResponse(
        status=result['status'],
        message=result.get('message'),
        data=result.get('data')
    )


# Index rebuild endpoint
@app.post("/index/rebuild", response_model=IndexRebuildResponse)
async def rebuild_index():
    """Rebuild the search index"""

    result = indexer.rebuild_index()

    return IndexRebuildResponse(
        indexed=result['indexed'],
        duration=result['duration'],
        status=result['status']
    )


# Plugins endpoint
@app.get("/plugins")
async def get_plugins():
    """Get list of available plugins"""

    # TODO: Implement plugin loading from /launcher/plugins/
    # For now, return mock data

    plugins = [
        PluginInfo(
            name="open_app",
            description="Open applications",
            version="1.0.0",
            keywords=["open", "launch", "app"],
            enabled=True
        ),
        PluginInfo(
            name="search_web",
            description="Search the web",
            version="1.0.0",
            keywords=["search", "google", "web"],
            enabled=True
        ),
        PluginInfo(
            name="system_actions",
            description="System commands",
            version="1.0.0",
            keywords=["shutdown", "restart", "sleep"],
            enabled=True
        )
    ]

    return plugins


# Index stats endpoint
@app.get("/index/stats")
async def get_index_stats():
    """Get index statistics"""
    return indexer.get_stats()


# Main entry point
if __name__ == "__main__":
    import uvicorn

    print("Starting QuickLauncher MCP Backend Server...")
    print(f"Database: {DB_PATH}")
    print(f"Config: {CONFIG_PATH}")

    uvicorn.run(
        app,
        host="127.0.0.1",
        port=8765,
        log_level="info"
    )
