import time
from typing import Any, Dict
from utils.logger import get_logger

_LOG = get_logger(__name__)


def normalize_event(ev: Dict[str, Any], idx: int) -> Dict[str, Any]:
    # Normalize various event shapes into the frontend-friendly timeline event
    ev_type = ev.get("type") or ev.get("event_type") or ev.get("kind") or "message"
    title = ev.get("title") or ev.get("message") or ev.get("text") or ev.get("name") or ev_type
    ts = ev.get("ts") or ev.get("timestamp") or ev.get("time") or int(time.time() * 1000)
    status = ev.get("status") or ev.get("state") or "completed"
    return {
        "id": str(ev.get("id") or ev.get("event_id") or idx),
        "type": ev_type,
        "title": title,
        "timestamp": ts,
        "status": status,
    }


def get_timeline_from_persistent(pm, session_id: str) -> Dict[str, Any]:
    try:
        data = pm.get_session(session_id)
        events = data.get("events", []) if isinstance(data, dict) else []
        normalized = [normalize_event(e, i) for i, e in enumerate(events)]
        return {"session_id": session_id, "events": normalized}
    except Exception as e:
        _LOG.exception("Failed to read session %s from persistent memory: %s", session_id, e)
        return {"session_id": session_id, "events": []}


def generate_mock_timeline(session_id: str) -> Dict[str, Any]:
    # Lightweight mock timeline when no persistent data exists
    now = int(time.time() * 1000)
    return {
        "session_id": session_id,
        "events": [
            {"id": "1", "type": "message", "title": "Session created", "timestamp": now - 3000, "status": "completed"},
            {"id": "2", "type": "workflow", "title": "Workflow started", "timestamp": now - 2000, "status": "running"},
            {"id": "3", "type": "workflow", "title": "First task completed", "timestamp": now - 1000, "status": "completed"},
        ],
    }


def get_session_timeline(app, session_id: str) -> Dict[str, Any]:
    pm = getattr(app.state, "persistent_memory", None)
    if pm is None:
        _LOG.info("Persistent memory not available; returning mock timeline for %s", session_id)
        return generate_mock_timeline(session_id)
    # attempt to pull persisted timeline
    res = get_timeline_from_persistent(pm, session_id)
    if not res.get("events"):
        # return mock if empty to avoid empty UI
        return generate_mock_timeline(session_id)
    return res
