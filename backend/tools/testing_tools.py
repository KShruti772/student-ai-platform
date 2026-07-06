"""Testing tools: run test commands safely via Sandbox and return structured output."""
from typing import Dict, Any
from autonomous_builder.sandbox import Sandbox
from utils.logger import get_logger

_LOG = get_logger(__name__)


class TestingTools:
    def __init__(self, base_dir: str = "workspaces"):
        self.base_dir = base_dir

    def run_tests(self, workspace: str, cmd: str = "pytest -q", timeout: int = 30) -> Dict[str, Any]:
        sb = Sandbox(f"{self.base_dir}/{workspace}")
        res = sb.run(cmd, timeout=timeout)
        return {"ok": True, "result": res}
