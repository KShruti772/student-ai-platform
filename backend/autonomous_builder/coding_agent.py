"""
Coding Agent

Generates code files from task descriptions using an LLM. Writes files via
the FileGenerator and registers actions with the ToolRegistry.
"""
from typing import Dict, Any
from local_ai.llm_client import default_llm
from .file_generator import FileGenerator
from utils.logger import get_logger

_LOG = get_logger(__name__)


class CodingAgent:
    def __init__(self, file_generator: FileGenerator):
        self.fg = file_generator

    def generate_file_from_task(self, workspace_path: str, task: Dict[str, Any]) -> Dict[str, Any]:
        title = task.get("title", "Implement feature")
        prompt = f"Write a Python file for the task: {title}\nInclude minimal tests and docstring. Return only the file content."
        _LOG.info("CodingAgent prompting LLM for task: %s", title)
        resp = default_llm.generate_response(prompt)
        # heuristic: determine filename from task
        filename = task.get("file", "main.py")
        file_path = f"{workspace_path}/{filename}"
        self.fg.write_files([{"path": file_path, "content": resp.get("text", "# no content") }])
        return {"path": file_path, "llm": resp}
