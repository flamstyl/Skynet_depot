"""
Skynet Command Center - Agents Routes
======================================
Routes for agent management.
"""

from flask import Blueprint, render_template, jsonify, request

from ..services import get_agent_manager

agents_bp = Blueprint('agents', __name__)


@agents_bp.route('/agents')
def agents_page():
    """Render agents management page."""
    return render_template('agents.html')


@agents_bp.route('/api/agents')
def get_agents():
    """
    Get all agents status.

    Returns:
        JSON with list of all agents and their status
    """
    try:
        agent_manager = get_agent_manager()
        agents = agent_manager.get_all_agents_status()

        return jsonify({
            'success': True,
            'agents': agents,
            'total': len(agents)
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@agents_bp.route('/api/agents/<agent_name>')
def get_agent(agent_name):
    """
    Get specific agent status.

    Args:
        agent_name: Name of the agent

    Returns:
        JSON with agent status
    """
    try:
        agent_manager = get_agent_manager()
        status = agent_manager.get_agent_status(agent_name)

        return jsonify({
            'success': True,
            'agent': status
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@agents_bp.route('/api/agents/<agent_name>/start', methods=['POST'])
def start_agent(agent_name):
    """
    Start an agent.

    Args:
        agent_name: Name of the agent to start

    Returns:
        JSON with start result
    """
    try:
        agent_manager = get_agent_manager()
        result = agent_manager.start_agent(agent_name)

        return jsonify(result)

    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500


@agents_bp.route('/api/agents/<agent_name>/stop', methods=['POST'])
def stop_agent(agent_name):
    """
    Stop an agent.

    Args:
        agent_name: Name of the agent to stop

    Returns:
        JSON with stop result
    """
    try:
        agent_manager = get_agent_manager()
        result = agent_manager.stop_agent(agent_name)

        return jsonify(result)

    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500


@agents_bp.route('/api/agents/<agent_name>/restart', methods=['POST'])
def restart_agent(agent_name):
    """
    Restart an agent.

    Args:
        agent_name: Name of the agent to restart

    Returns:
        JSON with restart result
    """
    try:
        agent_manager = get_agent_manager()
        result = agent_manager.restart_agent(agent_name)

        return jsonify(result)

    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500
