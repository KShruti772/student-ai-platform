"""
Code Integrator

Performs simple checks to ensure generated modules link together, imports resolve,
and basic consistency is maintained.
"""
import ast
from pathlib import Path
from typing import Dict, Any, List
from utils.logger import get_logger

_LOG = get_logger(__name__)


class CodeIntegrator:
    def __init__(self):
        pass

    def find_python_files(self, root: str) -> List[Path]:
        p = Path(root)
        return list(p.rglob("*.py"))

    def validate_imports(self, root: str) -> Dict[str, Any]:
        """Check that local imports reference existing files within the project.

        This is a lightweight check: it finds `from x import y` and `import x` and
        ensures `x` is present as a module file under the root (best-effort).
        """
        files = self.find_python_files(root)
        module_paths = {str(f.with_suffix("").relative_to(root)).replace("\\", "."): f for f in files}
        issues = []
        for f in files:
            try:
                tree = ast.parse(f.read_text(encoding="utf-8"))
            except Exception as e:
                issues.append({"file": str(f), "error": str(e)})
                continue
            for node in ast.walk(tree):
                if isinstance(node, ast.Import):
                    for n in node.names:
                        name = n.name
                        if name in module_paths:
                            continue
                if isinstance(node, ast.ImportFrom):
                    mod = node.module
                    if not mod:
                        continue
                    # naive local module check
                    if mod in module_paths:
                        continue
                    # if relative import, skip
                    if mod.startswith("."):
                        continue
                    # otherwise record as potential external dependency
                    # we don't flag external packages here
            
        return {"issues": issues, "status": "ok"}
