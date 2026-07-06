"""
Code analysis tools: simple static inspections for Python.
"""
import ast
from typing import Dict, Any


def analyze_python(code: str) -> Dict[str, Any]:
    """Return basic analysis: functions, classes, imports, and syntax errors."""
    try:
        tree = ast.parse(code)
    except Exception as e:
        return {"error": str(e)}

    funcs = [n.name for n in ast.walk(tree) if isinstance(n, ast.FunctionDef)]
    classes = [n.name for n in ast.walk(tree) if isinstance(n, ast.ClassDef)]
    imports = [n.names[0].name for n in ast.walk(tree) if isinstance(n, ast.Import)]
    return {"functions": funcs, "classes": classes, "imports": imports}
