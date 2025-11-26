"""
Skynet Token Switcher — Quota Manager
Intelligent quota calculation and state management
"""


class QuotaManager:
    """Manages quota calculations and provider states"""

    # Threshold definitions
    THRESHOLD_WARNING = 80.0  # 80%
    THRESHOLD_CRITICAL = 90.0  # 90%
    THRESHOLD_DEPLETED = 100.0  # 100%

    @staticmethod
    def calculate_status(provider_data):
        """
        Calculate comprehensive quota status for a provider

        Args:
            provider_data: dict with 'quota_total', 'quota_used', 'provider', 'last_update'

        Returns:
            dict with detailed quota status
        """
        quota_total = provider_data.get('quota_total', 0)
        quota_used = provider_data.get('quota_used', 0)
        provider = provider_data.get('provider', 'unknown')

        # Calculate remaining quota
        remaining = max(0, quota_total - quota_used)

        # Calculate usage percentage
        if quota_total > 0:
            used_pct = round((quota_used / quota_total) * 100, 2)
        else:
            used_pct = 0.0

        # Determine state
        state = QuotaManager._determine_state(used_pct)

        return {
            'provider': provider,
            'quota_total': quota_total,
            'quota_used': quota_used,
            'remaining': remaining,
            'used_pct': used_pct,
            'state': state,
            'last_update': provider_data.get('last_update', None),
            'api_key': provider_data.get('api_key', None)
        }

    @staticmethod
    def _determine_state(used_pct):
        """
        Determine provider state based on usage percentage

        States:
        - OK: < 80%
        - Warning: 80-90%
        - Critical: 90-100%
        - Depleted: >= 100%
        """
        if used_pct >= QuotaManager.THRESHOLD_DEPLETED:
            return "depleted"
        elif used_pct >= QuotaManager.THRESHOLD_CRITICAL:
            return "critical"
        elif used_pct >= QuotaManager.THRESHOLD_WARNING:
            return "warning"
        else:
            return "ok"

    @staticmethod
    def get_all_statuses(db):
        """
        Get quota status for all providers

        Args:
            db: Database instance

        Returns:
            list of quota status dicts
        """
        all_keys = db.get_all_keys()
        statuses = []

        for key_data in all_keys:
            status = QuotaManager.calculate_status(key_data)
            statuses.append(status)

        return statuses

    @staticmethod
    def is_provider_available(status):
        """
        Check if a provider is available for use

        Args:
            status: quota status dict

        Returns:
            bool - True if provider can be used
        """
        return status['state'] != 'depleted' and status['remaining'] > 0

    @staticmethod
    def get_priority_score(status):
        """
        Calculate priority score for provider selection
        Higher score = better choice

        Args:
            status: quota status dict

        Returns:
            float - priority score
        """
        if not QuotaManager.is_provider_available(status):
            return -1.0

        # Base score on remaining percentage
        remaining_pct = 100 - status['used_pct']

        # Bonus for Claude provider
        provider_bonus = 10.0 if status['provider'].lower() == 'claude' else 0.0

        # State penalties
        state_penalty = {
            'ok': 0.0,
            'warning': -5.0,
            'critical': -15.0,
            'depleted': -100.0
        }.get(status['state'], 0.0)

        return remaining_pct + provider_bonus + state_penalty

    @staticmethod
    def format_quota_display(status):
        """
        Format quota information for display

        Args:
            status: quota status dict

        Returns:
            dict with formatted strings
        """
        return {
            'provider': status['provider'].upper(),
            'used': f"{status['quota_used']:,}",
            'total': f"{status['quota_total']:,}",
            'remaining': f"{status['remaining']:,}",
            'percentage': f"{status['used_pct']}%",
            'state': status['state'].upper(),
            'state_emoji': QuotaManager._get_state_emoji(status['state'])
        }

    @staticmethod
    def _get_state_emoji(state):
        """Get emoji representation for state"""
        emoji_map = {
            'ok': '🟢',
            'warning': '🟠',
            'critical': '🔴',
            'depleted': '⚫'
        }
        return emoji_map.get(state, '❓')

    @staticmethod
    def get_recommendation(statuses):
        """
        Get usage recommendation based on all provider statuses

        Args:
            statuses: list of quota status dicts

        Returns:
            dict with recommendation
        """
        available = [s for s in statuses if QuotaManager.is_provider_available(s)]

        if not available:
            return {
                'recommended': None,
                'message': 'All providers depleted. Add more quota or wait for reset.',
                'severity': 'critical'
            }

        # Check if any provider is in critical state
        critical_count = sum(1 for s in statuses if s['state'] == 'critical')

        if critical_count > 0:
            severity = 'warning'
            message = f"{critical_count} provider(s) in critical state."
        else:
            severity = 'ok'
            message = 'All providers operating normally.'

        return {
            'recommended': available[0]['provider'] if available else None,
            'message': message,
            'severity': severity,
            'available_count': len(available),
            'total_count': len(statuses)
        }
