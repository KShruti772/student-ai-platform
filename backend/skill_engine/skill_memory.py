"""
Skill Memory: track used skills and workflow history per session.

Stores JSON files under `data/skill_history/` to keep a lightweight local
record of what skills were activated and when. This supports later learning
and audit trails for students.
"""
from pathlib import Path
from typing import Dict, Any
import json
from utils.logger import get_logger

_LOG = get_logger(__name__)


class SkillMemory:
    def __init__(self, storage_dir: str = None):
        self.storage = Path(storage_dir or (Path.cwd() / "data" / "skill_history"))
        self.storage.mkdir(parents=True, exist_ok=True)

    def _path(self, session_id: str) -> Path:
        return self.storage / f"skill_history_{session_id}.json"

    def append(self, session_id: str, record: Dict[str, Any]) -> Dict[str, Any]:
        p = self._path(session_id)
        data = []
        if p.exists():
            try:
                data = json.loads(p.read_text(encoding="utf-8"))
            except Exception:
                data = []
        data.append(record)
        p.write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")
        _LOG.info("Appended skill usage for session %s", session_id)
        return {"path": str(p)}

    def load(self, session_id: str):
        p = self._path(session_id)
        if not p.exists():
            return []
        try:
            return json.loads(p.read_text(encoding="utf-8"))
        except Exception:
            return []
