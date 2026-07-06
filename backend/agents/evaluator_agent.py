"""
Evaluator Agent

Validates outputs, checks for hallucinations and basic correctness heuristics.
This agent helps the system decide whether generated content needs revision.
"""
from typing import Dict, Any
from agents.base_agent import BaseAgent
from utils.logger import get_logger

_LOG = get_logger(__name__)


class EvaluatorAgent(BaseAgent):
    name = "evaluator"

    def __init__(self):
        super().__init__()

    def validate_text(self, text: str) -> Dict[str, Any]:
        issues = []
        if len(text) < 20:
            issues.append("Answer too short")
        if "http" in text and "http" not in text[:10]:
            # naive check: external links may be unsupported
            issues.append("Contains external links")
        # placeholder hallucination check: look for 'I think' or 'maybe'
        if "I think" in text or "maybe" in text:
            issues.append("Hesitant language that may indicate low confidence")
        return {"issues": issues, "ok": len(issues) == 0}

    def run_task(self, task: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        if task.get("type") == "validate":
            return self.validate_text(task.get("text", ""))
        return {"error": "unsupported_task"}
