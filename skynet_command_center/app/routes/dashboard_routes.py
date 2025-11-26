"""
Skynet Command Center - Dashboard Routes
=========================================
Routes for the main dashboard view.
"""

from flask import Blueprint, render_template, jsonify

from ..services import (
    get_agent_manager,
    get_memory_manager,
    get_logs_manager
)

dashboard_bp = Blueprint('dashboard', __name__)


@dashboard_bp.route('/')
@dashboard_bp.route('/dashboard')
def dashboard():
    """Render main dashboard page."""
    return render_template('dashboard.html')


@dashboard_bp.route('/api/dashboard/summary')
def dashboard_summary():
    """
    Get dashboard summary data.

    Returns:
        JSON with agents, memory, and logs summary
    """
    try:
        agent_manager = get_agent_manager()
        memory_manager = get_memory_manager()
        logs_manager = get_logs_manager()

        # Get agents status
        agents = agent_manager.get_all_agents_status()
        agents_summary = {
            'total': len(agents),
            'online': sum(1 for a in agents if a['status'] == 'online'),
            'offline': sum(1 for a in agents if a['status'] == 'offline'),
            'error': sum(1 for a in agents if a['status'] == 'error'),
            'agents': agents[:10]  # Limit to 10 for dashboard
        }

        # Get memory stats
        memory_stats = memory_manager.get_memory_stats()
        memory_summary = {
            'total_files': memory_stats['total_files'],
            'total_size': memory_stats['total_size_formatted'],
            'last_updated': memory_stats['last_updated']
        }

        # Get latest logs
        logs = logs_manager.get_latest_logs(20)
        logs_summary = {
            'latest': logs[:10],  # Limit to 10 for dashboard
            'total': len(logs)
        }

        return jsonify({
            'success': True,
            'agents': agents_summary,
            'memory': memory_summary,
            'logs': logs_summary
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
