"""
Skill Registry: register and query available skills and metadata.

Keeps a simple in-memory registry that can be saved/loaded if desired.
"""
from typing import Dict, Any
from .skill_loader import SkillLoader


class SkillRegistry:
    def __init__(self, loader: SkillLoader = None):
        self.loader = loader or SkillLoader()
        self._registry: Dict[str, Dict[str, Any]] = {}

    def refresh(self):
        skills = self.loader.discover()
        for name, skill in skills.items():
            self._registry[name] = {"name": name, "description": skill.skill_md[:400]}
        return self._registry

    def list(self):
        if not self._registry:
            self.refresh()
        return self._registry

    def get(self, name: str):
        if name not in self._registry:
            self.refresh()
        return self._registry.get(name)
