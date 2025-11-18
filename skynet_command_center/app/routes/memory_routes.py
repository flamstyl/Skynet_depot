"""
Skynet Command Center - Memory Routes
======================================
Routes for memory management.
"""

from flask import Blueprint, render_template, jsonify, request

from ..services import get_memory_manager

memory_bp = Blueprint('memory', __name__)


@memory_bp.route('/memory')
def memory_page():
    """Render memory management page."""
    return render_template('memory.html')


@memory_bp.route('/api/memory/tree')
def get_memory_tree():
    """
    Get memory tree structure.

    Returns:
        JSON with memory tree and stats
    """
    try:
        memory_manager = get_memory_manager()
        tree_data = memory_manager.get_memory_tree()

        return jsonify({
            'success': True,
            'tree': tree_data['tree'],
            'stats': tree_data['stats']
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@memory_bp.route('/api/memory/stats')
def get_memory_stats():
    """
    Get memory statistics.

    Returns:
        JSON with memory stats
    """
    try:
        memory_manager = get_memory_manager()
        stats = memory_manager.get_memory_stats()

        return jsonify({
            'success': True,
            'stats': stats
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@memory_bp.route('/api/memory/sync', methods=['POST'])
def sync_memory():
    """
    Synchronize memory index.

    Returns:
        JSON with sync result
    """
    try:
        memory_manager = get_memory_manager()
        result = memory_manager.sync_memory()

        return jsonify(result)

    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500


@memory_bp.route('/api/memory/search')
def search_memory():
    """
    Search memory files.

    Query params:
        q: Search query

    Returns:
        JSON with search results
    """
    try:
        query = request.args.get('q', '')

        if not query:
            return jsonify({
                'success': False,
                'error': 'No search query provided'
            }), 400

        memory_manager = get_memory_manager()
        results = memory_manager.search_memory(query)

        return jsonify({
            'success': True,
            'results': results,
            'total': len(results)
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
