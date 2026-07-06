"""
Workspace Manager

Manages isolated project workspaces on the local filesystem.
"""
from pathlib import Path
from typing import Dict, Any
import shutil
from utils.logger import get_logger

_LOG = get_logger(__name__)


class WorkspaceManager:
    def __init__(self, root: str = "workspaces"):
        self.root = Path(root)
        self.root.mkdir(parents=True, exist_ok=True)

    def create_workspace(self, name: str) -> Dict[str, Any]:
        path = self.root / name
        path.mkdir(parents=True, exist_ok=True)
        _LOG.info("Created workspace %s", path)
        return {"path": str(path)}

    def list_workspaces(self):
        return [p.name for p in self.root.iterdir() if p.is_dir()]

    def remove_workspace(self, name: str, recursive: bool = True) -> Dict[str, Any]:
        path = self.root / name
        if not path.exists():
            return {"ok": False, "reason": "not_found"}
        if recursive:
            shutil.rmtree(path)
        else:
            path.rmdir()
        return {"ok": True}

    def workspace_path(self, name: str) -> str:
        return str((self.root / name).resolve())
