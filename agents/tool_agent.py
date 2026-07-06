"""Tool Agent: manages tool execution and approval checkpoints."""
from typing import Dict, Any
from .base_agent import BaseAgent
from .logger import get_logger
from backend.tools.registry import registry
from agents.approval_agent import ApprovalAgent
import uuid
import json
from pathlib import Path

_LOG = get_logger(__name__)


class ToolAgent(BaseAgent):
    def __init__(self, approval_agent: ApprovalAgent = None):
        super().__init__("ToolAgent")
        self.approval = approval_agent or ApprovalAgent()
        self.exec_log_dir = Path("data/executions")
        self.exec_log_dir.mkdir(parents=True, exist_ok=True)

    async def handle(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        tool_name = payload.get("tool")
        action = payload.get("action") or {}
        workspace = payload.get("workspace", "")
        if not tool_name:
            return {"error": "no_tool_specified"}
        tool = registry.get(tool_name)
        if not tool:
            return {"error": "tool_not_found", "tool": tool_name}

        # Risk assessment via approval agent
        apr = await self.approval.run({"action": action, "resume_state": {"tool": tool_name, "action": action, "workspace": workspace}})
        apr_result = apr.get("result", {}) if apr.get("ok") else {}
        if apr_result.get("needs_approval"):
            req_id = apr_result.get("approval_id")
            return {"status": "paused", "approval_id": req_id}

        # execute tool and log
        try:
            res = tool(workspace=workspace, **action) if isinstance(action, dict) else tool(workspace=workspace, action=action)
        except TypeError:
            # fallback: call with single arg
            res = tool(action)
        exec_id = uuid.uuid4().hex
        record = {"id": exec_id, "tool": tool_name, "action": action, "result": res}
        (self.exec_log_dir / f"{exec_id}.json").write_text(json.dumps(record, default=str, indent=2), encoding="utf-8")
        return {"ok": True, "exec_id": exec_id, "result": res}
