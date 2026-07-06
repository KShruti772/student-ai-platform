"""
Skill router: map user intent to relevant skills.

This router uses keyword heuristics and optional SKILL.md matching to select
skills. It is designed for clarity; replace the scoring with an LLM-based
semantic router later if desired.
"""
from typing import List, Dict
from utils.logger import get_logger
from .skill_loader import SkillLoader

_LOG = get_logger(__name__)

# Default keywords for quick routing
KEYWORD_MAP = {
    "fastapi-skill": ["api", "endpoint", "fastapi", "route", "uvicorn"],
    "react-skill": ["react", "component", "jsx", "props", "state"],
    "ml-skill": ["model", "train", "dataset", "embedding", "predict"],
    "debug-skill": ["error", "exception", "traceback", "bug", "fix"],
    "research-skill": ["search", "find", "retrieve", "document", "note"],
    "mentor-skill": ["explain", "why", "teach", "concept", "learn"],
}


class SkillRouter:
    def __init__(self, loader: SkillLoader = None):
        self.loader = loader or SkillLoader()

    def route(self, text: str, top_k: int = 3) -> List[str]:
        """Return `top_k` skill names relevant to `text`."""
        t = text.lower()
        scores: Dict[str, int] = {}
        for skill, kws in KEYWORD_MAP.items():
            score = sum(1 for kw in kws if kw in t)
            # boost if SKILL.md contains phrases
            skill_obj = self.loader.load(skill)
            if skill_obj and skill_obj.skill_md:
                if any(kw in skill_obj.skill_md.lower() for kw in kws):
                    score += 1
            if score > 0:
                scores[skill] = score

        # sort by score desc
        ranked = sorted(scores.items(), key=lambda x: x[1], reverse=True)
        result = [r[0] for r in ranked][:top_k]
        if not result:
            # fallback to mentor skill
            return ["mentor-skill"]
        return result
