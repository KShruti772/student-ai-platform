"""
Project Evaluator

Performs basic quality checks on generated code: syntax, simple heuristics,
and reports issues. Designed to be lightweight and local-first.
"""
from typing import Dict, Any, List
from pathlib import Path
import ast
from utils.logger import get_logger

_LOG = get_logger(__name__)


class ProjectEvaluator:
    def __init__(self):
        pass

    def syntax_check(self, root: str) -> Dict[str, Any]:
        p = Path(root)
        py_files = list(p.rglob("*.py"))
        errors: List[Dict[str, str]] = []
        for f in py_files:
            try:
                ast.parse(f.read_text(encoding="utf-8"))
            except Exception as e:
                errors.append({"file": str(f), "error": str(e)})
        return {"errors": errors, "ok": len(errors) == 0}

    def quick_quality_report(self, root: str) -> Dict[str, Any]:
        # Runs syntax_check and basic heuristics
        syntax = self.syntax_check(root)
        # More checks can be added: complexity, docstrings, test coverage
        report = {"syntax": syntax, "notes": ["No deep static analysis performed."]}
        return report
