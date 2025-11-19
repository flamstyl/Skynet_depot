#!/usr/bin/env python3
"""
Test Agent - MCP Forge
Comprehensive testing for agent configurations
"""

import json
import yaml
import sys
from typing import Dict, List, Any, Tuple


class AgentTester:
    def __init__(self, config_path: str = None, config_data: Dict = None):
        """Initialize tester with config file or dict"""
        if config_path:
            self.config = self.load_config(config_path)
        elif config_data:
            self.config = config_data
        else:
            raise ValueError("Either config_path or config_data must be provided")

        self.errors: List[str] = []
        self.warnings: List[str] = []
        self.passed: List[str] = []

    def load_config(self, path: str) -> Dict:
        """Load agent configuration from YAML or JSON"""
        with open(path, 'r') as f:
            if path.endswith('.yaml') or path.endswith('.yml'):
                return yaml.safe_load(f)
            elif path.endswith('.json'):
                return json.load(f)
            else:
                raise ValueError(f"Unsupported file format: {path}")

    def run_all_tests(self) -> Dict[str, Any]:
        """Run all tests"""
        print("🧪 Running agent tests...\n")

        self.test_structure()
        self.test_triggers()
        self.test_cycles()
        self.test_memory()
        self.test_processing()
        self.test_outputs()

        return self.generate_report()

    def test_structure(self) -> bool:
        """Test basic structure"""
        print("📋 Testing structure...")

        required_fields = ['name', 'version', 'model']

        for field in required_fields:
            if field not in self.config:
                self.errors.append(f"Missing required field: {field}")
            else:
                self.passed.append(f"Has required field: {field}")

        # Test model validity
        valid_models = [
            'claude-sonnet-4',
            'claude-opus-4',
            'gpt-4',
            'gpt-4-turbo',
            'gemini-pro',
            'codestral-latest'
        ]

        if 'model' in self.config:
            model = self.config['model']
            if not any(vm in model for vm in valid_models):
                self.warnings.append(f"Unknown model: {model}")
            else:
                self.passed.append(f"Valid model: {model}")

        return len(self.errors) == 0

    def test_triggers(self) -> bool:
        """Test trigger configuration"""
        print("⏰ Testing triggers...")

        if 'triggers' not in self.config:
            self.warnings.append("No triggers defined - manual invocation required")
            return True

        triggers = self.config['triggers']

        if not isinstance(triggers, list):
            self.errors.append("Triggers must be a list")
            return False

        for idx, trigger in enumerate(triggers):
            trigger_type = trigger.get('type', 'unknown')

            if trigger_type == 'cron':
                if 'schedule' not in trigger:
                    self.errors.append(f"Trigger {idx}: cron missing schedule")
                else:
                    self.passed.append(f"Trigger {idx}: cron schedule OK")

            elif trigger_type == 'folder_watch':
                if 'path' not in trigger:
                    self.errors.append(f"Trigger {idx}: folder_watch missing path")
                else:
                    self.passed.append(f"Trigger {idx}: folder_watch path OK")

            elif trigger_type == 'api':
                if 'path' not in trigger:
                    self.errors.append(f"Trigger {idx}: api missing path")
                else:
                    self.passed.append(f"Trigger {idx}: api path OK")

        return len(self.errors) == 0

    def test_cycles(self, max_iterations: int = 100) -> bool:
        """Test cycles for infinite loops"""
        print("🔁 Testing cycles...")

        if 'cycles' not in self.config:
            self.passed.append("No cycles defined")
            return True

        cycles = self.config['cycles']

        for idx, cycle in enumerate(cycles):
            if 'name' not in cycle:
                self.warnings.append(f"Cycle {idx}: missing name")

            if 'steps' in cycle:
                steps = cycle['steps']
                if len(steps) == 0:
                    self.warnings.append(f"Cycle {idx}: no steps defined")
                elif len(steps) > max_iterations:
                    self.warnings.append(f"Cycle {idx}: {len(steps)} steps (may be slow)")
                else:
                    self.passed.append(f"Cycle {idx}: {len(steps)} steps OK")

        return True

    def test_memory(self) -> bool:
        """Test memory configuration"""
        print("💾 Testing memory...")

        if 'memory' not in self.config:
            self.warnings.append("No memory configuration")
            return True

        memory = self.config['memory']

        if 'type' not in memory:
            self.errors.append("Memory missing type")
        else:
            memory_type = memory['type']
            if memory_type not in ['persistent', 'temporary', 'shared']:
                self.warnings.append(f"Unknown memory type: {memory_type}")
            else:
                self.passed.append(f"Memory type: {memory_type}")

        if memory.get('type') == 'persistent' and 'path' not in memory:
            self.warnings.append("Persistent memory missing path")

        return len(self.errors) == 0

    def test_processing(self) -> bool:
        """Test processing configuration"""
        print("⚙️ Testing processing...")

        if 'processing' not in self.config:
            self.warnings.append("No processing configuration")
            return True

        processing = self.config['processing']

        # Test role/prompt
        if 'role' not in processing:
            self.warnings.append("Processing missing role/prompt")
        else:
            role_length = len(processing['role'])
            if role_length < 10:
                self.warnings.append(f"Role very short ({role_length} chars)")
            else:
                self.passed.append(f"Role defined ({role_length} chars)")

        # Test temperature
        if 'temperature' in processing:
            temp = processing['temperature']
            if temp < 0 or temp > 2:
                self.warnings.append(f"Temperature out of range: {temp}")
            else:
                self.passed.append(f"Temperature: {temp}")

        # Test max_tokens
        if 'max_tokens' in processing:
            max_tokens = processing['max_tokens']
            if max_tokens > 100000:
                self.warnings.append(f"Very high max_tokens: {max_tokens}")
            else:
                self.passed.append(f"Max tokens: {max_tokens}")

        return True

    def test_outputs(self) -> bool:
        """Test output configuration"""
        print("📤 Testing outputs...")

        if 'outputs' not in self.config:
            self.warnings.append("No outputs defined")
            return True

        outputs = self.config['outputs']

        for idx, output in enumerate(outputs):
            output_type = output.get('type', 'unknown')

            if output_type == 'drive' and 'path' not in output:
                self.errors.append(f"Output {idx}: drive missing path")
            elif output_type == 'webhook' and 'url' not in output:
                self.errors.append(f"Output {idx}: webhook missing url")
            elif output_type == 'log' and 'path' not in output:
                self.warnings.append(f"Output {idx}: log missing path")
            else:
                self.passed.append(f"Output {idx}: {output_type} OK")

        return len(self.errors) == 0

    def generate_report(self) -> Dict[str, Any]:
        """Generate test report"""
        total_tests = len(self.passed) + len(self.errors) + len(self.warnings)
        success = len(self.errors) == 0

        print("\n" + "="*60)
        print("📊 TEST REPORT")
        print("="*60)
        print(f"Total tests: {total_tests}")
        print(f"✅ Passed: {len(self.passed)}")
        print(f"⚠️  Warnings: {len(self.warnings)}")
        print(f"❌ Errors: {len(self.errors)}")
        print(f"\nStatus: {'SUCCESS' if success else 'FAILED'}")
        print("="*60)

        if self.errors:
            print("\n❌ ERRORS:")
            for error in self.errors:
                print(f"  - {error}")

        if self.warnings:
            print("\n⚠️  WARNINGS:")
            for warning in self.warnings:
                print(f"  - {warning}")

        return {
            'success': success,
            'total_tests': total_tests,
            'passed': len(self.passed),
            'warnings': len(self.warnings),
            'errors': len(self.errors),
            'details': {
                'passed': self.passed,
                'warnings': self.warnings,
                'errors': self.errors
            }
        }


def main():
    """Main entry point"""
    if len(sys.argv) < 2:
        print("Usage: python test_agent.py <config_file.yaml|config_file.json>")
        sys.exit(1)

    config_path = sys.argv[1]

    tester = AgentTester(config_path=config_path)
    report = tester.run_all_tests()

    # Exit with error code if tests failed
    sys.exit(0 if report['success'] else 1)


if __name__ == '__main__':
    main()
