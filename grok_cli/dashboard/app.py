"""
Grok CLI Dashboard - Real-time monitoring and control
Built with Streamlit
"""

import streamlit as st
import asyncio
import time
from pathlib import Path
from datetime import datetime
import sys

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from core.analyzer import ProjectAnalyzer
from core.executor import CommandExecutor
from core.memory import MemorySystem
from core.diagnostics import DiagnosticEngine
from rag.vectorstore import VectorStore
from docker.security import SandboxManager
from config import load_config

# Page configuration
st.set_page_config(
    page_title="Grok CLI Dashboard",
    page_icon="🟣",
    layout="wide",
    initial_sidebar_state="expanded",
)

# Custom CSS
st.markdown(
    """
<style>
    .main {
        background-color: #0e1117;
    }
    .stMetric {
        background-color: #1a1d24;
        padding: 10px;
        border-radius: 5px;
    }
    h1, h2, h3 {
        color: #a78bfa;
    }
</style>
""",
    unsafe_allow_html=True,
)


# Initialize session state
if "config" not in st.session_state:
    st.session_state.config = load_config()
    st.session_state.project_path = Path.cwd()
    st.session_state.analyzer = None
    st.session_state.executor = None
    st.session_state.memory = None
    st.session_state.diagnostics = None
    st.session_state.vectorstore = None
    st.session_state.sandbox = None
    st.session_state.last_analysis = None


def init_components():
    """Initialize Grok CLI components"""
    config = st.session_state.config
    project_path = st.session_state.project_path

    if st.session_state.analyzer is None:
        st.session_state.analyzer = ProjectAnalyzer(project_path, config)
        st.session_state.executor = CommandExecutor(config)
        st.session_state.memory = MemorySystem(config)
        st.session_state.diagnostics = DiagnosticEngine(config)

        if config["rag"]["enabled"]:
            st.session_state.vectorstore = VectorStore(config)

        if config["docker"]["enabled"]:
            st.session_state.sandbox = SandboxManager(config)


def main():
    """Main dashboard"""

    # Header
    st.title("🟣 Grok CLI Dashboard")
    st.markdown("**Advanced AI Development Copilot - Real-time Monitoring**")

    # Sidebar
    with st.sidebar:
        st.header("⚙️ Configuration")

        # Project path selector
        project_path = st.text_input(
            "Project Path",
            value=str(st.session_state.project_path),
        )

        if project_path != str(st.session_state.project_path):
            st.session_state.project_path = Path(project_path)
            st.session_state.analyzer = None  # Reset analyzer

        # Initialize button
        if st.button("🔄 Initialize Components"):
            with st.spinner("Initializing..."):
                init_components()
                st.success("✓ Components initialized")

        st.markdown("---")

        # Navigation
        st.header("📍 Navigation")
        page = st.radio(
            "Select Page",
            [
                "Overview",
                "Project Analysis",
                "Memory System",
                "Command Executor",
                "Code Generator",
                "Test Results",
                "Docker Sandbox",
            ],
        )

    # Main content
    if page == "Overview":
        show_overview()
    elif page == "Project Analysis":
        show_project_analysis()
    elif page == "Memory System":
        show_memory_system()
    elif page == "Command Executor":
        show_command_executor()
    elif page == "Code Generator":
        show_code_generator()
    elif page == "Test Results":
        show_test_results()
    elif page == "Docker Sandbox":
        show_docker_sandbox()


def show_overview():
    """Overview dashboard"""
    st.header("📊 System Overview")

    # Initialize if not done
    if st.session_state.analyzer is None:
        st.warning("⚠️ Components not initialized. Click 'Initialize Components' in sidebar.")
        return

    # Metrics
    col1, col2, col3, col4 = st.columns(4)

    with col1:
        memory_stats = st.session_state.memory.get_statistics()
        st.metric(
            "Memory Entries",
            memory_stats["short_term_count"] + memory_stats["long_term_count"],
        )

    with col2:
        executor = st.session_state.executor
        st.metric("Commands Executed", len(executor.execution_history))

    with col3:
        vectorstore = st.session_state.vectorstore
        if vectorstore:
            vs_stats = vectorstore.get_statistics()
            st.metric(
                "Indexed Documents",
                vs_stats.get("document_count", 0) if vs_stats.get("enabled") else "N/A",
            )
        else:
            st.metric("Indexed Documents", "N/A")

    with col4:
        sandbox = st.session_state.sandbox
        if sandbox:
            sb_stats = sandbox.get_stats()
            st.metric("Sandbox Status", "✓ Ready" if sb_stats["available"] else "✗ Unavailable")
        else:
            st.metric("Sandbox Status", "N/A")

    # Recent activity
    st.subheader("🕐 Recent Activity")

    recent_memory = st.session_state.memory.get_recent(10)

    if recent_memory:
        for entry in reversed(recent_memory):
            timestamp = entry.timestamp.strftime("%H:%M:%S")
            with st.expander(f"[{timestamp}] {entry.key}"):
                st.write(f"**Category:** {entry.category}")
                st.write(f"**Value:** {str(entry.value)[:200]}")
    else:
        st.info("No recent activity")


def show_project_analysis():
    """Project analysis page"""
    st.header("📂 Project Analysis")

    if st.session_state.analyzer is None:
        st.warning("⚠️ Initialize components first")
        return

    if st.button("🔍 Analyze Project"):
        with st.spinner("Analyzing project..."):
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            analysis = loop.run_until_complete(
                st.session_state.analyzer.analyze_full_project()
            )
            st.session_state.last_analysis = analysis

    if st.session_state.last_analysis:
        analysis = st.session_state.last_analysis

        # Basic info
        col1, col2 = st.columns(2)

        with col1:
            st.subheader("📋 Basic Information")
            st.write(f"**Name:** {analysis['name']}")
            st.write(f"**Path:** {analysis['path']}")
            st.write(f"**Files:** {analysis['file_count']}")
            st.write(f"**Types:** {', '.join(analysis['types'])}")

        with col2:
            st.subheader("💻 Languages")
            for lang, count in analysis['languages'].items():
                st.write(f"**{lang}:** {count} files")

        # Entry points
        st.subheader("🚀 Entry Points")
        for entry in analysis['entry_points']:
            st.code(entry, language="bash")

        # Dependencies
        st.subheader("📦 Dependencies")
        deps = analysis.get('dependencies', {})

        for lang, dep_list in deps.items():
            with st.expander(f"{lang.title()} Dependencies"):
                if isinstance(dep_list, list):
                    for dep in dep_list:
                        st.write(f"- {dep}")
                elif isinstance(dep_list, dict):
                    for dep_type, deps in dep_list.items():
                        st.write(f"**{dep_type}:**")
                        for dep in deps:
                            st.write(f"  - {dep}")


def show_memory_system():
    """Memory system page"""
    st.header("🧠 Memory System")

    if st.session_state.memory is None:
        st.warning("⚠️ Initialize components first")
        return

    memory = st.session_state.memory

    # Statistics
    stats = memory.get_statistics()

    col1, col2 = st.columns(2)

    with col1:
        st.metric("Short-term Entries", stats["short_term_count"])

    with col2:
        st.metric("Long-term Entries", stats["long_term_count"])

    # Search
    st.subheader("🔍 Search Memory")

    search_query = st.text_input("Search query")

    if search_query:
        results = memory.search_memory(search_query)

        st.write(f"Found {len(results)} results")

        for result in results[:20]:
            with st.expander(f"{result.key} ({result.category})"):
                st.write(f"**Timestamp:** {result.timestamp}")
                st.write(f"**Value:**")
                st.json(result.value if isinstance(result.value, dict) else str(result.value))


def show_command_executor():
    """Command executor page"""
    st.header("⚙️ Command Executor")

    if st.session_state.executor is None:
        st.warning("⚠️ Initialize components first")
        return

    executor = st.session_state.executor

    # Command input
    command = st.text_input("Enter command to execute", value="echo 'Hello from Grok CLI'")

    use_sandbox = st.checkbox("Use Docker sandbox", value=True)

    if st.button("▶️ Execute"):
        with st.spinner("Executing..."):
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            result = loop.run_until_complete(
                executor.execute_shell(command, use_sandbox=use_sandbox)
            )

            # Display result
            if result.success:
                st.success(f"✓ Completed in {result.duration:.2f}s")
            else:
                st.error(f"✗ Failed (exit code {result.returncode})")

            if result.stdout:
                st.subheader("Output")
                st.code(result.stdout, language="bash")

            if result.stderr:
                st.subheader("Errors")
                st.code(result.stderr, language="bash")

    # Execution history
    st.subheader("📜 Execution History")

    history = executor.get_history(10)

    for result in reversed(history):
        status = "✓" if result.success else "✗"
        with st.expander(f"{status} {result.command} ({result.duration:.2f}s)"):
            st.write(f"**Timestamp:** {result.timestamp}")
            st.write(f"**Return code:** {result.returncode}")
            if result.stdout:
                st.code(result.stdout, language="bash")


def show_code_generator():
    """Code generator page"""
    st.header("🤖 Code Generator")

    st.info("Code generation requires API key configuration")

    description = st.text_area("Describe the code you want to generate")

    language = st.selectbox("Language", ["python", "javascript", "typescript", "go", "rust"])

    if st.button("✨ Generate"):
        st.warning("Connect to API server first (port 8100)")


def show_test_results():
    """Test results page"""
    st.header("🧪 Test Results")

    if st.session_state.diagnostics is None:
        st.warning("⚠️ Initialize components first")
        return

    if st.button("▶️ Run Tests"):
        with st.spinner("Running tests..."):
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            results = loop.run_until_complete(
                st.session_state.diagnostics.run_all_tests()
            )

            # Display results
            for result in results:
                with st.expander(f"{result.test_suite} - {result.passed}/{result.total} passed"):
                    col1, col2, col3 = st.columns(3)

                    with col1:
                        st.metric("Passed", result.passed)

                    with col2:
                        st.metric("Failed", result.failed)

                    with col3:
                        st.metric("Skipped", result.skipped)

                    st.write(f"**Duration:** {result.duration:.2f}s")

                    if result.failures:
                        st.subheader("Failures")
                        for failure in result.failures:
                            st.error(f"**{failure['test']}**: {failure['error']}")


def show_docker_sandbox():
    """Docker sandbox page"""
    st.header("🐳 Docker Sandbox")

    if st.session_state.sandbox is None:
        st.warning("⚠️ Docker sandbox not enabled")
        return

    sandbox = st.session_state.sandbox
    stats = sandbox.get_stats()

    if not stats["available"]:
        st.error("Docker sandbox not available")
        st.write(f"Error: {stats.get('error', 'Unknown')}")
        return

    # Stats
    col1, col2, col3 = st.columns(3)

    with col1:
        st.metric("Image", stats["image"])

    with col2:
        st.metric("Image Size", f"{stats['image_size_mb']} MB")

    with col3:
        st.metric("Containers", stats["container_count"])

    # Build image
    if st.button("🔨 Build Sandbox Image"):
        with st.spinner("Building image..."):
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            success = loop.run_until_complete(sandbox.build_sandbox_image(force_rebuild=True))

            if success:
                st.success("✓ Image built successfully")
            else:
                st.error("✗ Failed to build image")

    # Cleanup
    if st.button("🧹 Cleanup Containers"):
        sandbox.cleanup()
        st.success("✓ Cleanup complete")


if __name__ == "__main__":
    main()
