"""
Tool registry for skills to access safe, audited tool functions.

Tools are registered with metadata and can be looked up by skills.
This registry is lightweight and supports dynamic registration/unregistration.
"""
from typing import Callable, Dict, Any
from utils.logger import get_logger

_LOG = get_logger(__name__)


class ToolSpec:
    def __init__(self, name: str, func: Callable, description: str = ""):
        self.name = name
        self.func = func
        self.description = description


class ToolRegistry:
    def __init__(self):
        self._tools: Dict[str, ToolSpec] = {}

    def register(self, name: str, func: Callable, description: str = ""):
        _LOG.info("Registering tool %s", name)
        self._tools[name] = ToolSpec(name, func, description)

    def unregister(self, name: str):
        if name in self._tools:
            _LOG.info("Unregistering tool %s", name)
            del self._tools[name]

    def get(self, name: str) -> ToolSpec:
        return self._tools.get(name)

    def list_tools(self) -> Dict[str, str]:
        return {n: t.description for n, t in self._tools.items()}
