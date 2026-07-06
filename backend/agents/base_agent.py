"""
Base Agent interface and simple utilities for multi-agent system.

Agents implement `run_task(task_dict, context)` and return a dict result.
"""
from typing import Dict, Any


class BaseAgent:
    """Lightweight base class for agents to inherit from."""

    name: str = "base"

    def __init__(self):
        pass

    def run_task(self, task: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a task and return a result dict. Override in subclasses."""
        raise NotImplementedError()
