"""
Skynet Token Switcher — Switcher Engine
Intelligent provider selection and usage management
"""

from datetime import datetime
from .quota_manager import QuotaManager


class SwitcherEngine:
    """Core logic for intelligent API provider switching"""

    def __init__(self, db):
        self.db = db
        self.quota_manager = QuotaManager()
        self.forced_provider = None

    def choose_provider(self):
        """
        Choose the best provider based on:
        1. API not depleted
        2. Most quota remaining
        3. Least recently used
        4. Claude priority if equal

        Returns:
            dict with provider info or None if all depleted
        """
        # If provider is forced, use it
        if self.forced_provider:
            forced_status = self._get_provider_status(self.forced_provider)
            if forced_status and self.quota_manager.is_provider_available(forced_status):
                return {
                    'provider': self.forced_provider,
                    'reason': 'forced_selection',
                    'status': forced_status
                }
            else:
                # Forced provider not available, clear it
                self.forced_provider = None

        # Get all provider statuses
        statuses = self.quota_manager.get_all_statuses(self.db)

        if not statuses:
            return None

        # Filter available providers
        available = [s for s in statuses if self.quota_manager.is_provider_available(s)]

        if not available:
            return None

        # Sort by priority score (highest first)
        sorted_providers = sorted(
            available,
            key=lambda s: self.quota_manager.get_priority_score(s),
            reverse=True
        )

        best = sorted_providers[0]

        return {
            'provider': best['provider'],
            'reason': 'optimal_selection',
            'status': best,
            'alternatives': len(sorted_providers) - 1
        }

    def register_usage(self, provider, tokens_used, success=True, reason=None):
        """
        Register API usage

        Args:
            provider: provider name
            tokens_used: number of tokens consumed
            success: whether the call succeeded
            reason: optional reason/error message

        Returns:
            bool - success status
        """
        # Update quota in database
        if success:
            self.db.update_usage(provider, tokens_used)

        # Log the event
        self.db.log_event(provider, tokens_used, success, reason)

        return True

    def force_provider(self, provider):
        """
        Force a specific provider for next requests

        Args:
            provider: provider name to force

        Returns:
            dict with result
        """
        # Verify provider exists
        provider_data = self.db.get_key(provider)

        if not provider_data:
            return {
                'success': False,
                'message': f'Provider "{provider}" not found'
            }

        # Check if provider is available
        status = self.quota_manager.calculate_status(provider_data)

        if not self.quota_manager.is_provider_available(status):
            return {
                'success': False,
                'message': f'Provider "{provider}" is depleted or unavailable',
                'status': status
            }

        self.forced_provider = provider

        return {
            'success': True,
            'message': f'Provider forced to "{provider}"',
            'status': status
        }

    def clear_forced_provider(self):
        """Clear forced provider setting"""
        self.forced_provider = None
        return {
            'success': True,
            'message': 'Forced provider cleared, automatic selection enabled'
        }

    def get_current_forced(self):
        """Get currently forced provider"""
        return self.forced_provider

    def _get_provider_status(self, provider):
        """Get status for a specific provider"""
        provider_data = self.db.get_key(provider)
        if provider_data:
            return self.quota_manager.calculate_status(provider_data)
        return None

    def simulate_usage(self, tokens_used):
        """
        Simulate API call to get provider recommendation

        Args:
            tokens_used: estimated tokens for the call

        Returns:
            dict with provider recommendation
        """
        choice = self.choose_provider()

        if not choice:
            return {
                'success': False,
                'message': 'No available providers',
                'provider': None
            }

        provider = choice['provider']
        status = choice['status']

        # Check if provider has enough quota
        if status['remaining'] < tokens_used:
            return {
                'success': False,
                'message': f'Provider "{provider}" has insufficient quota',
                'provider': provider,
                'remaining': status['remaining'],
                'needed': tokens_used
            }

        return {
            'success': True,
            'provider': provider,
            'api_key': status['api_key'],
            'remaining_after': status['remaining'] - tokens_used,
            'reason': choice['reason'],
            'alternatives': choice.get('alternatives', 0)
        }

    def get_system_health(self):
        """
        Get overall system health status

        Returns:
            dict with health metrics
        """
        statuses = self.quota_manager.get_all_statuses(self.db)

        if not statuses:
            return {
                'status': 'no_providers',
                'message': 'No API providers configured',
                'severity': 'critical'
            }

        available = [s for s in statuses if self.quota_manager.is_provider_available(s)]
        total_remaining = sum(s['remaining'] for s in statuses)
        total_quota = sum(s['quota_total'] for s in statuses)

        overall_used_pct = round((1 - (total_remaining / total_quota)) * 100, 2) if total_quota > 0 else 0

        # Determine overall health
        if len(available) == 0:
            status = 'critical'
            message = 'All providers depleted'
        elif len(available) == len(statuses):
            status = 'healthy'
            message = 'All providers operational'
        else:
            status = 'degraded'
            message = f'{len(available)}/{len(statuses)} providers available'

        return {
            'status': status,
            'message': message,
            'severity': self._health_to_severity(status),
            'providers_total': len(statuses),
            'providers_available': len(available),
            'total_quota': total_quota,
            'total_remaining': total_remaining,
            'overall_used_pct': overall_used_pct,
            'forced_provider': self.forced_provider
        }

    @staticmethod
    def _health_to_severity(status):
        """Convert health status to severity level"""
        severity_map = {
            'healthy': 'ok',
            'degraded': 'warning',
            'critical': 'critical',
            'no_providers': 'critical'
        }
        return severity_map.get(status, 'unknown')
