"""
Actions Manager - Executes various actions (open apps, run commands, etc.)
"""
import os
import subprocess
import webbrowser
from typing import Dict, Any
from pathlib import Path


class ActionsManager:
    def __init__(self):
        self.plugin_actions = {}

    def execute(self, action_type: str, target: str, input_data: str = None, metadata: Dict = None) -> Dict[str, Any]:
        """Execute an action based on type"""

        try:
            if action_type == 'open':
                return self._open_target(target)
            elif action_type == 'run':
                return self._run_command(target)
            elif action_type == 'script':
                return self._run_script(target, input_data)
            elif action_type == 'plugin':
                return self._execute_plugin(target, input_data)
            elif action_type == 'system':
                return self._system_action(target)
            else:
                return {
                    'status': 'error',
                    'message': f'Unknown action type: {action_type}'
                }

        except Exception as e:
            return {
                'status': 'error',
                'message': str(e)
            }

    def _open_target(self, target: str) -> Dict[str, Any]:
        """Open a file, folder, or URL"""

        # Check if it's a URL
        if target.startswith('http://') or target.startswith('https://'):
            webbrowser.open(target)
            return {
                'status': 'success',
                'message': f'Opened URL: {target}'
            }

        # Check if it's a file or folder
        if os.path.exists(target):
            os.startfile(target)
            return {
                'status': 'success',
                'message': f'Opened: {target}'
            }

        # Try to open as application
        try:
            subprocess.Popen(target, shell=True)
            return {
                'status': 'success',
                'message': f'Launched: {target}'
            }
        except Exception as e:
            return {
                'status': 'error',
                'message': f'Failed to open: {str(e)}'
            }

    def _run_command(self, command: str) -> Dict[str, Any]:
        """Run a shell command"""

        try:
            # Run command without waiting for completion
            subprocess.Popen(
                command,
                shell=True,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )

            return {
                'status': 'success',
                'message': f'Command executed: {command}'
            }

        except Exception as e:
            return {
                'status': 'error',
                'message': f'Failed to run command: {str(e)}'
            }

    def _run_script(self, script_path: str, input_data: str = None) -> Dict[str, Any]:
        """Run a script file"""

        if not os.path.exists(script_path):
            return {
                'status': 'error',
                'message': f'Script not found: {script_path}'
            }

        try:
            ext = os.path.splitext(script_path)[1].lower()

            # Determine interpreter
            interpreters = {
                '.py': 'python',
                '.js': 'node',
                '.ps1': 'powershell',
                '.bat': 'cmd /c',
                '.sh': 'bash'
            }

            interpreter = interpreters.get(ext)

            if not interpreter:
                # Try to execute directly
                subprocess.Popen(script_path, shell=True)
            else:
                command = f'{interpreter} "{script_path}"'
                if input_data:
                    command += f' {input_data}'
                subprocess.Popen(command, shell=True)

            return {
                'status': 'success',
                'message': f'Script executed: {script_path}'
            }

        except Exception as e:
            return {
                'status': 'error',
                'message': f'Failed to run script: {str(e)}'
            }

    def _execute_plugin(self, plugin_name: str, input_data: str = None) -> Dict[str, Any]:
        """Execute a plugin action"""

        if plugin_name in self.plugin_actions:
            try:
                result = self.plugin_actions[plugin_name](input_data)
                return result
            except Exception as e:
                return {
                    'status': 'error',
                    'message': f'Plugin execution failed: {str(e)}'
                }
        else:
            return {
                'status': 'error',
                'message': f'Plugin not found: {plugin_name}'
            }

    def _system_action(self, action: str) -> Dict[str, Any]:
        """Execute system actions (shutdown, restart, etc.)"""

        actions = {
            'shutdown': 'shutdown /s /t 0',
            'restart': 'shutdown /r /t 0',
            'sleep': 'rundll32.exe powrprof.dll,SetSuspendState 0,1,0',
            'lock': 'rundll32.exe user32.dll,LockWorkStation',
            'logout': 'shutdown /l'
        }

        command = actions.get(action.lower())

        if not command:
            return {
                'status': 'error',
                'message': f'Unknown system action: {action}'
            }

        try:
            subprocess.Popen(command, shell=True)
            return {
                'status': 'success',
                'message': f'System action executed: {action}'
            }
        except Exception as e:
            return {
                'status': 'error',
                'message': f'Failed to execute system action: {str(e)}'
            }

    def register_plugin_action(self, plugin_name: str, action_func):
        """Register a plugin action handler"""
        self.plugin_actions[plugin_name] = action_func

    def unregister_plugin_action(self, plugin_name: str):
        """Unregister a plugin action handler"""
        if plugin_name in self.plugin_actions:
            del self.plugin_actions[plugin_name]


# Example usage
if __name__ == '__main__':
    manager = ActionsManager()

    # Test opening notepad
    result = manager.execute('open', 'notepad.exe')
    print(result)

    # Test running command
    result = manager.execute('run', 'echo Hello from QuickLauncher')
    print(result)

    # Test system action
    # result = manager.execute('system', 'lock')
    # print(result)
