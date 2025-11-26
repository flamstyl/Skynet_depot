"""
Data models for QuickLauncher MCP
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


# Request Models
class SearchRequest(BaseModel):
    query: str = Field(..., min_length=0)


class AIPromptRequest(BaseModel):
    prompt: str = Field(..., min_length=1)
    mode: str = Field(default="contextual")  # quick, contextual


class ActionRequest(BaseModel):
    type: str = Field(..., description="open, run, script, plugin, system")
    target: str = Field(..., description="Path, command, or action name")
    input: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


# Response Models
class IndexedItem(BaseModel):
    id: Optional[int] = None
    name: str
    path: Optional[str] = None
    type: str  # app, file, folder, command, plugin
    icon: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[List[str]] = None
    score: Optional[float] = None
    frequency: int = 0
    last_used: Optional[datetime] = None


class SearchResponse(BaseModel):
    results: List[IndexedItem]
    query: str
    count: int
    duration: float  # seconds


class AIAction(BaseModel):
    title: str
    description: Optional[str] = None
    type: str
    target: str


class AIResponse(BaseModel):
    response: str
    actions: Optional[List[AIAction]] = None
    mode: str


class ActionResponse(BaseModel):
    status: str  # success, error
    message: Optional[str] = None
    data: Optional[Dict[str, Any]] = None


class IndexRebuildResponse(BaseModel):
    indexed: int
    duration: str
    status: str


class PluginInfo(BaseModel):
    name: str
    description: str
    version: str
    keywords: Optional[List[str]] = None
    enabled: bool = True


class HealthResponse(BaseModel):
    status: str
    version: str
    uptime: float
    indexed_items: int
    plugins: int
