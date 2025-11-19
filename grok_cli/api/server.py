"""
FastAPI Server for Grok CLI
Provides REST API for external control and MCP integration
"""

import asyncio
from pathlib import Path
from typing import Optional, List, Dict, Any

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from core.analyzer import ProjectAnalyzer
from core.executor import CommandExecutor
from core.generator import CodeGenerator
from core.memory import MemorySystem
from core.diagnostics import DiagnosticEngine
from rag.vectorstore import VectorStore
from rag.retriever import ContextRetriever
from config import load_config

# Load configuration
config = load_config()

# Create FastAPI app
app = FastAPI(
    title="Grok CLI API",
    description="REST API for Grok CLI - Advanced AI Development Copilot",
    version="2.0.0",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=config["api"]["cors_origins"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize components (lazy loading)
_analyzer = None
_executor = None
_generator = None
_memory = None
_diagnostics = None
_vectorstore = None
_retriever = None


def get_analyzer() -> ProjectAnalyzer:
    global _analyzer
    if _analyzer is None:
        _analyzer = ProjectAnalyzer(Path.cwd(), config)
    return _analyzer


def get_executor() -> CommandExecutor:
    global _executor
    if _executor is None:
        _executor = CommandExecutor(config)
    return _executor


def get_generator() -> CodeGenerator:
    global _generator
    if _generator is None:
        _generator = CodeGenerator(config)
    return _generator


def get_memory() -> MemorySystem:
    global _memory
    if _memory is None:
        _memory = MemorySystem(config)
    return _memory


def get_diagnostics() -> DiagnosticEngine:
    global _diagnostics
    if _diagnostics is None:
        _diagnostics = DiagnosticEngine(config)
    return _diagnostics


def get_vectorstore() -> VectorStore:
    global _vectorstore
    if _vectorstore is None and config["rag"]["enabled"]:
        _vectorstore = VectorStore(config)
    return _vectorstore


def get_retriever() -> Optional[ContextRetriever]:
    global _retriever
    vectorstore = get_vectorstore()
    if _retriever is None and vectorstore:
        _retriever = ContextRetriever(vectorstore, config)
    return _retriever


# Request/Response Models

class AnalyzeRequest(BaseModel):
    project_path: Optional[str] = Field(None, description="Project path")


class ExecuteRequest(BaseModel):
    command: str = Field(..., description="Command to execute")
    use_sandbox: bool = Field(True, description="Use Docker sandbox")
    working_dir: Optional[str] = Field(None, description="Working directory")


class ExecuteResponse(BaseModel):
    command: str
    stdout: str
    stderr: str
    returncode: int
    duration: float
    success: bool


class GenerateRequest(BaseModel):
    description: str = Field(..., description="Code description")
    language: str = Field("python", description="Programming language")
    context: Optional[str] = Field(None, description="Additional context")


class GenerateResponse(BaseModel):
    language: str
    code: str
    explanation: str
    success: bool


class FixCodeRequest(BaseModel):
    code: str = Field(..., description="Code with errors")
    error: str = Field(..., description="Error message")
    language: str = Field("python", description="Programming language")


class SearchRequest(BaseModel):
    query: str = Field(..., description="Search query")
    top_k: int = Field(5, description="Number of results")


class MemorySearchRequest(BaseModel):
    query: str = Field(..., description="Search query")
    category: Optional[str] = Field(None, description="Category filter")


# API Routes

@app.get("/")
async def root():
    """API root - health check"""
    return {
        "name": "Grok CLI API",
        "version": "2.0.0",
        "status": "running",
        "endpoints": {
            "analyze": "/analyze",
            "execute": "/execute",
            "generate": "/generate",
            "fix": "/fix",
            "test": "/test",
            "search": "/search",
            "memory": "/memory/*",
            "diagnostics": "/diagnostics",
        },
    }


@app.get("/health")
async def health():
    """Health check endpoint"""
    vectorstore = get_vectorstore()
    return {
        "status": "healthy",
        "components": {
            "analyzer": True,
            "executor": True,
            "generator": True,
            "memory": True,
            "diagnostics": True,
            "vectorstore": vectorstore is not None,
        },
    }


@app.post("/analyze")
async def analyze_project(request: AnalyzeRequest):
    """Analyze project structure and dependencies"""
    try:
        analyzer = get_analyzer()
        project_path = Path(request.project_path or Path.cwd())

        if not project_path.exists():
            raise HTTPException(status_code=404, detail="Project path not found")

        analysis = await analyzer.analyze_full_project()
        return analysis

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/execute", response_model=ExecuteResponse)
async def execute_command(request: ExecuteRequest):
    """Execute a shell command"""
    try:
        executor = get_executor()
        working_dir = Path(request.working_dir) if request.working_dir else None

        result = await executor.execute_shell(
            command=request.command,
            cwd=working_dir,
            use_sandbox=request.use_sandbox,
        )

        return ExecuteResponse(
            command=result.command,
            stdout=result.stdout,
            stderr=result.stderr,
            returncode=result.returncode,
            duration=result.duration,
            success=result.success,
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/generate", response_model=GenerateResponse)
async def generate_code(request: GenerateRequest):
    """Generate code using AI"""
    try:
        generator = get_generator()

        result = await generator.generate_code(
            description=request.description,
            language=request.language,
            context=request.context,
        )

        return GenerateResponse(
            language=result.language,
            code=result.code,
            explanation=result.explanation,
            success=result.success,
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/fix", response_model=GenerateResponse)
async def fix_code(request: FixCodeRequest):
    """Fix code based on error message"""
    try:
        generator = get_generator()

        result = await generator.fix_code(
            code=request.code, error=request.error, language=request.language
        )

        return GenerateResponse(
            language=result.language,
            code=result.code,
            explanation=result.explanation,
            success=result.success,
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/test")
async def run_tests(request: AnalyzeRequest):
    """Run all tests and return results"""
    try:
        diagnostics = get_diagnostics()
        project_path = Path(request.project_path or Path.cwd())

        results = await diagnostics.run_all_tests(project_path)

        return [
            {
                "test_suite": r.test_suite,
                "total": r.total,
                "passed": r.passed,
                "failed": r.failed,
                "skipped": r.skipped,
                "duration": r.duration,
                "failures": r.failures,
            }
            for r in results
        ]

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/search")
async def search_project(request: SearchRequest):
    """Search project using RAG"""
    try:
        retriever = get_retriever()

        if not retriever:
            raise HTTPException(
                status_code=503, detail="RAG not enabled or available"
            )

        context = await retriever.retrieve(
            query=request.query, top_k=request.top_k
        )

        return {
            "query": context.query,
            "total_found": context.total_found,
            "results": context.results,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/memory/search")
async def search_memory(request: MemorySearchRequest):
    """Search memory"""
    try:
        memory = get_memory()

        results = memory.search_memory(
            query=request.query, category=request.category
        )

        return [
            {
                "key": r.key,
                "value": r.value,
                "timestamp": r.timestamp.isoformat(),
                "category": r.category,
            }
            for r in results
        ]

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/memory/stats")
async def memory_statistics():
    """Get memory statistics"""
    try:
        memory = get_memory()
        return memory.get_statistics()

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/diagnostics")
async def get_diagnostics_info(request: AnalyzeRequest):
    """Get project diagnostics"""
    try:
        diagnostics = get_diagnostics()
        vectorstore = get_vectorstore()
        memory = get_memory()

        stats = {
            "memory": memory.get_statistics() if memory else {},
            "vectorstore": vectorstore.get_statistics() if vectorstore else {},
            "execution_history": len(get_executor().execution_history),
        }

        return stats

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Startup event
@app.on_event("startup")
async def startup_event():
    """Initialize components on startup"""
    print("🟣 Grok CLI API Server starting...")
    print(f"Version: 2.0.0")
    print(f"Host: {config['api']['host']}:{config['api']['port']}")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "server:app",
        host=config["api"]["host"],
        port=config["api"]["port"],
        reload=True,
    )
