"""Testing Agent: safely runs tests in a sandboxed workspace"""
from typing import Dict, Any
from .base_agent import BaseAgent
from .logger import get_logger
import importlib

_LOG = get_logger(__name__)


def get_sandbox():
    try:
        # prefer backend sandbox if present
        mod = importlib.import_module("autonomous_builder.sandbox")
        return getattr(mod, "Sandbox")
    except Exception:
        return None


class TestingAgent(BaseAgent):
    def __init__(self):
        super().__init__("TestingAgent")
        self.Sandbox = get_sandbox()

    async def handle(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        workspace = payload.get("workspace")
        cmd = payload.get("cmd", "pytest -q")
        if not workspace:
            return {"error": "no_workspace"}
        if not self.Sandbox:
            return {"error": "no_sandbox"}
        sb = self.Sandbox(workspace)
        # run tests safely with timeout
        res = sb.run(cmd, timeout=30)
        return {"workspace": workspace, "test_result": res}
