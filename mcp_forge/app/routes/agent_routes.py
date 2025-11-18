"""
Agent CRUD routes
"""
from flask import Blueprint, request, jsonify
from ..services.agent_builder import AgentBuilder
from ..database import Database

agent_bp = Blueprint('agent', __name__, url_prefix='/api/agents')

db = Database()
builder = AgentBuilder(db)

@agent_bp.route('/', methods=['GET'])
def list_agents():
    """List all agents"""
    try:
        agents = builder.list_agents()
        return jsonify({
            'success': True,
            'agents': [agent.to_dict() for agent in agents]
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@agent_bp.route('/', methods=['POST'])
def create_agent():
    """Create a new agent"""
    try:
        data = request.json

        name = data.get('name')
        description = data.get('description', '')
        model = data.get('model')
        role = data.get('role', '')
        instructions = data.get('instructions', [])

        if not name or not model:
            return jsonify({
                'success': False,
                'error': 'Name and model are required'
            }), 400

        agent = builder.create_agent(
            name=name,
            description=description,
            model=model,
            role=role,
            instructions=instructions
        )

        return jsonify({
            'success': True,
            'agent': agent.to_dict()
        }), 201

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@agent_bp.route('/<int:agent_id>', methods=['GET'])
def get_agent(agent_id):
    """Get agent by ID"""
    try:
        agent = builder.get_agent(agent_id)

        if not agent:
            return jsonify({
                'success': False,
                'error': 'Agent not found'
            }), 404

        return jsonify({
            'success': True,
            'agent': agent.to_dict()
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@agent_bp.route('/by-name/<string:name>', methods=['GET'])
def get_agent_by_name(name):
    """Get agent by name"""
    try:
        agent = builder.get_agent_by_name(name)

        if not agent:
            return jsonify({
                'success': False,
                'error': 'Agent not found'
            }), 404

        return jsonify({
            'success': True,
            'agent': agent.to_dict()
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@agent_bp.route('/<int:agent_id>', methods=['PUT'])
def update_agent(agent_id):
    """Update agent"""
    try:
        data = request.json

        updated = builder.update_agent(agent_id, **data)

        if not updated:
            return jsonify({
                'success': False,
                'error': 'Agent not found or update failed'
            }), 404

        agent = builder.get_agent(agent_id)

        return jsonify({
            'success': True,
            'agent': agent.to_dict()
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@agent_bp.route('/<int:agent_id>', methods=['DELETE'])
def delete_agent(agent_id):
    """Delete agent"""
    try:
        deleted = builder.delete_agent(agent_id)

        if not deleted:
            return jsonify({
                'success': False,
                'error': 'Agent not found'
            }), 404

        return jsonify({
            'success': True,
            'message': 'Agent deleted successfully'
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@agent_bp.route('/<int:agent_id>/triggers', methods=['POST'])
def add_trigger(agent_id):
    """Add trigger to agent"""
    try:
        data = request.json

        trigger_type = data.get('type')
        config = data.get('config', {})

        if not trigger_type:
            return jsonify({
                'success': False,
                'error': 'Trigger type is required'
            }), 400

        success = builder.add_trigger(agent_id, trigger_type, config)

        if not success:
            return jsonify({
                'success': False,
                'error': 'Failed to add trigger'
            }), 404

        agent = builder.get_agent(agent_id)

        return jsonify({
            'success': True,
            'agent': agent.to_dict()
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@agent_bp.route('/<int:agent_id>/actions', methods=['POST'])
def add_action(agent_id):
    """Add action to agent"""
    try:
        data = request.json

        action_type = data.get('type')
        name = data.get('name')
        config = data.get('config', {})
        retry_config = data.get('retry_config')

        if not action_type or not name:
            return jsonify({
                'success': False,
                'error': 'Action type and name are required'
            }), 400

        success = builder.add_action(agent_id, action_type, name, config, retry_config)

        if not success:
            return jsonify({
                'success': False,
                'error': 'Failed to add action'
            }), 404

        agent = builder.get_agent(agent_id)

        return jsonify({
            'success': True,
            'agent': agent.to_dict()
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@agent_bp.route('/<int:agent_id>/conditions', methods=['POST'])
def add_condition(agent_id):
    """Add condition to agent"""
    try:
        data = request.json

        condition_type = data.get('type')
        expression = data.get('expression')
        true_branch = data.get('true_branch')
        false_branch = data.get('false_branch')

        if not condition_type or not expression:
            return jsonify({
                'success': False,
                'error': 'Condition type and expression are required'
            }), 400

        success = builder.add_condition(
            agent_id, condition_type, expression, true_branch, false_branch
        )

        if not success:
            return jsonify({
                'success': False,
                'error': 'Failed to add condition'
            }), 404

        agent = builder.get_agent(agent_id)

        return jsonify({
            'success': True,
            'agent': agent.to_dict()
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@agent_bp.route('/<int:agent_id>/instructions', methods=['PUT'])
def set_instructions(agent_id):
    """Set agent instructions"""
    try:
        data = request.json
        instructions = data.get('instructions', [])

        success = builder.set_instructions(agent_id, instructions)

        if not success:
            return jsonify({
                'success': False,
                'error': 'Failed to set instructions'
            }), 404

        agent = builder.get_agent(agent_id)

        return jsonify({
            'success': True,
            'agent': agent.to_dict()
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@agent_bp.route('/<int:agent_id>/role', methods=['PUT'])
def set_role(agent_id):
    """Set agent role"""
    try:
        data = request.json
        role = data.get('role', '')

        success = builder.set_role(agent_id, role)

        if not success:
            return jsonify({
                'success': False,
                'error': 'Failed to set role'
            }), 404

        agent = builder.get_agent(agent_id)

        return jsonify({
            'success': True,
            'agent': agent.to_dict()
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@agent_bp.route('/<int:agent_id>/clone', methods=['POST'])
def clone_agent(agent_id):
    """Clone an agent"""
    try:
        data = request.json
        new_name = data.get('name')

        if not new_name:
            return jsonify({
                'success': False,
                'error': 'New name is required'
            }), 400

        cloned_agent = builder.clone_agent(agent_id, new_name)

        if not cloned_agent:
            return jsonify({
                'success': False,
                'error': 'Failed to clone agent'
            }), 404

        return jsonify({
            'success': True,
            'agent': cloned_agent.to_dict()
        }), 201

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@agent_bp.route('/<int:agent_id>/stats', methods=['GET'])
def get_agent_stats(agent_id):
    """Get agent statistics"""
    try:
        stats = builder.get_agent_stats(agent_id)

        if not stats:
            return jsonify({
                'success': False,
                'error': 'Agent not found'
            }), 404

        return jsonify({
            'success': True,
            'stats': stats
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@agent_bp.route('/<int:agent_id>/logs', methods=['GET'])
def get_execution_logs(agent_id):
    """Get agent execution logs"""
    try:
        limit = request.args.get('limit', 50, type=int)
        logs = db.get_execution_logs(agent_id, limit)

        return jsonify({
            'success': True,
            'logs': logs
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
