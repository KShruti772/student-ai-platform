"""
Skill Executor: run skill workflows, execute safe scripts, and coordinate with agents.

Key responsibilities:
- Load skill context only when needed
- Execute steps in a defined workflow spec
- Call local tools via existing `skills.tool_registry` or subprocess when safe
- Record usage in `SkillMemory`

This module emphasizes safety: scripts are executed only when flagged as
`allow_run` in the workflow spec. By default, workflows should generate
files/templates rather than execute arbitrary shell commands.
"""
from typing import Dict, Any, List, Optional
from .skill_loader import SkillLoader
from .skill_memory import SkillMemory
from skills.tool_registry import ToolRegistry
from utils.logger import get_logger
import subprocess
from pathlib import Path

_LOG = get_logger(__name__)


class SkillExecutor:
    def __init__(self, loader: SkillLoader = None, memory: SkillMemory = None, tools: ToolRegistry = None):
        self.loader = loader or SkillLoader()
        self.memory = memory or SkillMemory()
        self.tools = tools or ToolRegistry()

    def _run_shell(self, cmd: List[str], cwd: Optional[str] = None, timeout: int = 30) -> Dict[str, Any]:
        try:
            _LOG.info("Executing shell command: %s", " ".join(cmd))
            proc = subprocess.run(cmd, capture_output=True, text=True, cwd=cwd, timeout=timeout)
            return {"returncode": proc.returncode, "stdout": proc.stdout, "stderr": proc.stderr}
        except Exception as e:
            _LOG.exception("Shell execution failed: %s", e)
            return {"error": str(e)}

    def execute_workflow(self, skill_name: str, workflow: Dict[str, Any], session_id: str = "default") -> Dict[str, Any]:
        """Execute a skill workflow.

        Workflow example:
        {
            "steps": [
                {"action": "render_template", "template": "api.py", "vars": {...}},
                {"action": "run_script", "script": "migrate.sh", "allow_run": True}
            ]
        }
        """
        skill = self.loader.load(skill_name)
        if not skill:
            return {"error": "skill_not_found"}

        results = []
        for step in workflow.get("steps", []):
            action = step.get("action")
            if action == "render_template":
                tmpl_name = step.get("template")
                tmpl = skill.load_template(tmpl_name)
                if tmpl is None:
                    results.append({"step": step, "error": "template_not_found"})
                    continue
                # Very simple var substitution for teaching purposes
                content = tmpl
                vars = step.get("vars", {})
                for k, v in vars.items():
                    content = content.replace(f"{{{{{k}}}}}", str(v))
                out_path = step.get("output") or str(Path.cwd() / tmpl_name)
                Path(out_path).parent.mkdir(parents=True, exist_ok=True)
                Path(out_path).write_text(content, encoding="utf-8")
                results.append({"step": step, "output": out_path})

            elif action == "run_script":
                script = step.get("script")
                allow = bool(step.get("allow_run", False))
                script_path = skill.get_script_path(script)
                if not script_path:
                    results.append({"step": step, "error": "script_not_found"})
                    continue
                if not allow:
                    results.append({"step": step, "error": "script_execution_not_allowed", "script": str(script_path)})
                    continue
                # Execute via shell safely
                out = self._run_shell([str(script_path)], cwd=str(script_path.parent))
                results.append({"step": step, "result": out})

            elif action == "call_tool":
                tool_name = step.get("tool")
                tool = self.tools.get(tool_name)
                if not tool:
                    results.append({"step": step, "error": "tool_not_registered"})
                    continue
                try:
                    res = tool.func(**(step.get("params", {})))
                    results.append({"step": step, "result": res})
                except Exception as e:
                    results.append({"step": step, "error": str(e)})

            else:
                results.append({"step": step, "error": "unknown_action"})

        # record usage in memory
        self.memory.append(session_id, {"skill": skill_name, "workflow": workflow, "results": results})
        return {"results": results}
