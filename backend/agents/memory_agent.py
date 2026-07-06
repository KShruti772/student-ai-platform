"""
Memory Agent

Stores and retrieves student session history and project context. This is a
lightweight local JSON-backed memory suitable for educational use.
"""
from typing import Dict, Any, Optional
from pathlib import Path
import json
from agents.base_agent import BaseAgent
from utils.logger import get_logger

_LOG = get_logger(__name__)


class MemoryAgent(BaseAgent):
    name = "memory"

    def __init__(self, storage_dir: str = None):
        super().__init__()
        self.storage_dir = Path(storage_dir or (Path.cwd() / "data" / "sessions"))
        self.storage_dir.mkdir(parents=True, exist_ok=True)

    def _path_for(self, session_id: str) -> Path:
        return self.storage_dir / f"session_{session_id}.json"

    def save(self, session_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        p = self._path_for(session_id)
        p.write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")
        _LOG.info("Saved session %s to %s", session_id, p)
        return {"path": str(p)}

    def load(self, session_id: str) -> Optional[Dict[str, Any]]:
        p = self._path_for(session_id)
        if not p.exists():
            return None
        return json.loads(p.read_text(encoding="utf-8"))

    def run_task(self, task: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        t = task.get("type")
        if t == "save":
            return self.save(task.get("session_id", "default"), task.get("data", {}))
        if t == "load":
            data = self.load(task.get("session_id", "default"))
            return {"data": data}
        return {"error": "unsupported_task"}
