"""
Models package pour MCP_Browser_LMStudio
"""
from .browser_models import (
    OpenURLRequest, OpenURLResponse, GetHTMLResponse,
    ClickRequest, ClickResponse, ScreenshotRequest, ScreenshotResponse,
    BrowserStatusResponse, InteractionLog, MemoryHistoryResponse
)
from .lm_models import (
    ChatMessage, LMQueryRequest, LMChatCompletionRequest,
    LMQueryResponse, LMStatusResponse, LMModelsListResponse,
    LMChatCompletionResponse, LMUsageStats, LMChoice, LMModelInfo
)

__all__ = [
    # Browser models
    "OpenURLRequest", "OpenURLResponse", "GetHTMLResponse",
    "ClickRequest", "ClickResponse", "ScreenshotRequest", "ScreenshotResponse",
    "BrowserStatusResponse", "InteractionLog", "MemoryHistoryResponse",
    # LM Studio models
    "ChatMessage", "LMQueryRequest", "LMChatCompletionRequest",
    "LMQueryResponse", "LMStatusResponse", "LMModelsListResponse",
    "LMChatCompletionResponse", "LMUsageStats", "LMChoice", "LMModelInfo"
]
