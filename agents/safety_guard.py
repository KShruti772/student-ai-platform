"""Safety guard for browser automation.

Implements domain whitelisting, dangerous-action blocking, and approval checkpoints.
Designed to be used by `BrowserController` and research agents.
"""
from typing import List, Dict
from pathlib import Path
import json

from utils.logger import get_logger

_LOG = get_logger(__name__)

APPROVALS_DIR = Path("data/approvals")
APPROVALS_DIR.mkdir(parents=True, exist_ok=True)


class SafetyGuard:
    def __init__(self, whitelist: List[str] = None, block_patterns: List[str] = None):
        # domains or domain prefixes allowed
        self.whitelist = whitelist or ["example.com", "github.com", "docs.python.org", "numpy.org"]
        self.block_patterns = block_patterns or ["rm -rf", "sudo", "dd if="]

    def is_allowed_domain(self, url: str) -> bool:
        lower = url.lower()
        for d in self.whitelist:
            if d in lower:
                return True
        return False

    def is_dangerous_action(self, command: str) -> bool:
        for p in self.block_patterns:
            if p in command:
                return True
        return False

    def create_approval(self, reason: str, metadata: Dict = None) -> str:
        """Create a simple approval record on disk and return its id."""
        import uuid
        aid = str(uuid.uuid4())
        rec = {"id": aid, "reason": reason, "metadata": metadata or {}, "status": "pending"}
        (APPROVALS_DIR / f"{aid}.json").write_text(json.dumps(rec), encoding="utf-8")
        _LOG.info("Created approval %s", aid)
        return aid

    def approve(self, aid: str):
        p = APPROVALS_DIR / f"{aid}.json"
        if not p.exists():
            return False
        data = json.loads(p.read_text(encoding="utf-8"))
        data["status"] = "approved"
        p.write_text(json.dumps(data), encoding="utf-8")
        return True

    def reject(self, aid: str):
        p = APPROVALS_DIR / f"{aid}.json"
        if not p.exists():
            return False
        data = json.loads(p.read_text(encoding="utf-8"))
        data["status"] = "rejected"
        p.write_text(json.dumps(data), encoding="utf-8")
        return True
