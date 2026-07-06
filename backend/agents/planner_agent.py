"""
Planner Agent

Analyzes student goals, breaks them into subtasks, and decides which agents
should be involved. Returns an ordered plan the workflow engine can execute.
"""
from typing import Dict, Any, List
from agents.base_agent import BaseAgent
from utils.logger import get_logger

_LOG = get_logger(__name__)


class PlannerAgent(BaseAgent):
    name = "planner"

    def __init__(self):
        super().__init__()

    def generate_plan(self, goal: str) -> Dict[str, Any]:
        """Create a simple plan: decompose goal into steps and select agents.

        This is intentionally simple and deterministic so students can read it.
        """
        _LOG.info("Planner generating plan for goal: %s", goal)
        # Naive decomposition by sentences and keywords
        steps: List[Dict[str, Any]] = []
        # Example heuristic: if goal contains 'api' use coding+fastapi
        text = goal.lower()
        agents = ["mentor", "research", "coding", "debug", "evaluator"]
        if "api" in text or "endpoint" in text or "fastapi" in text:
            agents = ["planner", "coding", "mentor", "debug", "evaluator"]
        if "train" in text or "model" in text:
            agents = ["research", "ml", "coding", "evaluator"]

        # Split into simple steps
        parts = [p.strip() for p in goal.split(".") if p.strip()]
        if not parts:
            parts = [goal]

        for i, p in enumerate(parts):
            steps.append({"id": f"step_{i}", "task": p, "assigned_agents": agents})

        plan = {"goal": goal, "steps": steps, "selected_agents": list(dict.fromkeys(agents))}
        return plan

    def run_task(self, task: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        # Planner can run a generate_plan task
        if task.get("type") == "generate_plan":
            return self.generate_plan(task.get("goal", ""))
        return {"error": "unsupported_task"}
"""
Planner Agent

Purpose:
- Convert student goals into project plans, milestones and tech suggestions.
"""
from pathlib import Path
from typing import Dict, Any
from local_ai.llm_client import default_llm
from utils.helpers import extract_text_from_llm_response


PROMPT_PATH = Path(__file__).parents[1] / "prompts" / "planner_prompt.txt"


class PlannerAgent:
    def __init__(self, llm=default_llm):
        self.llm = llm
        self.system_prompt = self._load_prompt()

    def _load_prompt(self) -> str:
        try:
            return PROMPT_PATH.read_text(encoding="utf-8")
        except FileNotFoundError:
            return "You are a planner that converts goals into step-by-step plans."

    def generate(self, goal: str) -> str:
        messages = [
            {"role": "system", "content": self.system_prompt},
            {"role": "user", "content": goal},
        ]
        resp = self.llm.generate_response(messages)
        return extract_text_from_llm_response(resp)
