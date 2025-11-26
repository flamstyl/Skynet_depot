"""
Skynet Token Switcher — Server
Flask application initialization and configuration
"""

from flask import Flask
from flask_cors import CORS
from .database import Database
from .switcher_engine import SwitcherEngine
from .api_routes import create_routes


def create_app():
    """
    Create and configure Flask application

    Returns:
        Flask app instance
    """
    app = Flask(__name__,
                template_folder='../templates',
                static_folder='../static')

    # Configuration
    app.config['SECRET_KEY'] = 'skynet-token-switcher-v1-secure-key'
    app.config['JSON_SORT_KEYS'] = False

    # Enable CORS for local development
    CORS(app, resources={
        r"/api/*": {
            "origins": ["http://localhost:*", "http://127.0.0.1:*"],
            "methods": ["GET", "POST", "PUT", "DELETE"],
            "allow_headers": ["Content-Type"]
        }
    })

    # Initialize database
    db = Database()

    # Initialize switcher engine
    switcher = SwitcherEngine(db)

    # Register routes
    routes = create_routes(db, switcher)
    app.register_blueprint(routes)

    # Store instances for access from routes
    app.db = db
    app.switcher = switcher

    print("🟣 Skynet Token Switcher initialized")
    print("📊 Database ready")
    print("🔄 Switcher engine ready")

    return app


# Create app instance
app = create_app()


if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5050, debug=True)
