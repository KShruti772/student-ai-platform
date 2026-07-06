"""
Debugging Agent

Runs quick checks and asks the LLM for fixes when errors are found.
"""
from typing import Dict, Any
from .project_evaluator import ProjectEvaluator
from local_ai.llm_client import default_llm
from utils.logger import get_logger

_LOG = get_logger(__name__)


class DebugAgent:
    def __init__(self):
        self.eval = ProjectEvaluator()

    def analyze_and_fix(self, workspace_path: str) -> Dict[str, Any]:
        report = self.eval.quick_quality_report(workspace_path)
        if not report["syntax"]["ok"]:
            fixes = []
            for err in report["syntax"]["errors"]:
                file = err.get("file")
                msg = err.get("error")
                prompt = f"Suggest a minimal patch to fix this Python syntax error in {file}: {msg}\nReturn a patch in unified diff format." 
                _LOG.info("DebugAgent asking LLM to fix %s", file)
                resp = default_llm.generate_response(prompt)
                fixes.append({"file": file, "suggestion": resp})
            return {"fixed": False, "fixes": fixes}
        return {"fixed": True, "report": report}
