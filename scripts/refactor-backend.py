#!/usr/bin/env python3

import os
import sys
import subprocess
import argparse
from pathlib import Path
from typing import Dict, List, Tuple

BACKEND_DIR = Path(__file__).parent.parent / "server"

class BackendRefactorTool:
    """KEEPSAKE Backend Refactor Tool for Flask/Python codebase"""

    def __init__(self):
        self.results = {}
        self.tasks = {
            'format': {
                'name': 'Black Code Formatter',
                'command': ['black', '.', '--line-length=100'],
                'description': 'Format Python code with Black'
            },
            'isort': {
                'name': 'Sort Imports',
                'command': ['isort', '.', '--profile', 'black'],
                'description': 'Sort and organize imports'
            },
            'flake8': {
                'name': 'Flake8 Linting',
                'command': ['flake8', '.', '--max-line-length=100', '--exclude=venv,__pycache__'],
                'description': 'Check code style with Flake8'
            },
            'pylint': {
                'name': 'Pylint Analysis',
                'command': ['pylint', 'routes', 'utils', '--max-line-length=100', '--disable=C0114,C0115,C0116'],
                'description': 'Advanced code analysis with Pylint'
            },
            'mypy': {
                'name': 'Type Checking',
                'command': ['mypy', '.', '--ignore-missing-imports'],
                'description': 'Static type checking with mypy'
            },
            'security': {
                'name': 'Security Scan',
                'command': ['bandit', '-r', '.', '-x', './venv/*'],
                'description': 'Security vulnerability scanning'
            },
            'complexity': {
                'name': 'Complexity Analysis',
                'command': ['radon', 'cc', '.', '-s', '-e', 'venv/*'],
                'description': 'Cyclomatic complexity analysis'
            },
            'dead_code': {
                'name': 'Dead Code Detection',
                'command': ['vulture', '.', '--exclude=venv'],
                'description': 'Find unused code'
            },
            'docstrings': {
                'name': 'Docstring Coverage',
                'command': ['interrogate', '-v', '.', '--exclude=venv'],
                'description': 'Check docstring coverage'
            },
            'requirements': {
                'name': 'Requirements Check',
                'command': ['pip-compile', '--upgrade', 'requirements.in'],
                'description': 'Update and optimize requirements'
            },
            'autofix': {
                'name': 'Auto-fix Issues',
                'command': ['autopep8', '--in-place', '--recursive', '--max-line-length=100', '.'],
                'description': 'Automatically fix PEP8 issues'
            },
            'test_coverage': {
                'name': 'Test Coverage',
                'command': ['pytest', '--cov=.', '--cov-report=term-missing'],
                'description': 'Run tests with coverage report'
            }
        }

    def run_task(self, task_key: str) -> bool:
        """Run a single refactor task"""
        task = self.tasks.get(task_key)
        if not task:
            print(f"❌ Unknown task: {task_key}")
            return False

        print(f"\n🔄 {task['name']}: {task['description']}")

        try:
            # Check if the tool is installed
            tool_name = task['command'][0]
            check_cmd = ['python', '-m', tool_name, '--version'] if tool_name not in ['radon', 'vulture'] else [tool_name, '--version']

            try:
                subprocess.run(check_cmd, capture_output=True, check=False, cwd=BACKEND_DIR)
            except FileNotFoundError:
                print(f"⚠️  {tool_name} not installed. Installing...")
                subprocess.run(['pip', 'install', tool_name], cwd=BACKEND_DIR)

            # Run the actual command
            result = subprocess.run(
                task['command'],
                cwd=BACKEND_DIR,
                capture_output=True,
                text=True
            )

            if result.stdout:
                print(result.stdout)
            if result.stderr and result.returncode != 0:
                print(f"⚠️  Warnings/Errors:\n{result.stderr}")

            print(f"✅ {task['name']} completed")
            return True

        except Exception as e:
            print(f"❌ {task['name']} failed: {str(e)}")
            return False

    def run_all_tasks(self) -> None:
        """Run all refactor tasks"""
        print("Running all refactor tasks...\n")

        for task_key in self.tasks.keys():
            self.results[task_key] = self.run_task(task_key)

        self.print_summary()

    def run_essential_tasks(self) -> None:
        """Run essential refactor tasks (format, isort, flake8)"""
        essential = ['format', 'isort', 'flake8', 'autofix']
        print("Running essential refactor tasks...\n")

        for task_key in essential:
            self.results[task_key] = self.run_task(task_key)

        self.print_summary()

    def run_quality_tasks(self) -> None:
        """Run code quality tasks"""
        quality = ['pylint', 'mypy', 'complexity', 'dead_code', 'docstrings']
        print("Running code quality tasks...\n")

        for task_key in quality:
            self.results[task_key] = self.run_task(task_key)

        self.print_summary()

    def print_summary(self) -> None:
        """Print summary of refactor results"""
        if not self.results:
            return

        print("\n📊 Refactor Summary:")
        print("─" * 40)

        success_count = sum(1 for v in self.results.values() if v)
        fail_count = len(self.results) - success_count

        for task_key, success in self.results.items():
            status = "✅" if success else "❌"
            print(f"{status} {self.tasks[task_key]['name']}")

        print("─" * 40)
        print(f"Total: {success_count} succeeded, {fail_count} failed")

    def interactive_mode(self) -> None:
        """Run in interactive mode"""
        print("🔧 KEEPSAKE Backend Refactor Tool\n")
        print("Select refactor tasks to run:\n")

        task_keys = list(self.tasks.keys())
        for i, key in enumerate(task_keys, 1):
            task = self.tasks[key]
            print(f"{i}. {task['name']} - {task['description']}")

        print("\n0. Run all tasks")
        print("e. Run essential tasks (format, isort, flake8)")
        print("q. Run quality checks")
        print("x. Exit\n")

        choice = input("Enter your choice: ").strip().lower()

        if choice == 'x':
            print("Exiting...")
            return
        elif choice == '0':
            self.run_all_tasks()
        elif choice == 'e':
            self.run_essential_tasks()
        elif choice == 'q':
            self.run_quality_tasks()
        else:
            try:
                idx = int(choice) - 1
                if 0 <= idx < len(task_keys):
                    task_key = task_keys[idx]
                    self.results[task_key] = self.run_task(task_key)
                    self.print_summary()
                else:
                    print("Invalid choice")
            except ValueError:
                print("Invalid choice")

    def analyze_codebase(self) -> None:
        """Analyze the codebase and provide recommendations"""
        print("\n🔍 Analyzing KEEPSAKE Backend Codebase...\n")

        # Count files
        py_files = list(BACKEND_DIR.rglob("*.py"))
        py_files = [f for f in py_files if "venv" not in str(f) and "__pycache__" not in str(f)]

        print(f"📁 Python files: {len(py_files)}")

        # Check for configuration files
        config_files = {
            '.flake8': 'Flake8 configuration',
            'pyproject.toml': 'Python project configuration',
            '.pylintrc': 'Pylint configuration',
            'setup.cfg': 'Setup configuration',
            'mypy.ini': 'MyPy configuration',
            '.pre-commit-config.yaml': 'Pre-commit hooks'
        }

        print("\n📋 Configuration files:")
        for file, desc in config_files.items():
            exists = (BACKEND_DIR / file).exists()
            status = "✅" if exists else "❌"
            print(f"  {status} {file} - {desc}")

        # Check installed tools
        print("\n🛠️  Development tools:")
        tools = ['black', 'isort', 'flake8', 'pylint', 'mypy', 'bandit', 'pytest']
        for tool in tools:
            try:
                subprocess.run([tool, '--version'], capture_output=True, check=False)
                print(f"  ✅ {tool} installed")
            except FileNotFoundError:
                print(f"  ❌ {tool} not installed")

        print("\n💡 Recommendations:")
        if not (BACKEND_DIR / '.flake8').exists():
            print("  - Create .flake8 configuration file")
        if not (BACKEND_DIR / 'pyproject.toml').exists():
            print("  - Create pyproject.toml for modern Python packaging")
        if not (BACKEND_DIR / '.pre-commit-config.yaml').exists():
            print("  - Set up pre-commit hooks for automated checks")

        # Check for common issues
        print("\n⚠️  Potential issues to address:")

        # Check for hardcoded secrets
        secret_patterns = ['password', 'secret', 'token', 'api_key']
        for pattern in secret_patterns:
            files_with_secrets = []
            for py_file in py_files[:10]:  # Check first 10 files as sample
                try:
                    content = py_file.read_text()
                    if pattern in content.lower():
                        files_with_secrets.append(py_file.name)
                except Exception:
                    pass
            if files_with_secrets:
                print(f"  - Files possibly containing '{pattern}': {', '.join(files_with_secrets[:3])}")

def main():
    parser = argparse.ArgumentParser(description='KEEPSAKE Backend Refactor Tool')
    parser.add_argument('--all', action='store_true', help='Run all refactor tasks')
    parser.add_argument('--essential', action='store_true', help='Run essential tasks')
    parser.add_argument('--quality', action='store_true', help='Run quality checks')
    parser.add_argument('--analyze', action='store_true', help='Analyze codebase')
    parser.add_argument('--task', choices=['format', 'isort', 'flake8', 'pylint', 'mypy',
                                           'security', 'complexity', 'dead_code', 'docstrings',
                                           'requirements', 'autofix', 'test_coverage'],
                       help='Run specific task')

    args = parser.parse_args()
    tool = BackendRefactorTool()

    if args.all:
        tool.run_all_tasks()
    elif args.essential:
        tool.run_essential_tasks()
    elif args.quality:
        tool.run_quality_tasks()
    elif args.analyze:
        tool.analyze_codebase()
    elif args.task:
        tool.results[args.task] = tool.run_task(args.task)
        tool.print_summary()
    else:
        tool.interactive_mode()

if __name__ == "__main__":
    main()