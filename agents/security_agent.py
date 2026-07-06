"""Security Agent: detect prompt injection, dangerous code, and secrets"""
from typing import Dict, Any, List
from .base_agent import BaseAgent
import re


class SecurityAgent(BaseAgent):
    def __init__(self):
        super().__init__("SecurityAgent")

    async def handle(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        code = payload.get("code", "")
        prompt = payload.get("prompt", "")
        findings: List[Dict[str, str]] = []
        # detect simple prompt injection patterns
        if "ignore the instructions" in prompt.lower() or "follow these new instructions" in prompt.lower():
            findings.append({"type": "prompt_injection", "detail": "suspicious instruction override"})
        # detect dangerous code patterns
        if re.search(r"\beval\(|\bexec\(|subprocess\.|os\.system\(|popen\(|rm -rf", code):
            findings.append({"type": "dangerous_code", "detail": "uses exec/eval/subprocess or destructive shell"})
        # detect potential secrets
        if re.search(r"(API_KEY|SECRET|PASSWORD)\s*=", code, re.IGNORECASE):
            findings.append({"type": "possible_secret", "detail": "hardcoded credential-like string"})
        return {"findings": findings, "ok": len(findings) == 0}
