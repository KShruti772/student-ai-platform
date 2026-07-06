"""Approval Agent and ApprovalStore

Determines risk level of actions and creates approval requests when needed.
Stores approvals in `data/approvals/` as JSON files for auditability.
"""
from typing import Dict, Any, Optional
from .base_agent import BaseAgent
from .logger import get_logger
import uuid
import json
from pathlib import Path
from datetime import datetime

_LOG = get_logger(__name__)


class ApprovalStore:
    def __init__(self, root: str = "data/approvals"):
        self.root = Path(root)
        self.root.mkdir(parents=True, exist_ok=True)

    def _path(self, req_id: str) -> Path:
        return self.root / f"{req_id}.json"

    def create(self, action: Dict[str, Any], risk: str, reason: str, resume_state: Optional[Dict[str, Any]] = None) -> str:
        req_id = uuid.uuid4().hex
        payload = {
            "id": req_id,
            "action": action,
            "risk": risk,
            "reason": reason,
            "status": "pending",
            "created_at": datetime.utcnow().isoformat(),
            "resume_state": resume_state,
            "audit": [],
        }
        p = self._path(req_id)
        p.write_text(json.dumps(payload, indent=2), encoding="utf-8")
        _LOG.info("Created approval request %s (risk=%s)", req_id, risk)
        return req_id

    def get(self, req_id: str) -> Optional[Dict[str, Any]]:
        p = self._path(req_id)
        if not p.exists():
            return None
        return json.loads(p.read_text(encoding="utf-8"))

    def list_pending(self):
        res = []
        for f in self.root.glob("*.json"):
            data = json.loads(f.read_text(encoding="utf-8"))
            if data.get("status") == "pending":
                res.append(data)
        return res

    def approve(self, req_id: str, approver: str, note: str = "") -> bool:
        data = self.get(req_id)
        if not data:
            return False
        data["status"] = "approved"
        data["approved_at"] = datetime.utcnow().isoformat()
        data["approver"] = approver
        data["note"] = note
        data.setdefault("audit", []).append({"action": "approve", "by": approver, "at": datetime.utcnow().isoformat(), "note": note})
        self._path(req_id).write_text(json.dumps(data, indent=2), encoding="utf-8")
        _LOG.info("Approval %s approved by %s", req_id, approver)
        return True

    def reject(self, req_id: str, approver: str, note: str = "") -> bool:
        data = self.get(req_id)
        if not data:
            return False
        data["status"] = "rejected"
        data["rejected_at"] = datetime.utcnow().isoformat()
        data["approver"] = approver
        data.setdefault("audit", []).append({"action": "reject", "by": approver, "at": datetime.utcnow().isoformat(), "note": note})
        self._path(req_id).write_text(json.dumps(data, indent=2), encoding="utf-8")
        _LOG.info("Approval %s rejected by %s", req_id, approver)
        return True


class ApprovalAgent(BaseAgent):
    """Analyzes actions and decides if approval is required."""

    HIGH_RISK_KEYWORDS = ["rm -rf", "rm -r", "delete file", "drop table", "drop database", "pip install", "pip3 install", "apt install", "curl", "wget", "netcat", "nc ", "subprocess", "os.system"]

    def __init__(self, store: Optional[ApprovalStore] = None):
        super().__init__("ApprovalAgent")
        self.store = store or ApprovalStore()

    def _assess_risk(self, action: Dict[str, Any]) -> str:
        a_type = action.get("type", "")
        details = str(action)
        if a_type in ("shell", "run_shell", "run_tests"):
            return "high"
        if any(k in details.lower() for k in self.HIGH_RISK_KEYWORDS):
            return "high"
        if a_type in ("db_modify", "install_package", "network_access"):
            return "high"
        # medium heuristics
        if a_type in ("write_file", "modify_file") and action.get("path"):
            # modifying project files is medium
            return "medium"
        return "low"

    async def handle(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        action = payload.get("action") or payload
        risk = self._assess_risk(action)
        needs_approval = risk in ("medium", "high")
        reason = "Requires human approval" if needs_approval else "Auto-approved"
        approval_id = None
        if needs_approval:
            # store resume_state if provided
            resume_state = payload.get("resume_state")
            approval_id = self.store.create(action, risk, reason, resume_state=resume_state)
        return {"risk": risk, "needs_approval": needs_approval, "approval_id": approval_id}
