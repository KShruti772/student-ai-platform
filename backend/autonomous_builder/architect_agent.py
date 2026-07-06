"""
Project Architect Agent

Analyzes project goals and recommends architecture, stack, and folder layout.
Provides human-friendly explanations of WHY each choice was made to help students learn.
"""
from typing import Dict, Any, List
from utils.logger import get_logger

_LOG = get_logger(__name__)


class ArchitectAgent:
    """Selects tech stack and generates folder structure based on a goal."""

    def __init__(self):
        pass

    def analyze_goal(self, goal: str) -> Dict[str, Any]:
        """Return recommended architecture and rationale.

        This uses simple heuristics to pick stacks appropriate for common goals.
        """
        g = goal.lower()
        stack = []
        rationale = []

        # Choose backend
        if any(k in g for k in ["api", "endpoint", "server"]):
            stack.append("fastapi")
            rationale.append("FastAPI is lightweight, fast, and great for building educational APIs.")
        elif any(k in g for k in ["web", "frontend", "ui"]):
            stack.append("react")
            rationale.append("React is a popular frontend library and good for learning component-based UI.")
        else:
            stack.append("python")
            rationale.append("General Python stack is flexible for small projects and learning.")

        # Choose ML components
        if any(k in g for k in ["model", "train", "predict", "ml"]):
            stack.append("sentence-transformers (embeddings)")
            rationale.append("Use sentence-transformers for local embeddings and RAG-friendly pipelines.")

        # Database choice (lightweight and local-first)
        stack.append("sqlite")
        rationale.append("SQLite keeps data local and is easy to use for students.")

        # Draft folder structure
        folders = [
            "src/",
            "src/api/",
            "src/app/",
            "tests/",
            "docs/",
            "data/",
        ]

        explanation = {
            "goal": goal,
            "selected_stack": stack,
            "rationale": rationale,
            "folders": folders,
        }
        _LOG.info("Architect selected stack: %s", stack)
        return explanation

    def generate_folder_structure(self, base_path: str, folders: List[str]) -> Dict[str, Any]:
        """Create the folder list (does not write files unless requested).

        Returns the list of paths that should be created for the project.
        """
        from pathlib import Path
        bp = Path(base_path)
        created = []
        for f in folders:
            p = bp / f
            p.mkdir(parents=True, exist_ok=True)
            created.append(str(p))
        return {"created": created}
