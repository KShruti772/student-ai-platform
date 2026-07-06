"""
Dynamic skill loader.

Loads skill metadata from `SKILL.md` and provides access to prompt/templates.
Skills follow the structure:
skills_catalog/<skill_name>/SKILL.md
                           /prompts/
                           /templates/
                           /examples/
"""
from pathlib import Path
from typing import Dict, Optional
import json

SKILLS_ROOT = Path(__file__).parents[1] / "skills_catalog"


class Skill:
    def __init__(self, name: str, root: Path):
        self.name = name
        self.root = root
        self.skill_md = (root / "SKILL.md").read_text(encoding="utf-8") if (root / "SKILL.md").exists() else ""

    def get_prompt(self, prompt_name: str) -> Optional[str]:
        p = self.root / "prompts" / prompt_name
        if p.exists():
            return p.read_text(encoding="utf-8")
        return None

    def get_template(self, template_name: str) -> Optional[str]:
        p = self.root / "templates" / template_name
        if p.exists():
            return p.read_text(encoding="utf-8")
        return None

    def to_dict(self) -> Dict:
        return {"name": self.name, "skill_md": self.skill_md}


class SkillLoader:
    def __init__(self, skills_root: Path = None):
        self.skills_root = skills_root or SKILLS_ROOT
        self._cache: Dict[str, Skill] = {}

    def discover(self) -> Dict[str, Skill]:
        skills = {}
        if not self.skills_root.exists():
            return skills
        for child in self.skills_root.iterdir():
            if child.is_dir():
                name = child.name
                skills[name] = Skill(name, child)
        self._cache = skills
        return skills

    def load(self, name: str) -> Optional[Skill]:
        if name in self._cache:
            return self._cache[name]
        path = self.skills_root / name
        if path.exists() and path.is_dir():
            s = Skill(name, path)
            self._cache[name] = s
            return s
        return None
