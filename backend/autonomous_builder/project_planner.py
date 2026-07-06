"""
Project Planner

Breaks a high-level project goal into ordered subtasks and priorities.
Produces a roadmap that the Task Graph can use to schedule work.
"""
from typing import Dict, Any, List
from utils.logger import get_logger
import uuid

_LOG = get_logger(__name__)


class ProjectPlanner:
    def __init__(self):
        pass

    def create_roadmap(self, goal: str) -> Dict[str, Any]:
        """Return a simple roadmap: list of tasks with ids and dependencies.

        This is deliberately straightforward so students can inspect and modify it.
        """
        _LOG.info("Creating roadmap for goal: %s", goal)
        # Primitive decomposition: split by sentence and create tasks
        parts = [p.strip() for p in goal.split(".") if p.strip()]
        if not parts:
            parts = [goal]

        tasks: List[Dict[str, Any]] = []
        prev_id = None
        for i, p in enumerate(parts):
            tid = f"task_{i}_{uuid.uuid4().hex[:6]}"
            task = {"id": tid, "title": p, "priority": i + 1, "depends_on": []}
            if prev_id:
                task["depends_on"].append(prev_id)
            tasks.append(task)
            prev_id = tid

        roadmap = {"goal": goal, "tasks": tasks}
        return roadmap
