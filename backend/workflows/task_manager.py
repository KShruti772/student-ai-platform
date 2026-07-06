"""
Task Manager

Responsible for queuing tasks, tracking status, and returning results.
This is a minimal in-memory manager suitable for local development and teaching.
"""
from typing import Dict, Any, List
from utils.logger import get_logger

_LOG = get_logger(__name__)


class TaskManager:
    def __init__(self):
        self._tasks: List[Dict[str, Any]] = []
        self._results: Dict[str, Any] = {}

    def add_task(self, task: Dict[str, Any]) -> str:
        tid = f"task_{len(self._tasks)}"
        task["id"] = tid
        task["status"] = "pending"
        self._tasks.append(task)
        _LOG.info("Added task %s", tid)
        return tid

    def get_next(self) -> Dict[str, Any]:
        for t in self._tasks:
            if t.get("status") == "pending":
                t["status"] = "in_progress"
                return t
        return None

    def complete(self, tid: str, result: Dict[str, Any]):
        self._results[tid] = result
        for t in self._tasks:
            if t.get("id") == tid:
                t["status"] = "completed"
                break
        _LOG.info("Task %s completed", tid)

    def get_result(self, tid: str) -> Dict[str, Any]:
        return self._results.get(tid)
