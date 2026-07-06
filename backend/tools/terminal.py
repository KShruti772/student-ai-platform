"""Terminal tools: safe shell execution with validation and risk analysis."""
from typing import Dict, Any, List
from autonomous_builder.sandbox import Sandbox
from utils.logger import get_logger
import shlex
import re
import uuid
from pathlib import Path

_LOG = get_logger(__name__)

HIGH_RISK_PATTERNS = [r"rm\s+-rf", r"rm\s+-r", r"sudo", r"wget", r"curl", r"apt\s+install", r"pip\s+install", r"npm\s+install", r"systemctl", r"reboot", r"shutdown"]


class TerminalTool:
    def __init__(self, base_dir: str = "workspaces", sandbox_timeout: int = 30):
        self.base_dir = base_dir
        self.sandbox_timeout = sandbox_timeout

    def validate(self, cmd: str) -> Dict[str, Any]:
        # simple validation: do not allow dangerous tokens or pipes to remote
        parts = shlex.split(cmd)
        joined = cmd.lower()
        for pat in HIGH_RISK_PATTERNS:
            if re.search(pat, joined):
                return {"ok": False, "reason": "high_risk_pattern", "pattern": pat}
        # disallow redirects to sensitive paths
        if "/etc/" in joined or "c:\\windows" in joined:
            return {"ok": False, "reason": "sensitive_path"}
        return {"ok": True}

    def run(self, workspace: str, cmd: str, timeout: int = None) -> Dict[str, Any]:
        timeout = timeout or self.sandbox_timeout
        val = self.validate(cmd)
        if not val.get("ok"):
            _LOG.warning("Terminal validation failed: %s", val)
            return {"ok": False, "error": "validation_failed", "detail": val}
        sb = Sandbox(f"{self.base_dir}/{workspace}")
        res = sb.run(cmd, timeout=timeout)
        # attach execution id and store simple record
        exec_id = uuid.uuid4().hex
        record = {"id": exec_id, "workspace": workspace, "cmd": cmd, "result": res}
        try:
            p = Path("data/executions")
            p.mkdir(parents=True, exist_ok=True)
            (p / f"{exec_id}.json").write_text(str(record), encoding="utf-8")
        except Exception:
            _LOG.exception("Failed to write exec record")
        return {"ok": True, "exec_id": exec_id, "result": res}
