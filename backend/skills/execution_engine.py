"""
Execution engine that coordinates skill loading, prompt injection and tool calls.

The engine keeps a lightweight lifecycle for skills: load, execute, unload.
It injects skill instructions into the prompt messages passed to an LLM.
"""
from typing import List, Dict, Any, Optional
from .skill_loader import SkillLoader
from .skill_router import SkillRouter
from .tool_registry import ToolRegistry
from utils.logger import get_logger

_LOG = get_logger(__name__)


class ExecutionEngine:
    def __init__(self, skill_loader: SkillLoader = None, router: SkillRouter = None, tool_registry: ToolRegistry = None):
        self.loader = skill_loader or SkillLoader()
        self.router = router or SkillRouter()
        self.tools = tool_registry or ToolRegistry()
        self._loaded_skills = {}

    def detect_and_load(self, text: str, top_k: int = 3) -> List[str]:
        skills = self.router.route(text, top_k=top_k)
        loaded = []
        for s in skills:
            skill_obj = self.loader.load(s)
            if skill_obj:
                self._loaded_skills[s] = skill_obj
                loaded.append(s)
                _LOG.info("Loaded skill %s", s)
            else:
                _LOG.warning("Skill %s not found on disk", s)
        return loaded

    def inject_skill_instructions(self, messages: List[Dict[str, str]]) -> List[Dict[str, str]]:
        # prepend loaded skill instructions (SKILL.md content) into system message
        instructions = []
        for skill in self._loaded_skills.values():
            if skill.skill_md:
                instructions.append(skill.skill_md)

        if not instructions:
            return messages

        # find first system message or create one
        new_messages = []
        system_prefixed = False
        for msg in messages:
            if msg.get("role") == "system" and not system_prefixed:
                content = msg.get("content", "") + "\n\n" + "\n\n".join(instructions)
                new_messages.append({"role": "system", "content": content})
                system_prefixed = True
            else:
                new_messages.append(msg)

        if not system_prefixed:
            new_messages = [{"role": "system", "content": "\n\n".join(instructions)}] + new_messages

        return new_messages

    def unload_all(self):
        self._loaded_skills = {}
        _LOG.info("Unloaded all skills")
