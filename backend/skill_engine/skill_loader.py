"""
Skill loader: discover and lazily load skill resources.

Design goals:
- Discover skills under `backend/skills/`.
- Parse `SKILL.md` for human-readable instructions.
- Load templates/scripts/references on demand to save memory.

This implementation is beginner-friendly and intentionally simple so students
can read and extend it.
"""
from pathlib import Path
from typing import Dict, Optional
from utils.logger import get_logger

_LOG = get_logger(__name__)

SKILLS_ROOT = Path(__file__).parents[1].parent / "skills"


class Skill:
    def __init__(self, name: str, root: Path):
        self.name = name
        self.root = root
        self._skill_md = None

    @property
    def skill_md(self) -> str:
        if self._skill_md is None:
            md_file = self.root / "SKILL.md"
            if md_file.exists():
                self._skill_md = md_file.read_text(encoding="utf-8")
            else:
                self._skill_md = ""
        return self._skill_md

    def list_templates(self):
        tdir = self.root / "templates"
        if not tdir.exists():
            return []
        return [p.name for p in tdir.iterdir() if p.is_file()]

    def load_template(self, name: str) -> Optional[str]:
        p = self.root / "templates" / name
        if p.exists():
            return p.read_text(encoding="utf-8")
        return None

    def list_scripts(self):
        sdir = self.root / "scripts"
        if not sdir.exists():
            return []
        return [p.name for p in sdir.iterdir() if p.is_file()]

    def get_script_path(self, name: str) -> Optional[Path]:
        p = self.root / "scripts" / name
        if p.exists():
            return p
        return None

    def list_references(self):
        rdir = self.root / "references"
        if not rdir.exists():
            return []
        return [p.name for p in rdir.iterdir() if p.is_file()]

    def load_reference(self, name: str) -> Optional[str]:
        p = self.root / "references" / name
        if p.exists():
            return p.read_text(encoding="utf-8")
        return None


class SkillLoader:
    def __init__(self, skills_root: Path = None):
        self.skills_root = Path(skills_root) if skills_root else SKILLS_ROOT
        self._cache: Dict[str, Skill] = {}

    def discover(self) -> Dict[str, Skill]:
        """Discover all skill folders under `skills_root`."""
        skills = {}
        if not self.skills_root.exists():
            _LOG.warning("Skills root does not exist: %s", self.skills_root)
            return skills
        for child in self.skills_root.iterdir():
            if child.is_dir():
                name = child.name
                skills[name] = Skill(name, child)
        self._cache = skills
        return skills

    def load(self, name: str) -> Optional[Skill]:
        """Load a skill by name, returning a `Skill` object or None."""
        if name in self._cache:
            return self._cache[name]
        path = self.skills_root / name
        if path.exists() and path.is_dir():
            s = Skill(name, path)
            self._cache[name] = s
            return s
        _LOG.warning("Skill not found: %s", name)
        return None
