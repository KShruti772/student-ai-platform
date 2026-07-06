"""CodingAgent: generates, explains, and improves code snippets using local LLM."""
from typing import Dict, Any
from .base_agent import BaseAgent
from .llm import LocalLLM
from .logger import get_logger
import ast

_LOG = get_logger(__name__)


class CodingAgent(BaseAgent):
    def __init__(self, llm: LocalLLM = None):
        super().__init__('CodingAgent')
        self.llm = llm or LocalLLM()

    async def handle(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        task = payload.get('task') or payload.get('description') or ''
        mode = payload.get('mode', 'generate')  # generate | improve | explain
        if not task:
            return {'error': 'no_task'}

        if mode == 'explain':
            code = payload.get('code', '')
            return {'explanation': self._explain_code(code)}

        if mode == 'improve':
            code = payload.get('code', '')
            prompt = f"Improve the following Python code for clarity, performance, and correctness. Return improved code only.\n\n{code}"
            out = self.llm.generate(prompt)
            return {'improved_code': out}

        # default: generate code
        prompt = f"Write Python code for the following task. Include a short explanation.\n\nTask:\n{task}" 
        out = self.llm.generate(prompt)
        # try to separate code and explanation heuristically
        if '```' in out:
            parts = out.split('```')
            code = parts[1] if len(parts) > 1 else out
            explanation = parts[2] if len(parts) > 2 else ''
        else:
            code = out
            explanation = ''
        # quick static check
        issues = []
        try:
            ast.parse(code)
        except SyntaxError as e:
            issues.append({'type': 'syntax', 'message': str(e)})

        return {'code': code, 'explanation': explanation, 'issues': issues}

    def _explain_code(self, code: str) -> str:
        if not code:
            return 'No code provided.'
        prompt = f"Explain this Python code in beginner-friendly terms, with step-by-step comments:\n\n{code}"
        return self.llm.generate(prompt)
"""Coding Agent: generate and modify code using local LLM"""
from typing import Dict, Any
from .base_agent import BaseAgent
from .logger import get_logger
import importlib

_LOG = get_logger(__name__)


def get_local_llm():
    try:
        # prefer backend local client if available
        mod = importlib.import_module("local_ai.llm_client")
        return getattr(mod, "default_llm")
    except Exception:
        return None


class CodingAgent(BaseAgent):
    def __init__(self, file_writer=None):
        super().__init__("CodingAgent")
        self.llm = get_local_llm()
        self.file_writer = file_writer

    async def handle(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        task = payload.get("task")
        if not task:
            return {"error": "no_task"}
        prompt = payload.get("prompt") or f"Implement: {task.get('title')}"
        _LOG.info("CodingAgent using LLM to generate code for task: %s", task.get("title"))
        if self.llm:
            resp = self.llm.generate_response(prompt)
            content = resp.get("text") or resp.get("generated_text") or ""
        else:
            content = "# LLM not available; code generation skipped."

        filename = task.get("file", "main.py")
        path = payload.get("workspace", "./") + "/" + filename
        if self.file_writer:
            try:
                self.file_writer(path, content)
            except Exception as e:
                return {"error": "write_failed", "detail": str(e)}
        return {"path": path, "content_preview": content[:400]}
