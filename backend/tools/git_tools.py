"""Git tools: lightweight wrappers for git operations (read-only by default)."""
from typing import Dict, Any
from pathlib import Path
from utils.logger import get_logger
import subprocess

_LOG = get_logger(__name__)


class GitTools:
    def __init__(self, base_dir: str = "workspaces"):
        self.base = Path(base_dir)

    def _run_git(self, repo_path: str, args: list) -> Dict[str, Any]:
        p = self.base / repo_path
        try:
            res = subprocess.run(["git"] + args, cwd=str(p), capture_output=True, text=True)
            return {"ok": True, "stdout": res.stdout, "stderr": res.stderr, "code": res.returncode}
        except Exception as e:
            _LOG.exception("git command failed")
            return {"ok": False, "error": str(e)}

    def status(self, repo_path: str) -> Dict[str, Any]:
        return self._run_git(repo_path, ["status", "--porcelain"])

    def log(self, repo_path: str, n: int = 20) -> Dict[str, Any]:
        return self._run_git(repo_path, ["log", f"-n{n}", "--oneline"]) 

    def diff(self, repo_path: str) -> Dict[str, Any]:
        return self._run_git(repo_path, ["diff"])
