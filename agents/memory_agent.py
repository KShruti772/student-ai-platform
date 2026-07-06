"""MemoryAgent: stores user progress, conversations, and plans.

Uses a simple file-backed JSON store per user/project to keep things local
and auditable. Provides semantic retrieval via ResearchMemory when available.
"""
import json
from pathlib import Path
from typing import Dict, Any, List, Optional
from .logger import get_logger
from .research_memory import ResearchMemory

_LOG = get_logger(__name__)
MEM_ROOT = Path('data/memory')
MEM_ROOT.mkdir(parents=True, exist_ok=True)


class MemoryAgent:
    def __init__(self, namespace: str = 'global'):
        self.ns = namespace
        self.path = MEM_ROOT / f"{self.ns}.json"
        self._data: Dict[str, Any] = {'conversations': [], 'plans': [], 'progress': {}}
        self._load()
        self.semantic = ResearchMemory()

    def _load(self):
        if self.path.exists():
            try:
                self._data = json.loads(self.path.read_text(encoding='utf-8'))
            except Exception:
                _LOG.warning('Failed to load memory file; starting fresh')

    def _save(self):
        self.path.write_text(json.dumps(self._data, indent=2), encoding='utf-8')

    def add_conversation(self, msg: Dict[str, Any]):
        self._data['conversations'].append(msg)
        self._save()

    def add_plan(self, plan: Dict[str, Any]):
        self._data['plans'].append(plan)
        self._save()

    def update_progress(self, key: str, value: Any):
        self._data['progress'][key] = value
        self._save()

    def list_plans(self) -> List[Dict[str, Any]]:
        return self._data.get('plans', [])

    def semantic_add(self, key: str, text: str, metadata: Optional[Dict[str, Any]] = None):
        self.semantic.add(key, text, metadata or {})

    def semantic_search(self, query: str, top_k: int = 5):
        return self.semantic.search(query, top_k=top_k)
"""Memory Agent: store student progress using FAISS or simple in-memory store"""
from typing import Dict, Any, List, Tuple
from .base_agent import BaseAgent
from .logger import get_logger
import os

_LOG = get_logger(__name__)


class SimpleMemory:
    def __init__(self):
        self.items: List[Tuple[str, Dict[str, Any]]] = []

    def add(self, key: str, data: Dict[str, Any]):
        self.items.append((key, data))

    def query(self, prefix: str = "") -> List[Dict[str, Any]]:
        return [d for k, d in self.items if prefix in k]


class MemoryAgent(BaseAgent):
    def __init__(self, store=None):
        super().__init__("MemoryAgent")
        self.store = store or SimpleMemory()

    async def handle(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        action = payload.get("action")
        if action == "save":
            key = payload.get("key") or str(len(self.store.items))
            data = payload.get("data", {})
            self.store.add(key, data)
            return {"saved": True, "key": key}
        elif action == "query":
            q = payload.get("q", "")
            res = self.store.query(q)
            return {"results": res}
        else:
            return {"error": "unknown_action"}
