"""Filesystem tools: create/edit/delete files, scan repository structure."""
from typing import Dict, Any, List
from pathlib import Path
from utils.logger import get_logger
import os

_LOG = get_logger(__name__)


class FileSystemTool:
    def __init__(self, base_dir: str = "workspaces"):
        self.base = Path(base_dir)
        self.base.mkdir(parents=True, exist_ok=True)

    def _abs(self, workspace: str, path: str) -> Path:
        return (self.base / workspace / path).resolve()

    def write(self, workspace: str, path: str, content: str, overwrite: bool = True) -> Dict[str, Any]:
        p = self._abs(workspace, path)
        if p.exists() and not overwrite:
            return {"ok": False, "error": "exists"}
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(content, encoding="utf-8")
        _LOG.info("Wrote %s", p)
        return {"ok": True, "path": str(p)}

    def read(self, workspace: str, path: str) -> Dict[str, Any]:
        p = self._abs(workspace, path)
        if not p.exists():
            return {"ok": False, "error": "not_found"}
        return {"ok": True, "path": str(p), "content": p.read_text(encoding="utf-8")}

    def delete(self, workspace: str, path: str) -> Dict[str, Any]:
        p = self._abs(workspace, path)
        if not p.exists():
            return {"ok": False, "error": "not_found"}
        p.unlink()
        _LOG.info("Deleted %s", p)
        return {"ok": True}

    def scan(self, workspace: str) -> Dict[str, Any]:
        root = (self.base / workspace)
        if not root.exists():
            return {"ok": False, "error": "workspace_not_found"}
        files = [str(p.relative_to(root)) for p in root.rglob("*") if p.is_file()]
        return {"ok": True, "files": files}
