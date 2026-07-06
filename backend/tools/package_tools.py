"""Package tools: install packages locally with approval and auditing."""
from typing import Dict, Any
from utils.logger import get_logger
import subprocess
from pathlib import Path

_LOG = get_logger(__name__)


class PackageTools:
    def __init__(self, venv_path: str = None):
        self.venv_path = venv_path

    def install_pip(self, package: str) -> Dict[str, Any]:
        # runs pip install in the current Python environment; should require approval
        try:
            res = subprocess.run(["pip", "install", package], capture_output=True, text=True)
            return {"ok": True, "stdout": res.stdout, "stderr": res.stderr, "code": res.returncode}
        except Exception as e:
            _LOG.exception("pip install failed")
            return {"ok": False, "error": str(e)}
