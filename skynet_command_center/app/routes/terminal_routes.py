"""
Skynet Command Center - Terminal Routes
========================================
Routes for internal terminal.
"""

from flask import Blueprint, render_template, jsonify, request

from ..services import get_terminal_engine
from ..database import get_database

terminal_bp = Blueprint('terminal', __name__)


@terminal_bp.route('/terminal')
def terminal_page():
    """Render terminal page."""
    return render_template('terminal.html')


@terminal_bp.route('/api/terminal/execute', methods=['POST'])
def execute_command():
    """
    Execute a terminal command.

    POST data:
        command: Command string to execute

    Returns:
        JSON with command output
    """
    try:
        data = request.get_json()

        if not data or 'command' not in data:
            return jsonify({
                'success': False,
                'output': 'No command provided'
            }), 400

        command = data['command']

        terminal = get_terminal_engine()
        result = terminal.execute(command)

        return jsonify(result)

    except Exception as e:
        return jsonify({
            'success': False,
            'output': f'Error executing command: {str(e)}'
        }), 500


@terminal_bp.route('/api/terminal/history')
def get_history():
    """
    Get terminal command history.

    Query params:
        limit: Number of history entries (default 50)

    Returns:
        JSON with command history
    """
    try:
        limit = request.args.get('limit', 50, type=int)

        db = get_database()
        history = db.get_terminal_history(limit)

        return jsonify({
            'success': True,
            'history': history,
            'total': len(history)
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@terminal_bp.route('/api/terminal/clear', methods=['POST'])
def clear_history():
    """
    Clear terminal history.

    Returns:
        JSON with clear result
    """
    try:
        db = get_database()
        db.clear_terminal_history()

        return jsonify({
            'success': True,
            'message': 'Terminal history cleared'
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500
