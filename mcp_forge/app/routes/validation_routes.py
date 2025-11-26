"""
Validation routes
"""
from flask import Blueprint, request, jsonify
from ..services.agent_builder import AgentBuilder
from ..services.ai_validator import AIValidator
from ..database import Database

validation_bp = Blueprint('validation', __name__, url_prefix='/api/validation')

db = Database()
builder = AgentBuilder(db)
validator = AIValidator()

@validation_bp.route('/<int:agent_id>/validate', methods=['POST'])
def validate_agent(agent_id):
    """Validate agent with AI"""
    try:
        data = request.json if request.json else {}
        validator_type = data.get('validator', 'claude')

        result = builder.validate_agent(agent_id, validator_type)

        if not result:
            return jsonify({
                'success': False,
                'error': 'Agent not found'
            }), 404

        return jsonify({
            'success': True,
            'validation': result
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@validation_bp.route('/<int:agent_id>/instructions/analyze', methods=['GET'])
def analyze_instructions(agent_id):
    """Analyze agent instructions quality"""
    try:
        agent = builder.get_agent(agent_id)

        if not agent:
            return jsonify({
                'success': False,
                'error': 'Agent not found'
            }), 404

        analysis = validator.analyze_instructions(agent.config.instructions)

        return jsonify({
            'success': True,
            'analysis': analysis
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@validation_bp.route('/check-config', methods=['POST'])
def check_configuration():
    """Check if validation services are configured"""
    try:
        from ..config import Config

        config_status = {
            'anthropic_configured': bool(Config.ANTHROPIC_API_KEY),
            'openai_configured': bool(Config.OPENAI_API_KEY),
            'available_validators': []
        }

        if config_status['anthropic_configured']:
            config_status['available_validators'].append('claude')

        if config_status['openai_configured']:
            config_status['available_validators'].append('gpt')

        return jsonify({
            'success': True,
            'status': config_status
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
