from fastapi import APIRouter, Request, HTTPException
from ..schemas.session import TimelineResponse
from ..services import session as session_service
from utils.logger import get_logger

router = APIRouter()
_LOG = get_logger(__name__)


@router.get("/session/{session_id}")
async def get_session(req: Request, session_id: str):
    pm = getattr(req.app.state, "persistent_memory", None)
    if pm is None:
        _LOG.info("Persistent memory not available for get_session %s", session_id)
        return {"session_id": session_id}
    try:
        data = pm.get_session(session_id)
        return data
    except Exception as e:
        _LOG.exception("Error reading session %s: %s", session_id, e)
        raise HTTPException(status_code=500, detail="failed to read session")


@router.get("/session/{session_id}/timeline", response_model=TimelineResponse)
async def get_timeline(req: Request, session_id: str):
    try:
        res = session_service.get_session_timeline(req.app, session_id)
        return res
    except Exception as e:
        _LOG.exception("Failed to get timeline for %s: %s", session_id, e)
        # safe fallback
        return {"session_id": session_id, "events": []}


@router.get("/session/{session_id}/metrics")
async def get_metrics(req: Request, session_id: str):
    pm = getattr(req.app.state, "persistent_memory", None)
    if pm is None:
        _LOG.info("Persistent memory not available for get_metrics %s", session_id)
        return {}
    try:
        data = pm.get_session(session_id)
        return data.get("metrics", {})
    except Exception as e:
        _LOG.exception("Error reading metrics for %s: %s", session_id, e)
        return {}


@router.get("/session/{session_id}/workflow")
async def get_workflow(req: Request, session_id: str):
    pm = getattr(req.app.state, "persistent_memory", None)
    if pm is None:
        _LOG.info("Persistent memory not available for get_workflow %s", session_id)
        return []
    try:
        data = pm.get_session(session_id)
        return data.get("workflow_history", [])
    except Exception as e:
        _LOG.exception("Error reading workflow for %s: %s", session_id, e)
        return []


@router.get("/session/{session_id}/replay")
async def get_replay(req: Request, session_id: str):
    eb = getattr(req.app.state, "event_bus", None)
    pm = getattr(req.app.state, "persistent_memory", None)
    if pm is None:
        _LOG.info("Persistent memory not available for get_replay %s", session_id)
        return {"events": [], "messages": []}
    try:
        data = pm.get_session(session_id)
        return {"events": data.get("events", []), "messages": data.get("messages", [])}
    except Exception as e:
        _LOG.exception("Error reading replay for %s: %s", session_id, e)
        return {"events": [], "messages": []}
