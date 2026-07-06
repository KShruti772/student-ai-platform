"""
Debug Agent

Analyzes error messages and suggests fixes. This agent provides guidance and
can propose code changes but does not execute untrusted code directly.
"""
from typing import Dict, Any
from agents.base_agent import BaseAgent
from skills.tools.code_tools import analyze_python
from utils.logger import get_logger

_LOG = get_logger(__name__)


class DebugAgent(BaseAgent):
    name = "debug"

    def __init__(self):
        super().__init__()

    def analyze_error(self, error_text: str, code_snippet: str = None) -> Dict[str, Any]:
        _LOG.info("DebugAgent analyzing error")
        analysis = {"error_text": error_text}
        if code_snippet:
            analysis["code_analysis"] = analyze_python(code_snippet)
        # Very simple heuristics to suggest next steps
        suggestions = []
        if "traceback" in error_text.lower() or "exception" in error_text.lower():
            suggestions.append("Inspect the traceback and identify the failing file/line.")
        suggestions.append("Run tests locally and isolate the failing case.")
        return {"analysis": analysis, "suggestions": suggestions}

    def run_task(self, task: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        if task.get("type") == "analyze_error":
            return self.analyze_error(task.get("error_text", ""), task.get("code_snippet"))
        return {"error": "unsupported_task"}
