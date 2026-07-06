"""PlannerAgent: breaks user prompt into steps and assigns agents."""
from typing import Dict, Any, List
import asyncio
from .base_agent import BaseAgent
from .llm import LocalLLM
from .logger import get_logger

_LOG = get_logger(__name__)


class PlannerAgent(BaseAgent):
    def __init__(self, llm: LocalLLM = None):
        super().__init__('PlannerAgent')
        self.llm = llm or LocalLLM()

    async def handle(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        prompt = payload.get('prompt')
        if not prompt:
            return {'error': 'no_prompt'}

        # Create a planning prompt for the local LLM
        p = (
            f"You are a planner. Break the following user request into 4-8 concrete steps. "
            f"For each step, assign one of: research, coding, review, mentor, memory. "
            f"Provide JSON array of {{'step':..., 'agent':..., 'description':...}}.\n\nUser request:\n{prompt}"
        )
        raw = self.llm.generate(p)
        # try to parse as JSON; if fails, fallback to heuristic split
        import json
        try:
            arr = json.loads(raw)
            return {'plan': arr, 'explanation': 'LLM produced structured plan'}
        except Exception:
            # fallback: simple sentence split
            parts = [s.strip() for s in prompt.split('.') if s.strip()]
            plan = []
            for i, part in enumerate(parts[:6]):
                agent = 'research' if i == 0 else ('coding' if i % 2 == 1 else 'review')
                plan.append({'step': i + 1, 'agent': agent, 'description': part})
            return {'plan': plan, 'explanation': 'fallback simple plan'}
"""Planner Agent: breaks user tasks into structured execution plans"""
from typing import Dict, Any
import uuid
from .base_agent import BaseAgent


class PlannerAgent(BaseAgent):
    def __init__(self):
        super().__init__("PlannerAgent")

    async def handle(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        goal = payload.get("goal", "")
        if not goal:
            return {"error": "no_goal_provided"}
        steps = [s.strip() for s in goal.split(".") if s.strip()]
        if not steps:
            steps = [goal]
        tasks = []
        prev_id = None
        for i, s in enumerate(steps):
            tid = f"task_{i}_{uuid.uuid4().hex[:6]}"
            task = {"id": tid, "title": s, "priority": i+1, "depends_on": []}
            if prev_id:
                task["depends_on"].append(prev_id)
            tasks.append(task)
            prev_id = tid
        plan = {"goal": goal, "tasks": tasks}
        return plan
