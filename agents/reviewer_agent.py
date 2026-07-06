"""ReviewerAgent: simple static review for bugs, security, and style hints."""
from typing import Dict, Any
from .base_agent import BaseAgent
from .logger import get_logger
import ast

_LOG = get_logger(__name__)


class ReviewerAgent(BaseAgent):
    def __init__(self):
        super().__init__('ReviewerAgent')

    async def handle(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        code = payload.get('code')
        if not code:
            return {'error': 'no_code'}
        issues = []
        try:
            tree = ast.parse(code)
        except SyntaxError as e:
            return {'issues': [{'type': 'syntax', 'message': str(e)}]}

        # simple checks: look for eval/exec, insecure imports, large functions
        src = code
        if 'eval(' in src or 'exec(' in src:
            issues.append({'type': 'security', 'message': 'Use of eval/exec detected'})
        if 'subprocess' in src:
            issues.append({'type': 'security', 'message': 'subprocess usage; ensure safe args and sandboxing'})

        func_count = sum(1 for n in ast.walk(tree) if isinstance(n, ast.FunctionDef))
        if func_count == 0:
            issues.append({'type': 'design', 'message': 'No functions defined; consider modularizing logic into functions'})

        # complexity heuristic: long source
        if len(src) > 2000:
            issues.append({'type': 'style', 'message': 'Large file; consider splitting into modules'})

        return {'issues': issues, 'confidence': 0.7}
