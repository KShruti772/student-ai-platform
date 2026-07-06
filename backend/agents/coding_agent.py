"""
Coding Agent

Generates code, scaffolds projects, and produces files. This local-first
implementation writes files to disk via safe file utilities and returns a
manifest of created files.
"""
from typing import Dict, Any, List
from agents.base_agent import BaseAgent
from skills.tools.file_tools import write_file
from utils.logger import get_logger

_LOG = get_logger(__name__)


class CodingAgent(BaseAgent):
    name = "coding"

    def __init__(self):
        super().__init__()

    def scaffold_project(self, spec: Dict[str, Any]) -> Dict[str, Any]:
        """Create simple project files from spec: {'files': [{'path':'','content':''}, ...]}"""
        created: List[str] = []
        files = spec.get("files", [])
        for f in files:
            path = f.get("path")
            content = f.get("content", "")
            write_file(path, content, overwrite=True)
            created.append(path)
            _LOG.info("CodingAgent created file %s", path)
        return {"created_files": created}

    def run_task(self, task: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        ttype = task.get("type")
        if ttype == "scaffold":
            return self.scaffold_project(task.get("spec", {}))
        if ttype == "generate_code":
            # simple passthrough: write provided files
            return self.scaffold_project(task.get("spec", {}))
        return {"error": "unsupported_task"}
"""
Coding Agent

Purpose:
- Generate code files and brief explanations for student projects.

Design:
- Produces `files` mapping and an explanation.
"""
from pathlib import Path
from typing import Dict, Any
import json
from local_ai.llm_client import default_llm
from utils.helpers import extract_text_from_llm_response
from utils.logger import get_logger

_LOG = get_logger(__name__)
PROMPT_PATH = Path(__file__).parents[1] / "prompts" / "coding_prompt.txt"


class CodingAgent:
    def __init__(self, llm=default_llm):
        self.llm = llm
        try:
            self.system_prompt = PROMPT_PATH.read_text(encoding="utf-8")
        except FileNotFoundError:
            self.system_prompt = "You are a coding agent that writes clean, commented code."

    def generate(self, spec: str) -> Dict[str, Any]:
        messages = [
            {"role": "system", "content": self.system_prompt},
            {"role": "user", "content": spec},
        ]
        raw = self.llm.generate_response(messages)
        text = extract_text_from_llm_response(raw)
        try:
            parsed = json.loads(text)
            return parsed
        except Exception:
            _LOG.warning("CodingAgent: returning raw text due to JSON parse failure")
            return {"raw": text}
