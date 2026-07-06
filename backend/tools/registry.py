"""Central ToolRegistry used by the execution system."""
from typing import Callable, Dict, Any


class ToolRegistry:
    def __init__(self):
        self.tools: Dict[str, Callable[..., Any]] = {}

    def register(self, name: str, fn: Callable[..., Any]):
        self.tools[name] = fn

    def get(self, name: str):
        return self.tools.get(name)

    def list_tools(self):
        return list(self.tools.keys())

    def call(self, name: str, *args, **kwargs):
        fn = self.get(name)
        if not fn:
            raise KeyError(f"Tool {name} not found")
        return fn(*args, **kwargs)

registry = ToolRegistry()
