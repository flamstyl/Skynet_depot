"""
Export and deployment routes
"""
import os
import shutil
from pathlib import Path
from flask import Blueprint, request, jsonify, send_file
from ..services.agent_builder import AgentBuilder
from ..services.config_generator import ConfigGenerator
from ..database import Database
from ..config import Config

export_bp = Blueprint('export', __name__, url_prefix='/api/export')

db = Database()
builder = AgentBuilder(db)
config_gen = ConfigGenerator()

@export_bp.route('/<int:agent_id>/yaml', methods=['GET'])
def export_yaml(agent_id):
    """Export agent as YAML"""
    try:
        agent = builder.get_agent(agent_id)

        if not agent:
            return jsonify({
                'success': False,
                'error': 'Agent not found'
            }), 404

        yaml_content = config_gen.to_yaml(agent.config)

        return jsonify({
            'success': True,
            'format': 'yaml',
            'content': yaml_content,
            'filename': f"{agent.name.lower().replace(' ', '_')}.yaml"
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@export_bp.route('/<int:agent_id>/json', methods=['GET'])
def export_json(agent_id):
    """Export agent as JSON"""
    try:
        agent = builder.get_agent(agent_id)

        if not agent:
            return jsonify({
                'success': False,
                'error': 'Agent not found'
            }), 404

        json_content = config_gen.to_json(agent.config)

        return jsonify({
            'success': True,
            'format': 'json',
            'content': json_content,
            'filename': f"{agent.name.lower().replace(' ', '_')}.json"
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@export_bp.route('/<int:agent_id>/n8n', methods=['GET'])
def export_n8n(agent_id):
    """Export agent as n8n workflow"""
    try:
        agent = builder.get_agent(agent_id)

        if not agent:
            return jsonify({
                'success': False,
                'error': 'Agent not found'
            }), 404

        workflow = config_gen.to_n8n_workflow(agent.config)

        return jsonify({
            'success': True,
            'format': 'n8n',
            'workflow': workflow,
            'filename': f"{agent.name.lower().replace(' ', '_')}_n8n.json"
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@export_bp.route('/<int:agent_id>/mcp', methods=['GET'])
def export_mcp(agent_id):
    """Export agent as MCP config"""
    try:
        agent = builder.get_agent(agent_id)

        if not agent:
            return jsonify({
                'success': False,
                'error': 'Agent not found'
            }), 404

        mcp_config = config_gen.to_mcp_config(agent.config)

        return jsonify({
            'success': True,
            'format': 'mcp',
            'config': mcp_config,
            'filename': f"{agent.name.lower().replace(' ', '_')}_mcp.json"
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@export_bp.route('/<int:agent_id>/save', methods=['POST'])
def save_export(agent_id):
    """Save agent export to file"""
    try:
        data = request.json
        format = data.get('format', 'yaml')

        agent = builder.get_agent(agent_id)

        if not agent:
            return jsonify({
                'success': False,
                'error': 'Agent not found'
            }), 404

        filepath = config_gen.save_to_file(agent.config, format)

        return jsonify({
            'success': True,
            'format': format,
            'filepath': str(filepath),
            'message': f'Agent exported to {filepath}'
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@export_bp.route('/<int:agent_id>/download/<string:format>', methods=['GET'])
def download_export(agent_id, format):
    """Download agent export file"""
    try:
        agent = builder.get_agent(agent_id)

        if not agent:
            return jsonify({
                'success': False,
                'error': 'Agent not found'
            }), 404

        filepath = config_gen.save_to_file(agent.config, format)

        return send_file(
            filepath,
            as_attachment=True,
            download_name=filepath.name
        )

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@export_bp.route('/<int:agent_id>/deploy-n8n', methods=['POST'])
def deploy_to_n8n(agent_id):
    """Deploy agent to n8n"""
    try:
        agent = builder.get_agent(agent_id)

        if not agent:
            return jsonify({
                'success': False,
                'error': 'Agent not found'
            }), 404

        # Generate n8n workflow
        workflow = config_gen.to_n8n_workflow(agent.config)

        # Save to n8n agents directory if configured
        n8n_dir = Config.N8N_AGENTS_DIR
        if n8n_dir and os.path.exists(n8n_dir):
            import json
            safe_name = agent.name.lower().replace(' ', '_').replace('-', '_')
            n8n_filepath = Path(n8n_dir) / f"{safe_name}_n8n.json"

            with open(n8n_filepath, 'w', encoding='utf-8') as f:
                json.dump(workflow, f, indent=2)

            return jsonify({
                'success': True,
                'message': f'Agent deployed to n8n at {n8n_filepath}',
                'filepath': str(n8n_filepath)
            })
        else:
            return jsonify({
                'success': False,
                'error': 'n8n directory not configured or not found'
            }), 400

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@export_bp.route('/list', methods=['GET'])
def list_exports():
    """List all exported files"""
    try:
        exports_dir = Config.EXPORTS_DIR
        exports_dir.mkdir(parents=True, exist_ok=True)

        exports = []
        for filepath in exports_dir.iterdir():
            if filepath.is_file():
                stat = filepath.stat()
                exports.append({
                    'filename': filepath.name,
                    'size': stat.st_size,
                    'created': stat.st_ctime,
                    'modified': stat.st_mtime
                })

        return jsonify({
            'success': True,
            'exports': exports
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
