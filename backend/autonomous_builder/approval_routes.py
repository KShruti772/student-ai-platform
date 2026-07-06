"""API routes to manage approvals and resume workflows"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from agents.approval_agent import ApprovalStore
from agents.orchestrator import Orchestrator
from typing import Dict, Any

router = APIRouter()
store = ApprovalStore()
orch = Orchestrator()


class ApprovalAction(BaseModel):
    approver: str
    note: str = ""


@router.get("/approvals/pending")
async def list_pending():
    return {"pending": store.list_pending()}


@router.get("/approvals/{req_id}")
async def get_approval(req_id: str):
    data = store.get(req_id)
    if not data:
        raise HTTPException(status_code=404, detail="not_found")
    return data


@router.post("/approvals/{req_id}/approve")
async def approve(req_id: str, action: ApprovalAction):
    ok = store.approve(req_id, action.approver, action.note)
    if not ok:
        raise HTTPException(status_code=404, detail="not_found")
    return {"ok": True}


@router.post("/approvals/{req_id}/reject")
async def reject(req_id: str, action: ApprovalAction):
    ok = store.reject(req_id, action.approver, action.note)
    if not ok:
        raise HTTPException(status_code=404, detail="not_found")
    return {"ok": True}


@router.post("/approvals/{req_id}/resume")
async def resume(req_id: str) -> Dict[str, Any]:
    data = store.get(req_id)
    if not data:
        raise HTTPException(status_code=404, detail="not_found")
    if data.get("status") != "approved":
        raise HTTPException(status_code=400, detail="not_approved")
    # resume_state contains minimal info to continue orchestration
    resume_state = data.get("resume_state") or {}
    # For simplicity, resume will call orchestrator.run from the saved workspace and continue
    goal = resume_state.get("task", {}).get("title", "Resume task")
    workspace = resume_state.get("workspace")
    # call orchestrator to handle the single task (simpler than reconstructing entire workflow)
    # This is an idempotent continuation for the paused test action.
    result = await orch.run(goal, workspace)
    return {"resumed": True, "result": result}
