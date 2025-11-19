"""
Skynet Token Switcher — API Routes
Flask routes for token management and provider switching
"""

from flask import Blueprint, request, jsonify, render_template
from .quota_manager import QuotaManager


def create_routes(db, switcher):
    """
    Create and configure Flask routes

    Args:
        db: Database instance
        switcher: SwitcherEngine instance

    Returns:
        Blueprint with all routes
    """
    bp = Blueprint('api', __name__)
    quota_manager = QuotaManager()

    # ========================================
    # WEB UI ROUTES
    # ========================================

    @bp.route('/')
    def dashboard():
        """Render the main dashboard"""
        return render_template('dashboard.html')

    # ========================================
    # API ROUTES
    # ========================================

    @bp.route('/api/status', methods=['GET'])
    def get_status():
        """
        Get status of all providers

        Returns:
            JSON with all provider statuses
        """
        try:
            statuses = quota_manager.get_all_statuses(db)
            health = switcher.get_system_health()
            recommendation = quota_manager.get_recommendation(statuses)

            return jsonify({
                'success': True,
                'providers': statuses,
                'health': health,
                'recommendation': recommendation,
                'timestamp': _get_timestamp()
            })
        except Exception as e:
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500

    @bp.route('/api/choose', methods=['POST'])
    def choose_provider():
        """
        Get recommended provider for API call

        Body (optional):
            {
                "tokens_estimate": 1000
            }

        Returns:
            JSON with provider recommendation
        """
        try:
            data = request.get_json() or {}
            tokens_estimate = data.get('tokens_estimate', 0)

            if tokens_estimate > 0:
                result = switcher.simulate_usage(tokens_estimate)
            else:
                choice = switcher.choose_provider()
                if choice:
                    result = {
                        'success': True,
                        'provider': choice['provider'],
                        'api_key': choice['status']['api_key'],
                        'reason': choice['reason']
                    }
                else:
                    result = {
                        'success': False,
                        'message': 'No available providers'
                    }

            return jsonify(result)
        except Exception as e:
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500

    @bp.route('/api/use', methods=['POST'])
    def register_usage():
        """
        Register API usage

        Body:
            {
                "provider": "claude",
                "tokens_used": 1000,
                "success": true,
                "reason": "optional error message"
            }

        Returns:
            JSON with registration result
        """
        try:
            data = request.get_json()

            if not data:
                return jsonify({
                    'success': False,
                    'error': 'No data provided'
                }), 400

            provider = data.get('provider')
            tokens_used = data.get('tokens_used')
            success = data.get('success', True)
            reason = data.get('reason')

            if not provider or tokens_used is None:
                return jsonify({
                    'success': False,
                    'error': 'Missing required fields: provider, tokens_used'
                }), 400

            switcher.register_usage(provider, tokens_used, success, reason)

            return jsonify({
                'success': True,
                'message': f'Usage registered for {provider}',
                'tokens_used': tokens_used
            })
        except Exception as e:
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500

    @bp.route('/api/add_key', methods=['POST'])
    def add_key():
        """
        Add or update API key

        Body:
            {
                "provider": "claude",
                "api_key": "sk-xxx",
                "quota_total": 500000
            }

        Returns:
            JSON with operation result
        """
        try:
            data = request.get_json()

            if not data:
                return jsonify({
                    'success': False,
                    'error': 'No data provided'
                }), 400

            provider = data.get('provider')
            api_key = data.get('api_key')
            quota_total = data.get('quota_total')

            if not all([provider, api_key, quota_total]):
                return jsonify({
                    'success': False,
                    'error': 'Missing required fields: provider, api_key, quota_total'
                }), 400

            success = db.add_key(provider, api_key, quota_total)

            if success:
                return jsonify({
                    'success': True,
                    'message': f'API key added/updated for {provider}'
                })
            else:
                return jsonify({
                    'success': False,
                    'error': 'Failed to add key'
                }), 500
        except Exception as e:
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500

    @bp.route('/api/history', methods=['GET'])
    def get_history():
        """
        Get usage history

        Query params:
            limit: number of records (default 50)

        Returns:
            JSON with usage logs
        """
        try:
            limit = request.args.get('limit', 50, type=int)
            logs = db.get_recent_logs(limit)

            return jsonify({
                'success': True,
                'logs': logs,
                'count': len(logs)
            })
        except Exception as e:
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500

    @bp.route('/api/force_provider', methods=['POST'])
    def force_provider():
        """
        Force a specific provider

        Body:
            {
                "provider": "claude"
            }

        Returns:
            JSON with operation result
        """
        try:
            data = request.get_json()

            if not data or not data.get('provider'):
                return jsonify({
                    'success': False,
                    'error': 'Provider name required'
                }), 400

            provider = data['provider']
            result = switcher.force_provider(provider)

            if result['success']:
                return jsonify(result)
            else:
                return jsonify(result), 400
        except Exception as e:
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500

    @bp.route('/api/clear_forced', methods=['POST'])
    def clear_forced():
        """
        Clear forced provider

        Returns:
            JSON with operation result
        """
        try:
            result = switcher.clear_forced_provider()
            return jsonify(result)
        except Exception as e:
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500

    @bp.route('/api/reset_quota', methods=['POST'])
    def reset_quota():
        """
        Reset quota for a provider

        Body:
            {
                "provider": "claude"
            }

        Returns:
            JSON with operation result
        """
        try:
            data = request.get_json()

            if not data or not data.get('provider'):
                return jsonify({
                    'success': False,
                    'error': 'Provider name required'
                }), 400

            provider = data['provider']
            success = db.reset_quota(provider)

            if success:
                return jsonify({
                    'success': True,
                    'message': f'Quota reset for {provider}'
                })
            else:
                return jsonify({
                    'success': False,
                    'error': 'Failed to reset quota'
                }), 500
        except Exception as e:
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500

    @bp.route('/api/health', methods=['GET'])
    def health_check():
        """
        System health check

        Returns:
            JSON with system health
        """
        try:
            health = switcher.get_system_health()
            return jsonify({
                'success': True,
                'health': health
            })
        except Exception as e:
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500

    return bp


def _get_timestamp():
    """Get current ISO timestamp"""
    from datetime import datetime
    return datetime.now().isoformat()
