"""
Router: decide which agent should handle an incoming task.

This simple router uses task types and keywords to route tasks to agents.
"""
from typing import Dict, Any
from utils.logger import get_logger

_LOG = get_logger(__name__)


def route_task(task: Dict[str, Any]) -> str:
    ttype = task.get("type", "")
    text = task.get("text", "") or task.get("task", "")
    if ttype in ("generate_plan", "plan"):
        return "planner"
    if ttype in ("search", "retrieve"):
        return "research"
    if ttype in ("scaffold", "generate_code"):
        return "coding"
    if ttype in ("analyze_error", "debug"):
        return "debug"
    if ttype in ("save_memory", "load_memory", "save", "load"):
        return "memory"
    if ttype in ("run_skill",):
        return "skill"
    if ttype in ("validate",):
        return "evaluator"
    # fallback heuristics
    if any(k in text.lower() for k in ["error", "exception", "traceback"]):
        return "debug"
    if any(k in text.lower() for k in ["how", "explain", "why", "what is"]):
        return "mentor"
    return "mentor"
