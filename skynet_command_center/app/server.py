"""
Skynet Command Center - Flask Server
=====================================
Main Flask application server.

Author: Skynet Architect
Version: 1.0
"""

from flask import Flask, jsonify
from pathlib import Path

from .config import (
    HOST,
    PORT,
    DEBUG,
    COMMAND_CENTER_ROOT,
    ensure_directories
)
from .database import get_database
from .routes import (
    dashboard_bp,
    agents_bp,
    memory_bp,
    logs_bp,
    terminal_bp
)


def create_app():
    """
    Create and configure Flask application.

    Returns:
        Configured Flask app instance
    """
    # Ensure all directories exist
    ensure_directories()

    # Initialize database
    db = get_database()
    print("[SERVER] Database initialized")

    # Create Flask app
    app = Flask(
        __name__,
        template_folder=str(COMMAND_CENTER_ROOT / 'templates'),
        static_folder=str(COMMAND_CENTER_ROOT / 'static')
    )

    # Configuration
    app.config['SECRET_KEY'] = 'skynet-command-center-secret-key-v1'
    app.config['JSON_SORT_KEYS'] = False

    # Register blueprints
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(agents_bp)
    app.register_blueprint(memory_bp)
    app.register_blueprint(logs_bp)
    app.register_blueprint(terminal_bp)

    print("[SERVER] All routes registered")

    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({
            'success': False,
            'error': 'Not found'
        }), 404

    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500

    # Health check endpoint
    @app.route('/health')
    def health_check():
        """Health check endpoint."""
        return jsonify({
            'status': 'healthy',
            'service': 'Skynet Command Center',
            'version': '1.0'
        })

    # API info endpoint
    @app.route('/api/info')
    def api_info():
        """API information endpoint."""
        return jsonify({
            'service': 'Skynet Command Center',
            'version': '1.0',
            'endpoints': {
                'dashboard': '/dashboard',
                'agents': '/agents',
                'memory': '/memory',
                'logs': '/logs',
                'terminal': '/terminal',
                'api': {
                    'agents': '/api/agents',
                    'memory': '/api/memory/tree',
                    'logs': '/api/logs/latest',
                    'terminal': '/api/terminal/execute'
                }
            }
        })

    return app


# Create app instance
app = create_app()


def run_server(host=HOST, port=PORT, debug=DEBUG):
    """
    Run the Flask server.

    Args:
        host: Host to bind to
        port: Port to bind to
        debug: Debug mode
    """
    print("=" * 60)
    print("   SKYNET COMMAND CENTER v1.0")
    print("=" * 60)
    print(f"   Starting server on http://{host}:{port}")
    print(f"   Debug mode: {debug}")
    print("=" * 60)
    print()

    app.run(host=host, port=port, debug=debug)


if __name__ == '__main__':
    run_server()
