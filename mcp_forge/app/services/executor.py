"""
Agent Executor - Execute agents in dry run mode for testing
"""
import time
import json
from typing import Dict, Any, Optional
from datetime import datetime
from ..models.agent import AgentConfig, ExecutionResult
from ..config import Config

class AgentExecutor:
    """Execute agents for testing and validation"""

    def __init__(self):
        self.max_execution_time = Config.MAX_DRY_RUN_TIME
        self.sandbox_enabled = Config.SANDBOX_ENABLED

    def dry_run(self, agent_config: AgentConfig, test_input: Optional[Dict[str, Any]] = None) -> ExecutionResult:
        """
        Execute agent in dry run mode (simulation)

        Args:
            agent_config: Agent configuration
            test_input: Test input data

        Returns:
            ExecutionResult with simulated execution data
        """
        start_time = time.time()

        try:
            # Validate agent configuration
            validation_errors = self._validate_config(agent_config)
            if validation_errors:
                return ExecutionResult(
                    agent_id=0,
                    execution_type='dry_run',
                    status='error',
                    input_data=test_input,
                    error_message=f"Validation errors: {', '.join(validation_errors)}",
                    duration_ms=int((time.time() - start_time) * 1000),
                    executed_at=datetime.utcnow().isoformat()
                )

            # Simulate execution
            output = self._simulate_execution(agent_config, test_input)

            duration_ms = int((time.time() - start_time) * 1000)

            return ExecutionResult(
                agent_id=0,
                execution_type='dry_run',
                status='success',
                input_data=test_input,
                output_data=output,
                duration_ms=duration_ms,
                executed_at=datetime.utcnow().isoformat()
            )

        except Exception as e:
            duration_ms = int((time.time() - start_time) * 1000)

            return ExecutionResult(
                agent_id=0,
                execution_type='dry_run',
                status='error',
                input_data=test_input,
                error_message=str(e),
                duration_ms=duration_ms,
                executed_at=datetime.utcnow().isoformat()
            )

    def preview_behavior(self, agent_config: AgentConfig) -> Dict[str, Any]:
        """
        Preview agent behavior without execution

        Returns:
            Dictionary describing expected behavior
        """
        behavior = {
            'name': agent_config.name,
            'description': agent_config.description,
            'model': agent_config.model,
            'role': agent_config.role,
            'trigger_count': len(agent_config.triggers),
            'action_count': len(agent_config.actions),
            'condition_count': len(agent_config.conditions),
            'execution_flow': self._generate_execution_flow(agent_config),
            'estimated_cost': self._estimate_cost(agent_config),
            'estimated_duration_ms': self._estimate_duration(agent_config),
            'potential_issues': self._identify_potential_issues(agent_config)
        }

        return behavior

    def _validate_config(self, agent_config: AgentConfig) -> list:
        """Validate agent configuration"""
        errors = []

        # Check name
        if not agent_config.name:
            errors.append("Agent name is required")

        # Check model
        if not agent_config.model:
            errors.append("Model is required")

        # Check triggers
        if not agent_config.triggers:
            errors.append("At least one trigger is required")

        # Validate trigger configs
        for idx, trigger in enumerate(agent_config.triggers):
            if not trigger.type:
                errors.append(f"Trigger {idx}: type is required")

        # Validate action configs
        for idx, action in enumerate(agent_config.actions):
            if not action.type:
                errors.append(f"Action {idx}: type is required")
            if not action.name:
                errors.append(f"Action {idx}: name is required")

        # Check instructions
        if not agent_config.instructions:
            errors.append("Instructions are recommended for better agent behavior")

        return errors

    def _simulate_execution(self, agent_config: AgentConfig, test_input: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        """Simulate agent execution"""
        execution_log = {
            'trigger': None,
            'actions_executed': [],
            'conditions_evaluated': [],
            'final_output': None
        }

        # Simulate trigger
        if agent_config.triggers:
            trigger = agent_config.triggers[0]
            execution_log['trigger'] = {
                'type': trigger.type,
                'fired': True,
                'data': test_input or {'simulated': True}
            }

        # Simulate actions
        for action in agent_config.actions:
            action_result = {
                'name': action.name,
                'type': action.type,
                'status': 'success',
                'output': self._simulate_action_output(action.type, test_input)
            }
            execution_log['actions_executed'].append(action_result)

        # Simulate conditions
        for condition in agent_config.conditions:
            condition_result = {
                'type': condition.type,
                'expression': condition.expression,
                'result': True,  # Simulate true for dry run
                'branch_taken': 'true'
            }
            execution_log['conditions_evaluated'].append(condition_result)

        # Generate final output
        execution_log['final_output'] = {
            'success': True,
            'message': f"Agent '{agent_config.name}' executed successfully (dry run)",
            'actions_completed': len(agent_config.actions),
            'model_used': agent_config.model
        }

        return execution_log

    def _simulate_action_output(self, action_type: str, test_input: Optional[Dict[str, Any]]) -> Any:
        """Simulate output for different action types"""
        outputs = {
            'ai_call': {
                'response': f"Simulated AI response for input: {test_input}",
                'tokens_used': 150,
                'model': 'simulated'
            },
            'http_request': {
                'status_code': 200,
                'body': {'simulated': True, 'data': 'mock response'}
            },
            'database': {
                'rows_affected': 1,
                'success': True
            },
            'file_ops': {
                'operation': 'read',
                'content': 'simulated file content'
            },
            'email': {
                'sent': True,
                'recipient': 'test@example.com'
            },
            'slack': {
                'posted': True,
                'channel': '#general'
            }
        }

        return outputs.get(action_type, {'simulated': True})

    def _generate_execution_flow(self, agent_config: AgentConfig) -> list:
        """Generate execution flow description"""
        flow = []

        # Triggers
        for trigger in agent_config.triggers:
            flow.append({
                'step': len(flow) + 1,
                'type': 'trigger',
                'description': f"Triggered by {trigger.type}",
                'config': trigger.config
            })

        # Actions
        for action in agent_config.actions:
            flow.append({
                'step': len(flow) + 1,
                'type': 'action',
                'description': f"Execute {action.name} ({action.type})",
                'config': action.config
            })

        # Conditions
        for condition in agent_config.conditions:
            flow.append({
                'step': len(flow) + 1,
                'type': 'condition',
                'description': f"Evaluate condition: {condition.expression}",
                'branches': {
                    'true': condition.true_branch,
                    'false': condition.false_branch
                }
            })

        return flow

    def _estimate_cost(self, agent_config: AgentConfig) -> Dict[str, Any]:
        """Estimate execution cost"""
        # Simplified cost estimation
        model_costs = {
            'claude-3-5-sonnet-20241022': {'input': 0.003, 'output': 0.015},  # per 1k tokens
            'claude-3-opus-20240229': {'input': 0.015, 'output': 0.075},
            'gpt-4-turbo-preview': {'input': 0.01, 'output': 0.03},
            'gpt-3.5-turbo': {'input': 0.0005, 'output': 0.0015}
        }

        model = agent_config.model
        base_cost = model_costs.get(model, {'input': 0.001, 'output': 0.002})

        # Estimate tokens (rough approximation)
        instruction_tokens = sum(len(inst.split()) * 1.3 for inst in agent_config.instructions)
        estimated_input_tokens = instruction_tokens + 500  # Base overhead
        estimated_output_tokens = 1000  # Average response

        total_cost = (
            (estimated_input_tokens / 1000) * base_cost['input'] +
            (estimated_output_tokens / 1000) * base_cost['output']
        )

        return {
            'estimated_input_tokens': int(estimated_input_tokens),
            'estimated_output_tokens': int(estimated_output_tokens),
            'estimated_cost_usd': round(total_cost, 4),
            'model': model
        }

    def _estimate_duration(self, agent_config: AgentConfig) -> int:
        """Estimate execution duration in milliseconds"""
        # Base duration
        duration = 500

        # Add duration per action
        action_durations = {
            'ai_call': 3000,
            'http_request': 1000,
            'database': 200,
            'file_ops': 100,
            'email': 2000,
            'slack': 1000
        }

        for action in agent_config.actions:
            duration += action_durations.get(action.type, 500)

        # Add duration per condition
        duration += len(agent_config.conditions) * 50

        return duration

    def _identify_potential_issues(self, agent_config: AgentConfig) -> list:
        """Identify potential issues in agent configuration"""
        issues = []

        # Check for missing error handling
        has_retry_config = any(action.retry_config for action in agent_config.actions)
        if not has_retry_config:
            issues.append({
                'severity': 'warning',
                'message': 'No retry configuration found - consider adding error handling'
            })

        # Check instruction clarity
        if agent_config.instructions:
            avg_instruction_length = sum(len(inst) for inst in agent_config.instructions) / len(agent_config.instructions)
            if avg_instruction_length < 20:
                issues.append({
                    'severity': 'warning',
                    'message': 'Instructions are brief - consider adding more detail'
                })

        # Check for orphaned conditions
        if agent_config.conditions and not agent_config.actions:
            issues.append({
                'severity': 'error',
                'message': 'Conditions defined but no actions to execute'
            })

        # Check for security issues
        for action in agent_config.actions:
            if action.type == 'http_request':
                if not action.config.get('timeout'):
                    issues.append({
                        'severity': 'info',
                        'message': f'Action {action.name}: Consider setting a timeout for HTTP requests'
                    })

        # Check model appropriateness
        if 'gpt-3.5-turbo' in agent_config.model:
            if len(agent_config.instructions) > 5:
                issues.append({
                    'severity': 'info',
                    'message': 'Complex instructions with GPT-3.5 - consider using GPT-4 or Claude'
                })

        return issues
