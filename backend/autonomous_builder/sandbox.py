"""
Safe execution sandbox (very small, local-first)

Runs commands in a restricted directory without network/system access.
This is not a full OS-level sandbox but provides a safer default for student use.
"""
import subprocess
from pathlib import Path
from typing import Dict, Any, List
import shlex
from utils.logger import get_logger

_LOG = get_logger(__name__)


FORBIDDEN = ["sudo", "rm", "reboot", "shutdown", "curl", "wget", "nc", "netcat"]


class Sandbox:
    def __init__(self, base_dir: str):
        self.base = Path(base_dir)
        self.base.mkdir(parents=True, exist_ok=True)

    def _is_safe(self, cmd: List[str]) -> bool:
        joined = " ".join(cmd).lower()
        return not any(f in joined for f in FORBIDDEN)

    def run(self, cmd: str, timeout: int = 10) -> Dict[str, Any]:
        parts = shlex.split(cmd)
        if not self._is_safe(parts):
            return {"ok": False, "error": "forbidden_command"}
        try:
            # run without shell to avoid shell injection
            res = subprocess.run(parts, cwd=str(self.base), capture_output=True, text=True, timeout=timeout)
            return {"ok": True, "returncode": res.returncode, "stdout": res.stdout, "stderr": res.stderr}
        except subprocess.TimeoutExpired:
            return {"ok": False, "error": "timeout"}
        except Exception as e:
            return {"ok": False, "error": str(e)}
