"""
Security Checker

Detects common insecure code patterns and prevents unsafe command execution.
This scanner is intentionally conservative and reports possible issues rather
than blocking automatically—human-in-the-loop approval is recommended.
"""
from typing import Dict, Any, List
from pathlib import Path
import re
from utils.logger import get_logger

_LOG = get_logger(__name__)


class SecurityChecker:
    def __init__(self):
        pass

    def scan_code(self, root: str) -> Dict[str, Any]:
        p = Path(root)
        py_files = list(p.rglob("*.py"))
        findings: List[Dict[str, str]] = []
        for f in py_files:
            text = f.read_text(encoding="utf-8")
            if "exec(" in text or "eval(" in text:
                findings.append({"file": str(f), "issue": "use_of_exec_or_eval"})
            if re.search(r"subprocess\.Popen|subprocess\.run", text):
                findings.append({"file": str(f), "issue": "subprocess_usage"})
            if re.search(r"API_KEY|SECRET|PASSWORD\s*=", text):
                findings.append({"file": str(f), "issue": "possible_hardcoded_secret"})
        return {"findings": findings, "safe": len(findings) == 0}

    def validate_workflow(self, workflow: Dict[str, Any]) -> Dict[str, Any]:
        # ensure any run_script actions require explicit allow_run=True
        problems = []
        for step in workflow.get("steps", []):
            if step.get("action") == "run_script" and not step.get("allow_run", False):
                problems.append({"step": step, "issue": "script_execution_not_allowed"})
        return {"problems": problems, "ok": len(problems) == 0}
