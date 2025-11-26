"""
Visual builder routes
"""
from flask import Blueprint, request, jsonify
from ..models.component import get_all_components, get_component_template
from ..services.executor import AgentExecutor
from ..services.agent_builder import AgentBuilder
from ..database import Database

builder_bp = Blueprint('builder', __name__, url_prefix='/api/builder')

db = Database()
agent_builder = AgentBuilder(db)
executor = AgentExecutor()

@builder_bp.route('/components', methods=['GET'])
def get_components():
    """Get all available components"""
    try:
        components = get_all_components()

        return jsonify({
            'success': True,
            'components': {
                category: [comp.to_dict() for comp in comps]
                for category, comps in components.items()
            }
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@builder_bp.route('/components/<string:category>/<string:component_type>', methods=['GET'])
def get_component(category, component_type):
    """Get specific component template"""
    try:
        component = get_component_template(category, component_type)

        if not component:
            return jsonify({
                'success': False,
                'error': 'Component not found'
            }), 404

        return jsonify({
            'success': True,
            'component': component.to_dict()
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@builder_bp.route('/preview/<int:agent_id>', methods=['GET'])
def preview_agent(agent_id):
    """Preview agent behavior"""
    try:
        agent = agent_builder.get_agent(agent_id)

        if not agent:
            return jsonify({
                'success': False,
                'error': 'Agent not found'
            }), 404

        preview = executor.preview_behavior(agent.config)

        return jsonify({
            'success': True,
            'preview': preview
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@builder_bp.route('/dry-run/<int:agent_id>', methods=['POST'])
def dry_run_agent(agent_id):
    """Execute agent in dry run mode"""
    try:
        agent = agent_builder.get_agent(agent_id)

        if not agent:
            return jsonify({
                'success': False,
                'error': 'Agent not found'
            }), 404

        test_input = request.json.get('input') if request.json else None

        result = executor.dry_run(agent.config, test_input)

        # Save execution log
        db.add_execution_log(
            agent_id=agent_id,
            execution_type=result.execution_type,
            status=result.status,
            input_data=result.input_data,
            output_data=result.output_data,
            error_message=result.error_message,
            duration_ms=result.duration_ms
        )

        return jsonify({
            'success': True,
            'result': result.to_dict()
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@builder_bp.route('/models', methods=['GET'])
def get_available_models():
    """Get available AI models"""
    try:
        from ..config import Config

        return jsonify({
            'success': True,
            'models': Config.SUPPORTED_MODELS
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@builder_bp.route('/templates', methods=['GET'])
def get_agent_templates():
    """Get predefined agent templates"""
    try:
        templates = [
            {
                'id': 'code_reviewer',
                'name': 'Code Reviewer',
                'description': 'Review code for quality, security, and performance',
                'model': 'claude-3-5-sonnet-20241022',
                'role': 'Senior Code Reviewer',
                'instructions': [
                    'You are an experienced code reviewer',
                    'Analyze code for quality, security vulnerabilities, and performance issues',
                    'Provide constructive feedback with specific examples',
                    'Suggest improvements following best practices'
                ],
                'triggers': [{'type': 'webhook', 'config': {'path': '/review'}}],
                'actions': [
                    {
                        'type': 'ai_call',
                        'name': 'analyze_code',
                        'config': {'model': 'claude-3-5-sonnet-20241022'}
                    }
                ]
            },
            {
                'id': 'data_analyzer',
                'name': 'Data Analyzer',
                'description': 'Analyze data and generate insights',
                'model': 'gpt-4-turbo-preview',
                'role': 'Data Analyst',
                'instructions': [
                    'You are a data analyst specializing in trend analysis',
                    'Extract meaningful insights from data',
                    'Generate clear, actionable reports',
                    'Identify patterns and anomalies'
                ],
                'triggers': [{'type': 'time', 'config': {'schedule': '0 */6 * * *'}}],
                'actions': [
                    {
                        'type': 'ai_call',
                        'name': 'analyze_data',
                        'config': {'model': 'gpt-4-turbo-preview'}
                    },
                    {
                        'type': 'http_request',
                        'name': 'fetch_data',
                        'config': {'method': 'GET'}
                    }
                ]
            },
            {
                'id': 'content_moderator',
                'name': 'Content Moderator',
                'description': 'Moderate user-generated content',
                'model': 'claude-3-5-sonnet-20241022',
                'role': 'Content Moderator',
                'instructions': [
                    'You are a content moderator ensuring community safety',
                    'Flag inappropriate, harmful, or spam content',
                    'Be fair and consistent in moderation decisions',
                    'Provide clear reasons for content flags'
                ],
                'triggers': [{'type': 'event', 'config': {'event_type': 'content_submitted'}}],
                'actions': [
                    {
                        'type': 'ai_call',
                        'name': 'moderate_content',
                        'config': {'model': 'claude-3-5-sonnet-20241022'}
                    }
                ],
                'conditions': [
                    {
                        'type': 'if_else',
                        'expression': 'moderation_score > 0.8',
                        'true_branch': ['flag_content'],
                        'false_branch': ['approve_content']
                    }
                ]
            },
            {
                'id': 'customer_support',
                'name': 'Customer Support Agent',
                'description': 'Handle customer inquiries and support tickets',
                'model': 'claude-3-5-sonnet-20241022',
                'role': 'Customer Support Representative',
                'instructions': [
                    'You are a helpful customer support agent',
                    'Respond to customer inquiries professionally and empathetically',
                    'Provide accurate information about products and services',
                    'Escalate complex issues when necessary'
                ],
                'triggers': [{'type': 'webhook', 'config': {'path': '/support'}}],
                'actions': [
                    {
                        'type': 'ai_call',
                        'name': 'generate_response',
                        'config': {'model': 'claude-3-5-sonnet-20241022'}
                    },
                    {
                        'type': 'database',
                        'name': 'log_ticket',
                        'config': {'operation': 'insert'}
                    }
                ]
            },
            {
                'id': 'task_scheduler',
                'name': 'Task Scheduler',
                'description': 'Schedule and manage automated tasks',
                'model': 'gpt-3.5-turbo',
                'role': 'Task Scheduler',
                'instructions': [
                    'You are a task scheduling agent',
                    'Manage and execute scheduled tasks',
                    'Monitor task completion and handle failures',
                    'Send notifications on task status changes'
                ],
                'triggers': [{'type': 'time', 'config': {'schedule': '*/15 * * * *'}}],
                'actions': [
                    {
                        'type': 'http_request',
                        'name': 'execute_task',
                        'config': {'method': 'POST', 'timeout': 30000}
                    },
                    {
                        'type': 'email',
                        'name': 'send_notification',
                        'config': {}
                    }
                ]
            }
        ]

        return jsonify({
            'success': True,
            'templates': templates
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
