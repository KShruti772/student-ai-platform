from fastapi import APIRouter, Request
from ..schemas import workflow as wf_schema
from ..services import workflow as wf_service
from ..services import workflow_runner

router = APIRouter()


@router.get("", response_model=wf_schema.WorkflowResponse)
async def get_workflow():
    return await wf_service.get_workflow()


@router.get("/templates")
async def workflow_templates():
    return {"templates": workflow_runner.list_templates()}


@router.post("/execute")
async def execute_workflow(req: Request):
    body = await req.json()
    goal = body.get("goal") or body.get("message") or ""
    template_id = body.get("template_id") or body.get("workflow_id") or body.get("template") or "project_builder"
    session_id = body.get("session_id", "default")
    event_bus = getattr(req.app.state, "event_bus", None)
    return await workflow_runner.start_workflow(template_id, goal, session_id, event_bus)


@router.get("/status/{workflow_id}")
async def workflow_status(workflow_id: str, req: Request):
    return workflow_runner.snapshot(workflow_id)


@router.post("/status/{workflow_id}/node/{node_id}/retry")
async def retry_node(workflow_id: str, node_id: str, req: Request):
    """Record a retry request for a node and emit an event for UI and persistence.

    This is best-effort: it records the retry and emits `node.retry` event with session_id if provided.
    Actual re-execution should be handled by an operator or orchestrator worker.
    """
    event_bus = getattr(req.app.state, "event_bus", None)
    return await workflow_runner.retry_step(workflow_id, node_id, event_bus)
