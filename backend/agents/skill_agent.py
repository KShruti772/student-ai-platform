"""
Skill Agent

Loads and executes reusable skill workflows. This simulates Antigravity-style
skills by loading templates from `skills_catalog` and executing a small set
of pre-defined actions.
"""
from typing import Dict, Any
from agents.base_agent import BaseAgent
from skills.skill_loader import SkillLoader
from utils.logger import get_logger

_LOG = get_logger(__name__)


class SkillAgent(BaseAgent):
    name = "skill"

    def __init__(self):
        super().__init__()
        self.loader = SkillLoader()

    def run_skill(self, skill_name: str, params: Dict[str, Any]) -> Dict[str, Any]:
        skill = self.loader.load(skill_name)
        if not skill:
            return {"error": "skill_not_found"}
        # As a simple behavior, return the SKILL.md and any requested prompt
        prompt = params.get("prompt")
        prompt_text = skill.get_prompt(prompt) if prompt else None
        return {"skill": skill.to_dict(), "prompt": prompt_text}

    def run_task(self, task: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        if task.get("type") == "run_skill":
            return self.run_skill(task.get("skill_name", ""), task.get("params", {}))
        return {"error": "unsupported_task"}
