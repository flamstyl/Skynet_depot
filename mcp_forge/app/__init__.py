"""
MCP Forge Flask Application
"""
from flask import Flask
from flask_cors import CORS
from .config import Config

def create_app():
    """Create and configure Flask application"""
    app = Flask(__name__)
    app.config.from_object(Config)

    # Enable CORS
    CORS(app)

    # Initialize directories
    Config.init_directories()

    # Register blueprints
    from .routes import agent_bp, builder_bp, export_bp, validation_bp
    from .routes.web_routes import web_bp

    app.register_blueprint(agent_bp)
    app.register_blueprint(builder_bp)
    app.register_blueprint(export_bp)
    app.register_blueprint(validation_bp)
    app.register_blueprint(web_bp)

    # Health check endpoint
    @app.route('/health')
    def health():
        return {'status': 'healthy', 'service': 'mcp-forge'}

    # Index route
    @app.route('/')
    def index():
        return {
            'name': 'MCP Forge',
            'version': '1.0.0',
            'description': 'AI Agent Builder for Skynet',
            'endpoints': {
                'agents': '/api/agents',
                'builder': '/api/builder',
                'export': '/api/export',
                'validation': '/api/validation'
            }
        }

    return app
