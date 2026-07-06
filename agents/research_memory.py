"""Simple semantic research memory using sentence-transformers embeddings.

Stores short document summaries with embeddings on disk and supports semantic
search via cosine similarity. This is a lightweight, local-first memory store
for research results.
"""
import json
from pathlib import Path
from typing import List, Dict, Any, Optional
import numpy as np

from utils.logger import get_logger

_LOG = get_logger(__name__)
MEM_DIR = Path("data/research_memory")
MEM_DIR.mkdir(parents=True, exist_ok=True)

try:
    from sentence_transformers import SentenceTransformer
    S_MODEL = SentenceTransformer("all-MiniLM-L6-v2")
except Exception:
    S_MODEL = None


class ResearchMemory:
    def __init__(self):
        self.dir = MEM_DIR

    def _path(self, key: str) -> Path:
        return self.dir / f"{key}.json"

    def add(self, key: str, text: str, metadata: Dict[str, Any] = None):
        emb = None
        if S_MODEL is not None:
            emb = S_MODEL.encode([text], show_progress_bar=False)[0].tolist()
        rec = {"key": key, "text": text, "metadata": metadata or {}, "embedding": emb}
        self._path(key).write_text(json.dumps(rec), encoding="utf-8")

    def list_keys(self) -> List[str]:
        return [p.stem for p in self.dir.glob('*.json')]

    def get(self, key: str) -> Optional[Dict[str, Any]]:
        p = self._path(key)
        if not p.exists():
            return None
        return json.loads(p.read_text(encoding="utf-8"))

    def search(self, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        if S_MODEL is None:
            return []
        qv = S_MODEL.encode([query], show_progress_bar=False)[0]
        results = []
        for p in self.dir.glob('*.json'):
            try:
                rec = json.loads(p.read_text(encoding="utf-8"))
                if not rec.get('embedding'):
                    continue
                ev = np.array(rec['embedding'], dtype=float)
                score = float(np.dot(qv, ev) / (np.linalg.norm(qv) * np.linalg.norm(ev) + 1e-9))
                results.append({"key": rec['key'], "score": score, "text": rec['text'], "metadata": rec['metadata']})
            except Exception:
                continue
        results = sorted(results, key=lambda r: r['score'], reverse=True)[:top_k]
        return results
