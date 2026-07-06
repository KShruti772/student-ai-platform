"""
Execution Agent (simulated)

Purpose:
- Provide a safe interface to run small code snippets or tests and return outputs.

Design:
- For safety in this educational platform, the agent simulates execution and provides
  clear instructions for running code locally. This avoids running arbitrary code on the server.
"""
from pathlib import Path
from typing import Dict, Any
import json
from local_ai.llm_client import default_llm
from utils.helpers import extract_text_from_llm_response
from utils.logger import get_logger

_LOG = get_logger(__name__)
PROMPT_PATH = Path(__file__).parents[1] / "prompts" / "execution_prompt.txt"


class ExecutionAgent:
    def __init__(self, llm=default_llm):
        self.llm = llm
        try:
            self.system_prompt = PROMPT_PATH.read_text(encoding="utf-8")
        except FileNotFoundError:
            self.system_prompt = "You are an execution agent that simulates running code safely."

    def run(self, code: str) -> Dict[str, Any]:
        """
        Simulate running code and return structured output with safety notes.

        In production, this should be replaced by a sandboxed runner.
        """
        messages = [
            {"role": "system", "content": self.system_prompt},
            {"role": "user", "content": f"Simulate running this code and return stdout/stderr/status:\n{code}"},
        ]
        raw = self.llm.generate_response(messages)
        text = extract_text_from_llm_response(raw)
        try:
            return json.loads(text)
        except Exception:
            _LOG.warning("ExecutionAgent: returning raw text due to JSON parse failure")
            return {"raw": text, "notes": "This is a simulated run. Replace with sandboxed execution for real runs."}
