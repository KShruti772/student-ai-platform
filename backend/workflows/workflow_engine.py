"""
Workflow Engine

Coordinates agents, routes tasks, and executes workflows. Designed for
readability and educational value. Uses in-memory TaskManager and simple
agent instantiation; replace or extend for production use.
"""
from typing import Dict, Any
from workflows.router import route_task
from workflows.task_manager import TaskManager
from utils.logger import get_logger

from agents.planner_agent import PlannerAgent
from agents.debug_agent import DebugAgent
from agents.coding_agent import CodingAgent
from agents.research_agent import ResearchAgent
from agents.memory_agent import MemoryAgent
from agents.skill_agent import SkillAgent
from agents.evaluator_agent import EvaluatorAgent
from agents.base_agent import BaseAgent
from agents.mentor_agent import MentorAgent

_LOG = get_logger(__name__)


class WorkflowEngine:
    def __init__(self):
        self.task_manager = TaskManager()
        # instantiate agents (could be lazy-loaded)
        self.agents: Dict[str, BaseAgent] = {
            "planner": PlannerAgent(),
            "debug": DebugAgent(),
            "coding": CodingAgent(),
            "research": ResearchAgent(),
            "memory": MemoryAgent(),
            "skill": SkillAgent(),
            "evaluator": EvaluatorAgent(),
            "mentor": MentorAgent(),
        }

    def submit_task(self, task: Dict[str, Any]) -> str:
        tid = self.task_manager.add_task(task)
        return tid

    def _execute_task(self, task: Dict[str, Any]) -> Dict[str, Any]:
        agent_name = route_task(task)
        _LOG.info("Routing task %s to agent %s", task.get("id"), agent_name)
        agent = self.agents.get(agent_name)
        if not agent:
            return {"error": "agent_not_found", "agent": agent_name}
        try:
            res = agent.run_task(task, {})
            return {"result": res, "agent": agent_name}
        except Exception as e:
            _LOG.exception("Agent execution failed: %s", e)
            return {"error": str(e)}

    def run_next(self) -> Dict[str, Any]:
        task = self.task_manager.get_next()
        if not task:
            return {"status": "no_pending"}
        tid = task.get("id")
        res = self._execute_task(task)
        self.task_manager.complete(tid, res)
        return {"task_id": tid, "result": res}

    def run_all(self):
        out = []
        while True:
            r = self.run_next()
            if r.get("status") == "no_pending":
                break
            out.append(r)
        return out
