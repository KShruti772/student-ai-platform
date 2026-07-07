from typing import Any

from utils.logger import get_logger

logger = get_logger(__name__)


DEFAULT_WORKFLOW_RESPONSE: dict[str, Any] = {
    "nodes": [],
    "edges": [],
    "status": "idle",
    "progress": 0,
}


async def get_workflow() -> dict[str, Any]:
    from .workflow_runner import default_graph

    try:
        payload = default_graph()
        if not isinstance(payload, dict):
            raise TypeError("workflow payload must be a dict")

        nodes = []
        for node in payload.get("nodes") or []:
            if not isinstance(node, dict):
                continue
            node_id = node.get("id") or ""
            data_payload = node.get("data") or {}
            if not isinstance(data_payload, dict):
                data_payload = {"value": data_payload}
            label = node.get("label") or data_payload.get("label") or node_id
            nodes.append(
                {
                    "id": node_id,
                    "label": label,
                    "data": {"label": label, **data_payload},
                }
            )

        edges = []
        for edge in payload.get("edges") or []:
            if isinstance(edge, dict):
                edges.append({"source": edge.get("source", ""), "target": edge.get("target", "")})

        status = payload.get("status") or "idle"
        progress = payload.get("progress", 0)
        return {
            "nodes": nodes,
            "edges": edges,
            "status": str(status),
            "progress": int(progress) if isinstance(progress, int) else 0,
        }
    except Exception:
        logger.exception("Workflow payload generation failed; returning default workflow response")
        return DEFAULT_WORKFLOW_RESPONSE.copy()
