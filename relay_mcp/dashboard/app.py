"""
Flask Dashboard for RelayMCP
Real-time monitoring of message traffic and AI connections
"""

from flask import Flask, render_template, jsonify
import requests
from datetime import datetime

app = Flask(__name__)

# Configuration
API_BASE_URL = "http://127.0.0.1:8000"


@app.route("/")
def index():
    """Main dashboard page"""
    return render_template("dashboard.html")


@app.route("/api/stats")
def get_stats():
    """
    Proxy endpoint to fetch stats from RelayMCP API
    Returns combined statistics for dashboard
    """
    try:
        # Fetch from RelayMCP API
        response = requests.get(f"{API_BASE_URL}/mcp/stats", timeout=5)
        response.raise_for_status()
        stats = response.json()

        # Fetch connections
        connections_response = requests.get(f"{API_BASE_URL}/mcp/connections", timeout=5)
        connections = connections_response.json() if connections_response.ok else {"connections": []}

        # Combine data
        return jsonify({
            "timestamp": datetime.now().isoformat(),
            "stats": stats,
            "connections": connections
        })

    except requests.exceptions.RequestException as e:
        return jsonify({
            "error": f"Failed to fetch stats: {str(e)}",
            "timestamp": datetime.now().isoformat()
        }), 503


@app.route("/api/recent_logs")
def get_recent_logs():
    """
    Proxy endpoint to fetch recent logs from RelayMCP API
    """
    try:
        limit = 50
        response = requests.get(
            f"{API_BASE_URL}/mcp/logs/recent?limit={limit}",
            timeout=5
        )
        response.raise_for_status()
        return jsonify(response.json())

    except requests.exceptions.RequestException as e:
        return jsonify({
            "error": f"Failed to fetch logs: {str(e)}",
            "logs": []
        }), 503


@app.route("/api/buffer")
def get_buffer():
    """
    Proxy endpoint to fetch buffer contents from RelayMCP API
    """
    try:
        limit = 100
        response = requests.get(
            f"{API_BASE_URL}/mcp/buffer?limit={limit}",
            timeout=5
        )
        response.raise_for_status()
        return jsonify(response.json())

    except requests.exceptions.RequestException as e:
        return jsonify({
            "error": f"Failed to fetch buffer: {str(e)}",
            "messages": []
        }), 503


@app.route("/api/health")
def health_check():
    """
    Check health of both dashboard and RelayMCP API
    """
    try:
        response = requests.get(f"{API_BASE_URL}/health", timeout=5)
        api_healthy = response.ok

        return jsonify({
            "dashboard": "healthy",
            "api": "healthy" if api_healthy else "unhealthy",
            "timestamp": datetime.now().isoformat()
        })

    except requests.exceptions.RequestException:
        return jsonify({
            "dashboard": "healthy",
            "api": "unreachable",
            "timestamp": datetime.now().isoformat()
        }), 503


if __name__ == "__main__":
    print("=" * 60)
    print("RelayMCP Dashboard starting...")
    print(f"Dashboard URL: http://127.0.0.1:5000")
    print(f"API URL: {API_BASE_URL}")
    print("=" * 60)

    app.run(
        host="127.0.0.1",
        port=5000,
        debug=True
    )
