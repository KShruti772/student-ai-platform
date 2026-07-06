"""
Architect Agent

Purpose:
- Translate planner output into a concrete software architecture and implementation roadmap.

Design:
- Returns structured JSON describing components, folders, interfaces and rationale.
"""
from pathlib import Path
from typing import Dict, Any
import json
from local_ai.llm_client import default_llm
from utils.helpers import extract_text_from_llm_response
from utils.logger import get_logger

_LOG = get_logger(__name__)
PROMPT_PATH = Path(__file__).parents[1] / "prompts" / "architect_prompt.txt"


class ArchitectAgent:
    def __init__(self, llm=default_llm):
        self.llm = llm
        try:
            self.system_prompt = PROMPT_PATH.read_text(encoding="utf-8")
        except FileNotFoundError:
            self.system_prompt = "You are an architect that maps plans to software structure."

    def design(self, plan: str) -> Dict[str, Any]:
        messages = [
            {"role": "system", "content": self.system_prompt},
            {"role": "user", "content": plan},
        ]
        raw = self.llm.generate_response(messages)
        text = extract_text_from_llm_response(raw)
        try:
            return json.loads(text)
        except Exception:
            _LOG.warning("ArchitectAgent: returning raw text due to JSON parse failure")
            return {"raw": text}
