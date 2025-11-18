"""
Skynet Command Center - Logs Routes
====================================
Routes for logs management.
"""

from flask import Blueprint, render_template, jsonify, request

from ..services import get_logs_manager

logs_bp = Blueprint('logs', __name__)


@logs_bp.route('/logs')
def logs_page():
    """Render logs page."""
    return render_template('logs.html')


@logs_bp.route('/api/logs/latest')
def get_latest_logs():
    """
    Get latest log entries.

    Query params:
        limit: Number of logs to return (default 100)

    Returns:
        JSON with latest logs
    """
    try:
        limit = request.args.get('limit', 100, type=int)

        logs_manager = get_logs_manager()
        logs = logs_manager.get_latest_logs(limit)

        return jsonify({
            'success': True,
            'logs': logs,
            'total': len(logs)
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@logs_bp.route('/api/logs/source/<source>')
def get_logs_by_source(source):
    """
    Get logs by source.

    Args:
        source: Source to filter by

    Query params:
        limit: Number of logs to return (default 100)

    Returns:
        JSON with filtered logs
    """
    try:
        limit = request.args.get('limit', 100, type=int)

        logs_manager = get_logs_manager()
        logs = logs_manager.get_logs_by_source(source, limit)

        return jsonify({
            'success': True,
            'logs': logs,
            'total': len(logs),
            'source': source
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@logs_bp.route('/api/logs/level/<level>')
def get_logs_by_level(level):
    """
    Get logs by level.

    Args:
        level: Log level to filter by

    Query params:
        limit: Number of logs to return (default 100)

    Returns:
        JSON with filtered logs
    """
    try:
        limit = request.args.get('limit', 100, type=int)

        logs_manager = get_logs_manager()
        logs = logs_manager.get_logs_by_level(level, limit)

        return jsonify({
            'success': True,
            'logs': logs,
            'total': len(logs),
            'level': level
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@logs_bp.route('/api/logs/search')
def search_logs():
    """
    Search logs by keyword.

    Query params:
        q: Search query
        limit: Number of results (default 100)

    Returns:
        JSON with search results
    """
    try:
        query = request.args.get('q', '')
        limit = request.args.get('limit', 100, type=int)

        if not query:
            return jsonify({
                'success': False,
                'error': 'No search query provided'
            }), 400

        logs_manager = get_logs_manager()
        logs = logs_manager.search_logs(query, limit)

        return jsonify({
            'success': True,
            'logs': logs,
            'total': len(logs),
            'query': query
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@logs_bp.route('/api/logs/stats')
def get_log_stats():
    """
    Get log statistics.

    Returns:
        JSON with log stats
    """
    try:
        logs_manager = get_logs_manager()
        stats = logs_manager.get_log_stats()

        return jsonify({
            'success': True,
            'stats': stats
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@logs_bp.route('/api/logs/clear', methods=['POST'])
def clear_logs():
    """
    Clear all logs.

    Returns:
        JSON with clear result
    """
    try:
        logs_manager = get_logs_manager()
        logs_manager.clear_logs()

        return jsonify({
            'success': True,
            'message': 'Logs cleared successfully'
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500
